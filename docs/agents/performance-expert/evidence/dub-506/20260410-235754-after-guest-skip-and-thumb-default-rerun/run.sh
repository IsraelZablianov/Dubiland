#!/usr/bin/env bash
set -euo pipefail
ROOT="/Users/israelz/Documents/dev/AI/Learning"
WEB="$ROOT/packages/web"
OUT_DIR="$1"

rm -rf "$WEB/dist"
(
  cd "$WEB"
  yarn vite build > "$OUT_DIR/build.log" 2>&1
)

(
  cd "$WEB"
  yarn vite preview --host 127.0.0.1 --port 4173 > "$OUT_DIR/preview.log" 2>&1 &
  PREVIEW_PID=$!
  cleanup() {
    if kill -0 "$PREVIEW_PID" >/dev/null 2>&1; then
      kill "$PREVIEW_PID" >/dev/null 2>&1 || true
      wait "$PREVIEW_PID" >/dev/null 2>&1 || true
    fi
  }
  trap cleanup EXIT

  for _ in {1..40}; do
    if curl -sSf "http://127.0.0.1:4173/" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  for pair in "root:/" "profiles:/profiles" "games:/games"; do
    key="${pair%%:*}"
    route="${pair#*:}"
    url="http://127.0.0.1:4173${route}"
    npx lighthouse "$url" \
      --quiet \
      --chrome-flags='--headless=new --no-sandbox --disable-dev-shm-usage' \
      --only-categories=performance \
      --preset=perf \
      --output=json \
      --output-path="$OUT_DIR/lighthouse/${key}.json"
  done
)

jq -n '
  def route_metric($name; $doc): {
    route: $name,
    performance: (($doc.categories.performance.score * 100) | round),
    fcp_ms: $doc.audits["first-contentful-paint"].numericValue,
    lcp_ms: $doc.audits["largest-contentful-paint"].numericValue,
    tbt_ms: $doc.audits["total-blocking-time"].numericValue,
    cls: $doc.audits["cumulative-layout-shift"].numericValue,
    speed_index_ms: $doc.audits["speed-index"].numericValue
  };
  [
    route_metric("root"; (input)),
    route_metric("profiles"; (input)),
    route_metric("games"; (input))
  ] as $routes |
  {
    routes: $routes,
    aggregate: {
      count: ($routes | length),
      perf_median: ($routes | map(.performance) | sort | .[length/2|floor]),
      lcp_median_ms: ($routes | map(.lcp_ms) | sort | .[length/2|floor]),
      worst_lcp_route: ($routes | max_by(.lcp_ms)),
      worst_perf_route: ($routes | min_by(.performance))
    }
  }
' \
  "$OUT_DIR/lighthouse/root.json" \
  "$OUT_DIR/lighthouse/profiles.json" \
  "$OUT_DIR/lighthouse/games.json" \
  > "$OUT_DIR/lighthouse-summary.json"
