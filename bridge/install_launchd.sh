#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: launchd deploy is macOS-only (uname=$(uname -s))." >&2
  exit 1
fi

LABEL="com.vibeforge.gordonbridge"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3)}"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
STATE_PATH="${STATE_PATH:-$ROOT_DIR/state/imessage_state.json}"
LOG_PATH="${GORDON_LOG:-$ROOT_DIR/state/imessage_log.md}"

mkdir -p "$HOME/Library/LaunchAgents" "$ROOT_DIR/state"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PYTHON_BIN}</string>
    <string>${ROOT_DIR}/bridge_daemon.py</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>POLL_SECONDS</key><string>${POLL_SECONDS:-8}</string>
    <key>ROUTER_URL</key><string>${ROUTER_URL:-http://100.84.56.42:18789/route}</string>
    <key>GORDON_CONTACT</key><string>${GORDON_CONTACT:-+15555555555}</string>
    <key>JAYTEE_HANDLE</key><string>${JAYTEE_HANDLE:-+15555550000}</string>
    <key>STATE_PATH</key><string>${STATE_PATH}</string>
    <key>GORDON_LOG</key><string>${LOG_PATH}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>/tmp/gordonbridge.out</string>
  <key>StandardErrorPath</key>
  <string>/tmp/gordonbridge.err</string>
</dict>
</plist>
PLIST

plutil -lint "$PLIST_PATH" >/dev/null

launchctl bootout "gui/$(id -u)/${LABEL}" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl enable "gui/$(id -u)/${LABEL}"
launchctl kickstart -k "gui/$(id -u)/${LABEL}"

printf 'Installed and started %s\nplist: %s\n' "$LABEL" "$PLIST_PATH"
