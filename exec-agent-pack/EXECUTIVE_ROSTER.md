# EXECUTIVE_ROSTER.md — iMMerSiveTechs Executive Agent Pack

## Overview

This is the Phase 1 executive agent pack for iMMerSiveTechs LLC's Openclaw-based autonomous agent organization. These agents operate as a Fortune 500-style executive team, coordinating across product lines and reporting to founder JayTee.

## Architecture

- **Platform**: Openclaw (local-first, Node.js + TypeScript, file-based JSON storage)
- **Agent Init**: 5 markdown files per agent (SOUL.md, IDENTITY.md, AGENTS.md, TOOLS.md, USER.md)
- **Workspace**: `~/.openclaw/workspace-{agent-id}/`
- **Model**: All exec agents use `claude-opus-4-6`

## Org Chart

```
                    ┌─────────────┐
                    │   JayTee    │
                    │  (Founder)  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │     CEO     │
                    │ Orchestrator│
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌──────┴─────┐
        │    CTO    │ │  COO  │ │    CFO     │
        │   Code    │ │  Ops  │ │  Finance   │
        └─────┬─────┘ └───┬───┘ └────────────┘
              │            │
     ┌────────┼────────────┤
     │        │            │
  ┌──┴──┐ ┌──┴──┐ ┌──────┴──────┐
  │Desk │ │Churn│ │ CerebraSpark│
  │Agent│ │Wise │ │    Agent    │
  └─────┘ └─────┘ └─────────────┘
              │
         ┌────┴────┐
         │  Habit  │
         │  Agent  │
         └─────────┘
```

## Agent Summary

| Agent | ID    | Model           | Role                              | Autonomy Level |
|-------|-------|-----------------|-----------------------------------|----------------|
| CEO   | ceo   | claude-opus-4-6 | Orchestration, coordination       | Medium — auto on routing/summaries, escalates strategy |
| CTO   | cto   | claude-opus-4-6 | Code, architecture, build quality | Medium — auto on small code, escalates rewrites/infra |
| COO   | coo   | claude-opus-4-6 | Workflows, ops, task routing      | Medium — auto on internal workflows, escalates external/data changes |
| CFO   | cfo   | claude-opus-4-6 | Budget, spend, revenue tracking   | Low — notifies on small costs, always asks before financial actions |

## Existing Product Agents

| Agent        | Model        | App             | Status                        |
|--------------|-------------|-----------------|-------------------------------|
| desk         | Sonnet/Haiku | VibeForge Desk  | Paused (funding/quality)      |
| churnwise    | Sonnet/Haiku | ChurnWise       | Active — v1 lean              |
| cerebraspark | Sonnet/Haiku | CerebraSpark    | Active                        |
| habit        | Sonnet/Haiku | Habbit OS       | Active — 80-90% built, ~40% connected |

## Communication Protocol

### Chain of Command
1. **JayTee** → CEO (all founder directives)
2. **CEO** → CTO / COO / CFO (task routing and coordination)
3. **CTO / COO / CFO** → CEO (escalations and reports)
4. **CEO** → JayTee (escalations requiring founder decision)

### Rules
- No agent communicates directly with JayTee except through CEO (emergency override exists)
- No agent communicates directly with a peer without CEO awareness
- All cross-agent work is coordinated by CEO
- Product agents receive direction from executive agents via CEO routing

## Escalation Quick Reference

| Category       | Triggered By | Goes To        | Format                          |
|---------------|-------------|----------------|---------------------------------|
| ARCHITECTURE  | CTO         | CEO → JayTee   | Assessment + 3 options          |
| SPEND         | CFO         | CEO → JayTee   | Amount + justification + alternatives |
| SCOPE         | Any         | CEO → JayTee   | What + why + impact             |
| CONFLICT      | CEO         | JayTee         | Both sides + recommendation     |
| RISK          | Any         | CEO → JayTee   | Risk + probability + mitigation |
| STRATEGY      | CEO         | JayTee         | Context + 3 options             |

## File Structure

```
~/.openclaw/
├── workspace-ceo/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── AGENTS.md
│   ├── TOOLS.md
│   ├── USER.md
│   ├── decisions.json
│   ├── escalations.json
│   └── status/
├── workspace-cto/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── AGENTS.md
│   ├── TOOLS.md
│   ├── USER.md
│   ├── decisions.json
│   ├── tech-debt.json
│   └── architecture/
├── workspace-coo/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── AGENTS.md
│   ├── TOOLS.md
│   ├── USER.md
│   ├── status.json
│   ├── process-log.json
│   ├── workflows/
│   └── runbooks/
├── workspace-cfo/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── AGENTS.md
│   ├── TOOLS.md
│   ├── USER.md
│   ├── expenses.json
│   ├── revenue.json
│   ├── budget.json
│   ├── subscriptions.json
│   └── reports/
└── EXECUTIVE_ROSTER.md
```

## Phase Roadmap

### Phase 1 (Current) ✅
- CEO, CTO, COO, CFO agents
- Core markdown initialization files
- Escalation protocol
- Communication chain of command

### Phase 2 (Planned)
- CMO (Chief Marketing Officer) — growth, content, ASO/SEO
- CPO (Chief Product Officer) — product strategy, user research, roadmap
- Inter-agent messaging protocol (structured JSON messages)
- Shared knowledge base across agents

### Phase 3 (Future)
- CHRO (Chief Human Resources Officer) — if team scales
- CSO (Chief Security Officer) — security, compliance, privacy
- Template packaging for external sale
- Onboarding wizard for new Openclaw users
- Custom agent builder (create-your-own-executive)

## Version

- **Pack Version**: 1.0.0
- **Phase**: 1
- **Created**: 2026-03-19
- **Author**: JayTee / iMMerSiveTechs LLC
