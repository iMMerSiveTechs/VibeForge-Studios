---
name: exec-team
description: "Deploy a Fortune 500-style AI executive team (CEO, CTO, COO, CFO) for your OpenClaw agent setup. Each agent has defined roles, decision frameworks, escalation protocols, and communication chains. Built by a solo founder who runs his entire company with this system."
homepage: https://github.com/iMMerSiveTechs
metadata:
  openclaw:
    emoji: "👔"
    requires:
      bins: []
    os: ["linux", "darwin", "win32"]
---

# AI Executive Team — Agent Pack

Deploy a Fortune 500-style AI executive team for your startup or solo operation. Four agents, each with a clear role, decision framework, and escalation protocol.

## What You Get

| Agent | Role | What They Do |
|---|---|---|
| **CEO** | Strategic Orchestrator | Coordinates all agents, routes decisions, generates strategic briefs, protects your time |
| **CTO** | Technical Authority | Code review, architecture decisions, build quality, tech debt management |
| **COO** | Operational Backbone | Workflow design, task routing, process optimization, efficiency tracking |
| **CFO** | Financial Guardian | Cost tracking, budget monitoring, subscription audits, revenue forecasting |

## Install

```bash
# Clone the pack
clawhub install exec-team

# Deploy to your OpenClaw workspace
for role in ceo cto coo cfo; do
  mkdir -p ~/.openclaw/workspace-${role}
  cp -r skills/exec-team/${role}/* ~/.openclaw/workspace-${role}/
done

# Register agents in your openclaw.json (add to agents.list):
# { "id": "ceo", "model": "anthropic/claude-opus-4-6" }
# { "id": "cto", "model": "anthropic/claude-opus-4-6" }
# { "id": "coo", "model": "anthropic/claude-opus-4-6" }
# { "id": "cfo", "model": "anthropic/claude-opus-4-6" }

# Restart gateway
openclaw gateway restart
```

## How It Works

### Chain of Command
```
You (Founder)
    ↓
  CEO (orchestrator)
  ├── CTO (code + architecture)
  ├── COO (operations + workflows)
  └── CFO (finance + costs)
```

### Decision Rules
- **Small stuff:** Agents act autonomously and log it
- **Big stuff:** Escalates through CEO → You
- **Financial stuff:** CFO always advises, never acts on money without approval

### What Each Agent Decides On Their Own
- **CEO:** Task routing, priority ordering, status summaries, small product calls
- **CTO:** Bug fixes, naming, minor refactors, file organization, implementation choices
- **COO:** Workflow adjustments, task queue optimization, internal process changes
- **CFO:** Cost logging, burn rate calculations, anomaly flagging, renewal tracking

### What Gets Escalated to You
- Architecture changes, new dependencies, infrastructure decisions
- Any spending commitment
- External-facing decisions (emails, tweets, launches)
- Strategy pivots or scope changes

## Customize

Each agent has 5 files you can edit:
- `SOUL.md` — Personality, operating philosophy, decision framework
- `AGENTS.md` — Operating instructions and boundaries
- `IDENTITY.md` — Name, emoji, vibe
- `TOOLS.md` — Environment-specific notes
- `USER.md` — Info about you (the founder)

Edit these to match your company, your style, and your priorities.

## Built By

Created by JayTee / iMMerSiveTechs LLC — a solo founder running his entire company with this agent team. This isn't theoretical. This is what he uses every day.

## Requirements

- OpenClaw v2026.3.x or later
- At least one AI model configured (Opus recommended for exec quality)
- Works with any model — Opus, Sonnet, Haiku, GPT, Gemini

## See Also

- `EXECUTIVE_ROSTER.md` — Full org chart, escalation matrix, phase roadmap
