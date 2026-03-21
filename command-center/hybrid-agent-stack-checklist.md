# Hybrid Agent Stack — Setup Checklist
**Source:** Sticky Notes + Notebook Transcription (captured 2026-03-19)

---

## Phase 1: OpenClaw Home Base (START HERE)

- [x] Rules — Define agent rules (permissions, boundaries, autonomy)
  - *Done: AGENTS.md, SOUL.md, model-routing-policy.md all in place*
- [x] Connected Command Center — Map MCP server connections:
  - [x] Filesystem server (local project access) — wired to VibeForge-Studios, .openclaw, Projects
  - [x] GitHub server (repo access) — wired with gh auth token, 24 repos visible
  - [x] Claude Code skill — installed from ClawHub (docs wrapper; real integration is native)
- [x] Leader / Index — Orchestration hierarchy: OpenClaw primary, Claude Code as sub-agent
  - *Done: coding-agent skill exists, sessions_spawn with runtime:"acp" available*
- [x] Turn Logic — How OpenClaw decides when to act vs. wait
  - *Done: AGENTS.md defines heartbeat behavior, group chat rules, external vs internal actions*
- [x] Steps — Startup sequence documented
  - *Done: Session Startup in AGENTS.md (read SOUL.md → USER.md → memory files → MEMORY.md)*
- [ ] Best Practices — Token budgets, error handling, fallback behavior
- [ ] Use Token Management — Spending caps via skill budget limits; monitor API usage
- [ ] Refine / Design — Iterate on agent config after first live test
- [x] Fix - Test — Filesystem read ✅ → GitHub read ✅ → full Claude Code tool call ✅

## Phase 2: Claude Code Integration

- [x] Claude Code — CLI installed and accessible
  - *Done: available via coding-agent skill and ACP runtime*
- [x] Install claude-code skill — installed from ClawHub (docs reference)
- [x] Create mcp_config.json — `~/.claude/mcp.json` with filesystem + GitHub servers
- [x] Initialize MCP system — servers load on Claude Code launch
- [x] Test getAllTools() — filesystem server: reads files ✅, GitHub server: lists repos ✅
- [x] Test executeMcpAction() — filesystem read (memory files) ✅, GitHub read (24 repos listed) ✅
- [ ] Session persistence — Verify state survives restarts via IndexedDB store

## Phase 3: Claude Cowork + Mobile

- [ ] Claude Cowork (Desktop) — Install/update Claude Desktop app
- [ ] Mobile install — Install Claude app on iPad/phone
- [ ] How to use it — Map workflows:
  - Cowork = collaborative thinking, strategy, planning, document review
  - Claude Code = build, test, deploy
  - OpenClaw = autonomous background tasks, always-on agent work
- [ ] MCP Connectors — Add custom connectors to Cowork (Settings > Connectors)
- [ ] Dispatch (remote control) — Test sending tasks to Cowork from mobile

## Phase 4: Channels (Remote Control via Telegram/Discord)

- [ ] Claude Code Channels — Requires Claude Code v2.1.80+
- [ ] Telegram setup — Create bot, configure allowlist, pair user ID
- [ ] Discord setup — Create bot, invite to server, configure permissions
- [ ] Test phone → Claude Code — Send message from Telegram, verify it arrives
- [ ] Background session — Run Claude Code in persistent terminal

## Phase 5: Business Ideas (Captured from Stickies)

- [ ] Fortune 500 Execs Master Agent — Multi-phase agent skill for F500 executives (full build, not just research)
- [ ] Full Siri App — Surface and display Siri request history with context (needs research)
- [x] VibeForge Studio — Continue app generation platform *(in progress, alpha stage)*
- [x] Forge Command Center — Built: `command-center/` (state.json, task-board, decision-log, project-registry)

## Teaching / Tracking Pipeline (DecipherKit)

- [ ] Teaching — Train Glyph Map with more handwriting samples
- [ ] Mapping — Expand character-level corrections
- [ ] Structured Text — Output clean structured JSON from transcriptions
- [ ] Structure (Audit) — Audit pipeline for accuracy
- [ ] Refine / Design — Improve 5-phase protocol based on real usage
- [ ] Fix - Test — Continuous testing loop on new handwriting samples

---

## Architecture

```
┌─────────────────────────────────┐
│        YOU (iPad / Phone)       │
│   Telegram / Discord / Desktop  │
└──────────┬──────────────────────┘
           │
    ┌──────▼──────┐
    │   Channels  │  (Telegram/Discord MCP bridge)
    │    Path 3   │
    └──────┬──────┘
           │
┌──────────▼──────────────────────────────────┐
│         OpenClaw (Home Base)                │
│       Always-on autonomous agent            │
│                                             │
│  ┌─────────────┐  ┌────────────────────┐   │
│  │ Claude Code │  │  Claude Cowork     │   │
│  │ Skill (MCP) │  │  (Collaborative)   │   │
│  │   Path 1    │  │     Path 2         │   │
│  └──────┬──────┘  └────────┬───────────┘   │
│         │                  │               │
│  ┌──────▼────────────────────▼──────────┐   │
│  │       MCP Server Registry            │   │
│  │   Filesystem | GitHub | Custom       │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```
