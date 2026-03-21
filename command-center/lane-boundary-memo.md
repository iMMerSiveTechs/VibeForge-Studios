# Lane Boundary Memo

## Purpose

Define the clean working boundaries for this repository so planning, implementation, and operator coordination stay in the correct lanes.

---

## 1. What belongs in `mobile/`

`mobile/` is the app client lane.

Belongs here:
- Expo / React Native app code
- screens, tabs, layouts, navigation
- UI components and styling
- mobile state management
- app-side integrations and SDK wiring
- client-side preview surfaces
- mobile-specific config required to build and run the app

Use this lane for:
- implementation of user-facing app behavior
- interaction flow changes
- front-end bug fixes
- app UX iteration

---

## 2. What belongs in `backend/`

`backend/` is the API and orchestration lane.

Belongs here:
- Hono/Bun server code
- routes and request handling
- auth/session handling
- persistence and Prisma/database logic
- upload/file processing
- AI orchestration and provider integration
- cost controls, runtime execution, and service logic
- backend-only config and scripts needed for server behavior

Use this lane for:
- API changes
- server-side preview/generation pipelines
- orchestration logic
- model/provider routing logic that is part of the product
- backend reliability and operational correctness

---

## 3. What belongs in `command-center/`

`command-center/` is the operator coordination lane.

Belongs here:
- project registry
- task board artifacts
- decision logs
- operating policies
- routing policies
- lane contracts
- execution briefs
- validation plans/checklists
- repo-level coordination notes that help direct work without becoming shipped product code

Use this lane for:
- planning
- prioritization
- execution coordination
- keeping decisions visible
- reducing ambiguity before implementation begins

---

## 4. What should stay out of `command-center/`

Do not put these in `command-center/`:
- mobile app runtime code
- backend runtime code
- API handlers
- React Native components intended for shipping product behavior
- provider adapters or production orchestration code
- duplicated copies of product specs that belong closer to implementation
- secrets, tokens, or auth material
- random scratch notes with no operational value

Rule:
`command-center/` is for coordination and control, not as a shadow codebase or dumping ground.

---

## 5. How to avoid context bleed at the repo root

The repo root is already mixed and can become noisy fast.

Working rules:
- keep shipped app work inside `mobile/` or `backend/`
- keep operator planning/control artifacts inside `command-center/`
- avoid creating new root-level markdown files unless they truly apply to the whole repository
- do not store transient task chatter at root
- do not treat assistant/runtime config as product documentation
- when a note only matters to execution, place it in `command-center/`, not root
- when a note only matters to implementation, place it in the relevant app lane, not root

Practical filter:
- if it helps build/run the app, it likely belongs in `mobile/` or `backend/`
- if it helps decide/coordinate the work, it likely belongs in `command-center/`
- if it only exists because of local tooling, keep it out of product lanes

---

## 6. Temporary naming contract

To reduce ambiguity for now:

- **Forge** = operator identity
- **Forge Tab** = in-product feature name for now

Usage rule:
- when discussing repo coordination, planning, or operator behavior, `Forge` means the operator identity
- when discussing the mobile product surface, say `Forge Tab`

This is a temporary contract until or unless the in-product feature name changes later.

---

## Summary Rule

Three lanes:
- `mobile/` = app client
- `backend/` = API/orchestration
- `command-center/` = operator control and planning

Protect the lane boundaries first. Cleaner execution follows from that.
