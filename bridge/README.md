# Bridge Toolkit v1

## Components
- `conversation_archiver.py`: Playwright scraper for Grok/ChatGPT/Gemini/Claude/Perplexity conversation archives.
- `bridge_daemon.py`: macOS daemon that bridges JayTee iMessages to Gordon and returns responses.
- `gordon_router.py`: HTTP router service to OpenClaw Gordon profile.
- `send_imessage.applescript`: Sends iMessage replies from daemon.
- `config.yaml`: Archiver configuration and storage-state locations.
- `.env.example`: Environment variables for daemon/router.

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install playwright markdownify pyyaml flask requests
playwright install chromium
cp .env.example .env
```

## Run archiver (resumable)
```bash
python conversation_archiver.py --config config.yaml
# or single platform
python conversation_archiver.py --config config.yaml --platform chatgpt
```
- Progress checkpoint: `state/checkpoint.json`
- Index: `state/manifest.json`
- Output: `/vault/_bridge/archives/{platform}/{thread_id}_{title}.md`

## Run Gordon router
```bash
export $(cat .env | xargs)
python gordon_router.py
```

## Run iMessage daemon
```bash
export $(cat .env | xargs)
python bridge_daemon.py
```

## launchd auto-start (macOS)
Create `~/Library/LaunchAgents/com.vibeforge.gordonbridge.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.vibeforge.gordonbridge</string>
<key>ProgramArguments</key><array>
  <string>/usr/bin/python3</string><string>/path/to/bridge_daemon.py</string>
</array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>WorkingDirectory</key><string>/path/to/bridge</string>
<key>StandardOutPath</key><string>/tmp/gordonbridge.out</string>
<key>StandardErrorPath</key><string>/tmp/gordonbridge.err</string>
</dict></plist>
```
Then:
```bash
launchctl load ~/Library/LaunchAgents/com.vibeforge.gordonbridge.plist
```
