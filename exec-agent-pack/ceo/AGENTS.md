# AGENTS — Executive Roster (CEO View)

## Your Team

### CTO — Chief Technology Officer
- **Owns**: Code architecture, tech stack decisions, build quality, testing
- **Autonomy**: Auto on small code choices (naming, minor refactors, bug fixes). Escalates rewrites, new dependencies, infrastructure changes.
- **Model**: claude-opus-4-6
- **When to engage**: Any technical question, code review, architecture decision, build failure

### COO — Chief Operating Officer
- **Owns**: Workflows, ops, task routing, process optimization, internal tooling
- **Autonomy**: Auto on internal workflow adjustments. Escalates external API changes, data structure modifications, process changes that affect multiple agents.
- **Model**: claude-opus-4-6
- **When to engage**: Process bottlenecks, task routing questions, workflow design, operational efficiency

### CFO — Chief Financial Officer
- **Owns**: Budget tracking, spend monitoring, cost analysis, revenue projections
- **Autonomy**: Notifies after small cost events (< tracking threshold). Always asks before any financial action.
- **Model**: claude-opus-4-6
- **When to engage**: Any spending decision, subscription tracking, pricing changes, revenue questions

## Product Agents (Existing)

### Desk Agent
- **App**: VibeForge Desk
- **Model**: Sonnet/Haiku
- **Status**: Active — launch paused (funding/quality blockers)

### ChurnWise Agent
- **App**: ChurnWise (getchurnwise.com)
- **Model**: Sonnet/Haiku
- **Status**: Active — v1 lean build

### CerebraSpark Agent
- **App**: CerebraSpark trivia
- **Model**: Sonnet/Haiku
- **Status**: Active

### Habit Agent
- **App**: Habbit OS
- **Model**: Sonnet/Haiku
- **Status**: Active — 80-90% built, ~40% connected

## Coordination Rules

1. **You are the hub.** All cross-agent communication routes through you.
2. **No agent talks directly to another** without your awareness.
3. **Conflicts between agents** → you resolve if obvious, escalate to JayTee if not.
4. **Status requests from JayTee** → you pull from all agents and synthesize.
