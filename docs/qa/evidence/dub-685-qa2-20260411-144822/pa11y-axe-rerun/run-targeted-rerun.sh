#!/usr/bin/env bash
set -u
BASE_URL="http://127.0.0.1:4187"
EVIDENCE_DIR="docs/qa/evidence/dub-685-qa2-20260411-144822"
OUT_DIR="$EVIDENCE_DIR/pa11y-axe-rerun"

routes=(
  "/"
  "/games"
  "/games/reading/picture-to-word-builder"
  "/games/reading/confusable-letter-contrast"
)

for route in "${routes[@]}"; do
  slug="$(echo "$route" | sed 's#^/##' | sed 's#[^a-zA-Z0-9]#_#g' | tr 'A-Z' 'a-z')"
  if [ -z "$slug" ]; then slug="root"; fi

  cfg="$OUT_DIR/configs/${slug}.json"

  if [[ "$route" == "/" ]]; then
    cat > "$cfg" <<JSON
{
  "standard": "WCAG2AA",
  "timeout": 120000,
  "wait": 500,
  "actions": [
    "navigate to ${BASE_URL}/",
    "wait for path to be /",
    "wait for element #root > div to be visible"
  ]
}
JSON
  else
    cat > "$cfg" <<JSON
{
  "standard": "WCAG2AA",
  "timeout": 120000,
  "wait": 500,
  "actions": [
    "navigate to ${BASE_URL}/login",
    "wait for path to be /login",
    "wait for element .login-page__guest-cta button to be visible",
    "click element .login-page__guest-cta button",
    "wait for path to be /profiles",
    "wait for element footer button:last-child to be visible",
    "click element footer button:last-child",
    "wait for path to be /games",
    "navigate to ${BASE_URL}${route}",
    "wait for path to be ${route}",
    "wait for element #root > div to be visible"
  ]
}
JSON
  fi

  npx --yes pa11y "${BASE_URL}${route}" --config "$cfg" --runner axe --reporter json \
    > "$OUT_DIR/${slug}.json" \
    2> "$OUT_DIR/${slug}.log"
  echo "${route}\t$?" >> "$OUT_DIR/exit-codes.tsv"
done
