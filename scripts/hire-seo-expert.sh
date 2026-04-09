#!/usr/bin/env bash
set -euo pipefail

# Hire SEO Expert agent via Paperclip API
# Run this with Paperclip env vars set (inside a heartbeat or with manual auth)
#
# Required env vars:
#   PAPERCLIP_API_URL
#   PAPERCLIP_API_KEY
#   PAPERCLIP_COMPANY_ID

: "${PAPERCLIP_API_URL:?Set PAPERCLIP_API_URL}"
: "${PAPERCLIP_API_KEY:?Set PAPERCLIP_API_KEY}"
: "${PAPERCLIP_COMPANY_ID:?Set PAPERCLIP_COMPANY_ID}"

echo "==> Finding CMO agent ID (SEO Expert reports to CMO)..."
CMO_ID=$(curl -sS "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" | \
  python3 -c "import sys,json; agents=json.load(sys.stdin); print(next(a['id'] for a in agents if a.get('role','').lower()=='cmo' or 'cmo' in a.get('name','').lower()))")

echo "    CMO ID: $CMO_ID"

echo "==> Submitting SEO Expert hire request..."
RESPONSE=$(curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agent-hires" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(cat <<ENDJSON
{
  "name": "SEO Expert",
  "role": "seo-expert",
  "title": "SEO Expert",
  "icon": "search",
  "reportsTo": "$CMO_ID",
  "capabilities": "Owns technical SEO, GEO (generative engine optimization), structured data, Hebrew keyword research, AI search visibility, and organic growth strategy for Dubiland. Coordinates with FED Engineers on implementation and Content Writer on SEO-optimized content.",
  "desiredSkills": [
    "coreyhaines31/marketingskills@seo-audit",
    "coreyhaines31/marketingskills@ai-seo",
    "coreyhaines31/marketingskills@programmatic-seo",
    "resciencelab/opc-skills@seo-geo",
    "addyosmani/web-quality-skills@seo",
    "aaron-he-zhu/seo-geo-claude-skills@seo-content-writer"
  ],
  "adapterType": "cursor_local",
  "adapterConfig": {
    "cwd": "/Users/israelz/Documents/dev/AI/Learning",
    "model": "claude-sonnet-4-20250514"
  },
  "runtimeConfig": {
    "heartbeat": {
      "enabled": true,
      "intervalSec": 2700,
      "wakeOnDemand": true
    }
  }
}
ENDJSON
)")

echo "$RESPONSE" | python3 -m json.tool

AGENT_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agentId', d.get('agent',{}).get('id','UNKNOWN')))" 2>/dev/null || echo "CHECK_RESPONSE")

echo ""
echo "==> Setting external instructions path..."
if [ "$AGENT_ID" != "CHECK_RESPONSE" ] && [ "$AGENT_ID" != "UNKNOWN" ]; then
  curl -sS -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID/instructions-path" \
    -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"path\": \"/Users/israelz/Documents/dev/AI/Learning/docs/agents/seo-expert/instructions/AGENTS.md\"}"
  echo ""
  echo "==> Done! SEO Expert agent created with ID: $AGENT_ID"
  echo "    Instructions: docs/agents/seo-expert/instructions/"
  echo "    Reports to: CMO ($CMO_ID)"
else
  echo "    Could not extract agent ID from response. Check the response above."
  echo "    After approval, run:"
  echo "    curl -sS -X PATCH \"\$PAPERCLIP_API_URL/api/agents/<AGENT_ID>/instructions-path\" \\"
  echo "      -H \"Authorization: Bearer \$PAPERCLIP_API_KEY\" \\"
  echo "      -H \"Content-Type: application/json\" \\"
  echo "      -d '{\"path\": \"/Users/israelz/Documents/dev/AI/Learning/docs/agents/seo-expert/instructions/AGENTS.md\"}'"
fi
