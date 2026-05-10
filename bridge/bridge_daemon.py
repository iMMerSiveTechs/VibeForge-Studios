#!/usr/bin/env python3
"""Mac-side iMessage bridge daemon for Gordon."""
import os
import sqlite3
import subprocess
import time
from datetime import datetime
from pathlib import Path
import requests

DB_PATH = os.path.expanduser("~/Library/Messages/chat.db")
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "8"))
CONTACT_HANDLE = os.environ.get("GORDON_CONTACT", "+15555555555")
JAYTEE_HANDLE = os.environ.get("JAYTEE_HANDLE", "+15555550000")
ROUTER_URL = os.environ.get("ROUTER_URL", "http://100.84.56.42:18789/route")
APPLE_SCRIPT = Path(__file__).with_name("send_imessage.applescript")
LOG_PATH = Path(os.environ.get("GORDON_LOG", r"/vault/_bridge/archives/gordon/imessage_log.md"))
STATE_PATH = Path(os.environ.get("STATE_PATH", "./state/imessage_state.json"))


def load_last_rowid() -> int:
    if STATE_PATH.exists():
        import json
        return json.loads(STATE_PATH.read_text()).get("last_rowid", 0)
    return 0


def save_last_rowid(rowid: int):
    import json
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps({"last_rowid": rowid}))


def send_imessage(to_number: str, text: str):
    subprocess.run(["osascript", str(APPLE_SCRIPT), to_number, text], check=True)


def append_log(role: str, text: str):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as f:
        f.write(f"\n## {datetime.utcnow().isoformat()}Z {role}\n\n{text}\n")


def poll_messages(last_rowid: int):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    q = """
    SELECT m.ROWID, h.id, m.text
    FROM message m
    JOIN handle h ON m.handle_id = h.ROWID
    WHERE m.ROWID > ? AND h.id = ? AND m.is_from_me = 1 AND m.text IS NOT NULL
    ORDER BY m.ROWID ASC
    """
    cur.execute(q, (last_rowid, CONTACT_HANDLE))
    rows = cur.fetchall()
    conn.close()
    return rows


def main():
    last = load_last_rowid()
    while True:
        try:
            rows = poll_messages(last)
            for rowid, handle, text in rows:
                append_log("JayTee", text)
                resp = requests.post(ROUTER_URL, json={"message": text, "from": JAYTEE_HANDLE}, timeout=180)
                resp.raise_for_status()
                answer = resp.json().get("response", "")
                append_log("Gordon", answer)
                send_imessage(handle, answer)
                last = rowid
                save_last_rowid(last)
        except Exception as e:
            append_log("bridge-error", str(e))
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
