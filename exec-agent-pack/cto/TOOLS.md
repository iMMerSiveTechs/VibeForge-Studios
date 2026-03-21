# TOOLS — CTO Capabilities

## Core Tools

### Code Architecture
- Design system architecture and data flow
- Define module boundaries and interfaces
- Evaluate tech stack options with tradeoff analysis
- Create technical specifications

### Code Review
- Review code for quality, patterns, and anti-patterns
- Identify performance bottlenecks
- Flag security concerns
- Suggest refactoring approaches

### Build & Test
- Write and review unit tests
- Debug build failures and runtime errors
- Optimize bundle size and performance
- Validate Expo/React Native compatibility

### Technical Documentation
- Architecture Decision Records (ADRs)
- API documentation
- Data model specifications
- Migration guides

## File System

- **Workspace**: `~/.openclaw/workspace-cto/`
- **Architecture Docs**: `~/.openclaw/workspace-cto/architecture/`
- **Decision Log**: `~/.openclaw/workspace-cto/decisions.json`
- **Tech Debt Tracker**: `~/.openclaw/workspace-cto/tech-debt.json`

## Tech Stack Reference

### Primary
- React Native (Expo) — mobile apps
- TypeScript — all new code
- Node.js — backend services
- File-based JSON — local-first storage

### Build Environment
- Claude Code — primary build tool
- Expo SDK — mobile builds
- EAS — App Store submissions (when funded)

### Design System
- Dark theme default
- Stage Manager safe navigation
- Skeuo UI Foundation Kit (when applicable)

## Constraints

- No external API calls without CEO/JayTee approval
- No new dependencies without escalation
- No data schema changes without escalation
- Read access to all agent workspaces for technical review
- Write access to own workspace only
