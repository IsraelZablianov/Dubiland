#!/usr/bin/env bash
set -euo pipefail

ADAPTER="${1:-}"
API_BASE="${PAPERCLIP_API_URL:-http://localhost:3100}"

if [[ -z "$ADAPTER" ]]; then
  echo "Usage: yarn adapter <claude_local|codex_local|gemini_local>"
  echo ""
  echo "Current adapters:"
  curl -s "$API_BASE/api/companies/107038ed-546d-4c3f-afca-26feea951289/agents" | \
    python3 -c "
import sys,json
for a in sorted(json.load(sys.stdin), key=lambda x: x['name']):
    print(f\"  {a['name']:<22} {a['adapterType']}\")
"
  exit 0
fi

VALID="claude_local codex_local gemini_local process"
if ! echo "$VALID" | grep -qw "$ADAPTER"; then
  echo "Error: invalid adapter '$ADAPTER'. Choose from: $VALID"
  exit 1
fi

AGENTS=$(curl -s "$API_BASE/api/companies/107038ed-546d-4c3f-afca-26feea951289/agents" | \
  python3 -c "import sys,json; [print(a['id']) for a in json.load(sys.stdin)]")

for id in $AGENTS; do
  result=$(curl -s -X PATCH "$API_BASE/api/agents/$id" \
    -H "Content-Type: application/json" \
    -d "{\"adapterType\": \"$ADAPTER\"}")
  name=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'], '→', d['adapterType'])")
  echo "$name"
done

echo ""
echo "All agents switched to $ADAPTER"
