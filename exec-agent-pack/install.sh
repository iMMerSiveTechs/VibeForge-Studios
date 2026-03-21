#!/bin/bash
# AI Executive Team — Quick Install
# Deploys CEO, CTO, COO, CFO agents to your OpenClaw setup

echo "🏢 AI Executive Team — Installing..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Deploy workspace files
for role in ceo cto coo cfo; do
  DEST="$HOME/.openclaw/workspace-${role}"
  mkdir -p "$DEST"
  cp "$SCRIPT_DIR/${role}"/* "$DEST/" 2>/dev/null
  echo "  ✅ ${role^^} → $DEST"
done

# Copy roster
cp "$SCRIPT_DIR/EXECUTIVE_ROSTER.md" "$HOME/.openclaw/" 2>/dev/null
echo "  ✅ Executive Roster → ~/.openclaw/"

echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Add agents to ~/.openclaw/openclaw.json:"
echo ""
echo '     { "id": "ceo", "model": "anthropic/claude-opus-4-6" }'
echo '     { "id": "cto", "model": "anthropic/claude-opus-4-6" }'
echo '     { "id": "coo", "model": "anthropic/claude-opus-4-6" }'
echo '     { "id": "cfo", "model": "anthropic/claude-opus-4-6" }'
echo ""
echo "  2. Restart: openclaw gateway restart"
echo ""
echo "  3. Test: send a message to the CEO agent"
echo ""
echo "🏢 Executive team deployed. Ready to lead."
