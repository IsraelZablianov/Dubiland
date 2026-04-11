#!/usr/bin/env bash
# DUB-631 / DUB-375: 60+ minute stability proof — probe + validator artifact pack.
# Canonical host: GitHub Pages from .github/workflows/deploy-pages.yml (no local tunnel).
set -euo pipefail

: "${DUB631_PREVIEW_BASE:=https://israelzablianov.github.io/Dubiland}"
: "${DUB631_OUT_DIR:=}"
: "${DUB631_CHECKPOINT:=start}"
: "${DUB631_SOCKS5:=}"

if [[ -z "${DUB631_OUT_DIR}" ]]; then
  echo "Set DUB631_OUT_DIR to an empty directory for artifacts (e.g. /tmp/dub631-\$(date -u +%Y%m%dT%H%M%SZ)-\${DUB631_CHECKPOINT})" >&2
  exit 1
fi

mkdir -p "${DUB631_OUT_DIR}"

ts_utc() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

CURL_VALIDATE=(curl -sS -L)
if [[ -n "${DUB631_SOCKS5}" ]]; then
  CURL_VALIDATE+=(--socks5-hostname "${DUB631_SOCKS5}")
fi

ROUTES=( "/" "/letters" "/parents/faq" "/robots.txt" )
USER_AGENTS=(
  "validator.schema.org"
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
  "Mozilla/5.0 (compatible; Google-InspectionTool/1.0)"
)

{
  echo -e "checkpoint\t${DUB631_CHECKPOINT}"
  echo -e "captured_at_utc\t$(ts_utc)"
  echo -e "preview_base\t${DUB631_PREVIEW_BASE}"
  echo -e "git_commit_workspace\t$(git -C "$(dirname "$0")/.." rev-parse HEAD 2>/dev/null || echo unknown)"
} >"${DUB631_OUT_DIR}/meta.tsv"

PROBE_TSV="${DUB631_OUT_DIR}/http_${DUB631_CHECKPOINT}.tsv"
: >"${PROBE_TSV}"
for path in "${ROUTES[@]}"; do
  url="${DUB631_PREVIEW_BASE%/}${path}"
  code="$(curl -sS -o /dev/null -w "%{http_code}" -L "$url")"
  printf '%s\t%s\n' "$path" "$code" >>"${PROBE_TSV}"
done

UA_TSV="${DUB631_OUT_DIR}/http_${DUB631_CHECKPOINT}_ua.tsv"
: >"${UA_TSV}"
for path in "${ROUTES[@]}"; do
  url="${DUB631_PREVIEW_BASE%/}${path}"
  for ua in "${USER_AGENTS[@]}"; do
    code="$(curl -sS -o /dev/null -w "%{http_code}" -L -A "$ua" "$url")"
    printf '%s\t%s\t%s\n' "$path" "$ua" "$code" >>"${UA_TSV}"
  done
done

VALIDATOR_URL="https://validator.schema.org/validate"
for path in "/" "/letters" "/parents/faq"; do
  slug="${path//\//_}"
  [[ "$slug" == "_" ]] && slug="_root"
  url="${DUB631_PREVIEW_BASE%/}${path}"
  raw="${DUB631_OUT_DIR}/schema_${DUB631_CHECKPOINT}${slug}.raw"
  hdr="${DUB631_OUT_DIR}/schema_${DUB631_CHECKPOINT}${slug}.headers"
  # Schema.org validator expects form fields, not a JSON body.
  "${CURL_VALIDATE[@]}" -D "$hdr" -o "$raw" -X POST "$VALIDATOR_URL" \
    --data-urlencode "url=${url}" \
    --data "output=json" \
    --data "parser=structured-data"
done

echo "Wrote artifacts under ${DUB631_OUT_DIR}"
echo "Next: wait >=3600s on the SAME host, set DUB631_CHECKPOINT=end, reuse DUB631_OUT_DIR or a paired directory, rerun."
