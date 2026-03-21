# Subscription-Only Validation Plan

## Constraint

No paid API usage. No Anthropic/OpenAI/Gemini API keys.
Claude Max and OpenAI Codex OAuth are available for agent tooling (OpenClaw) but cannot be used as backend API keys for `POST /api/generate`.

---

## Validation Tracks

### Track 1: Preview Renderer Smoke Test (UNBLOCKED)

Tests whether the mobile Preview tab can correctly render a hand-crafted VfAppSpec and handle the interactions the renderer actually supports.

- Does **not** require AI generation
- Does **not** require an API key
- Does require: backend running, auth working, a project with a `vfAppSpec` field populated

**Test artifact:** `command-center/smoke-test-spec.json`
**Pass/fail criteria:** see Track 1 section below

### Track 2: Renderer Capability Gap (ANALYSIS ONLY)

Documents what the canonical todo test requires vs. what the current renderer actually supports. No execution — this is a gap assessment.

### End-to-End Generate Route (PARKED)

Tests the full loop: prompt → `POST /api/generate` → AI provider → parse → update project → preview.

**Status: Parked.** The backend calls provider APIs directly with API keys. No workaround without app code changes or API keys.

---

## Track 1: Preview Renderer Smoke Test

### Method

Inject a hand-crafted VfAppSpec into a project record via API. Open Preview tab. Verify rendering and interaction.

### Steps

1. Start backend (`bun run dev` in `backend/`)
2. Auth via OTP (code logged to backend console)
3. Create a project via `POST /api/projects`
4. Update the project with the smoke-test spec via project update API or direct SQLite write
5. Start mobile app (`bun run start` in `mobile/`)
6. Select the project, open Preview tab
7. Execute the checks below

### Pass Criteria

All of these must be true:

1. Preview tab loads without crash or blank screen
2. Spec is parsed — screen title "Renderer Smoke Test" appears
3. `text` node (h1): "Renderer Smoke Test" renders visibly
4. `text` node (body): description text renders
5. `input` node: text field appears, accepts typed input
6. `button` node (append): tapping "Add Item" adds an entry to the list
7. `list` node: added items appear with their title text
8. `button` node (set): tapping "Clear Input" resets the input field to empty
9. `divider` node: visible separator renders between sections
10. `toggle` node: switch renders, toggles on/off, state changes visually
11. `metric` node: label and value render
12. `card` node: content renders inside a card container
13. `row` node: children render side by side
14. `spacer` node: visible vertical gap between elements
15. No hidden manual fixes required

### Fail Criteria

Any of these:

- Preview tab blank, crash, or error screen
- Spec not parsed (shows "No VF_APP spec found" warning)
- Any supported node type does not render
- Input/button/toggle interaction does not work
- App crash during interaction

### Logging

Log the result in `command-center/vf-app-preview-validation-log.md` as a separate track entry:
- Tier / Loop: `Preview Renderer Smoke Test`
- Use the same PASS / FAIL / failure bucket structure

---

## Track 2: Renderer Capability Gap

### What the canonical todo test requires

| Capability | Required by canonical test |
|---|---|
| Render text (h1) | Yes — "Todo Test" title |
| Render input | Yes — new todo text field |
| Button → append to list | Yes — Add button |
| Render list from state | Yes — todo list |
| Per-item toggle (complete/incomplete) | **Yes — core interaction** |
| Per-item visible style change on toggle | **Yes — core validation** |
| Seeded initial state (pre-populated todos) | **Yes — "Buy milk", "Ship build"** |

### What the current renderer supports

| Capability | Supported | Evidence |
|---|---|---|
| Render text (h1, h2, body, caption) | ✅ | `preview.tsx` renderNode case "text" |
| Render input | ✅ | case "input" with state binding |
| Button → append to list | ✅ | case "button" + handleAction "append" |
| Button → set state | ✅ | handleAction "set" |
| Render list from state | ✅ | case "list" renders items from `previewState[key]` |
| Toggle node | ✅ | case "toggle" with Switch component |
| Metric node | ✅ | case "metric" |
| Card, row, section, divider, spacer | ✅ | all have renderNode cases |
| **Per-item list action/toggle** | ❌ | `list` node renders display-only rows. No `onPress`, no per-item `action` in the VfNode type or renderer. |
| **Seeded initial state from spec** | ❌ | `previewState` initializes as `{}`. No `initialState` field in VfAppSpec type. |
| **Per-item remove from list** | ❌ (from UI) | `remove` action exists in handleAction but no list node exposes it per-item. Only usable via a standalone button with hardcoded index. |

### Blocked Capabilities (require app code changes)

1. **Per-item toggle in list** — the `list` node type needs an `onPress` or `itemAction` field, and the renderer needs to handle it. Without this, no todo can be marked complete/incomplete from within the list.

2. **Seeded initial state** — the VfAppSpec type needs an `initialState` field (or the renderer needs to read one from the spec and seed `previewState` on load). Without this, the "Buy milk" / "Ship build" seeded todos cannot appear on first render.

3. **Per-item style change** — even if toggle were added, the `list` renderer would need conditional styling based on item properties (e.g., strikethrough for `done: true`).

### Summary

The canonical todo test **cannot pass** on the current renderer. The blockers are engine-level, not test-level. The smoke test validates everything the renderer *can* do today.

---

## Recommended Next Execution Slice

**Run the Track 1 smoke test.**

This is the smallest honest thing that produces real signal:
- If it passes: the renderer works for all currently supported node types, and the only gaps are the three blocked capabilities above.
- If it fails: we learn something concrete about renderer reliability before touching any code.

After the smoke test, the next decision is whether to invest in adding the three blocked capabilities to the renderer (app code changes) or to wait for API key access to test end-to-end generation instead.
