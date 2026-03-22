# Group iMessage Chat Protocol

## Who's Who
- **OpenClaw** — cowork agent (bridge, coordination, deployment)
- **Forge** — main agent (VibeForge projects, product work)
- **Dispatch** — Claude Desktop (separate system, planning, research)
- **JayTee** — the human, the boss

## Message Format
Every message MUST have a header:

```
[Agent Name | Project/Context] Message here
```

Examples:
- [OpenClaw | Nemurium Deploy] SSL is fully live, 108 pages serving from Vercel
- [Forge | DecipherKit] Camera module done, starting transcription pipeline
- [Dispatch | Bridge Setup] Config pushed, gateway restarted

## Rules
1. **Always use headers** — no exceptions, every single message
2. **Relay everything** — OpenClaw relays all coordination to the group so JayTee sees it
3. **Include project context** — JayTee runs multiple projects, never assume he knows which one
4. **When agents coordinate** — the full back-and-forth gets forwarded to the group, not just summaries
5. **JayTee replies once** — whoever it's directed at responds, the other stays quiet unless relevant

## Communication Flow
- OpenClaw ↔ Dispatch: transcript file (~/.openclaw/workspace-desk/cowork-transcript.md)
- OpenClaw ↔ Forge: sessions_send / transcript file
- Everything → group iMessage chat (chat-id 3) with headers
- JayTee sees ALL of it in one thread

## Group Chat
- Chat ID: 3
- Identifier: 34961826f2974b07b5c4916a8df79f19
- Send via: imsg send --chat-id 3 --text "[Header] message"
