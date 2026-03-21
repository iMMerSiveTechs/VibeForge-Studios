# VF_APP Canonical Test Prompt

Use this exact prompt for every validation run.
Do not drift scope.
Do not add extra features.
Do not silently fix code by hand after generation.

This prompt is for the repo's **current implemented preview path**:
- AI generation via `POST /api/generate`
- project updated with `vfAppSpec`
- Preview tab renders the result

It is **not** for unimplemented RN-web/WebView preview infrastructure.

---

Generate a valid VF_APP-compatible result for the current VibeForge Studio preview system.

Build a simple todo app preview that works in the existing VF_APP Preview tab.

Requirements:
- one main screen only
- title at the top: Todo Test
- include a text input for a new todo
- include an Add button
- render a visible list of todos below
- each todo must be able to change between incomplete and complete using the current VF_APP-compatible interaction model
- completed todos must visibly change style or visible state so the change is obvious
- start with exactly two seeded example todos:
  - Buy milk
  - Ship build
- keep the UI simple and functional
- no authentication
- no navigation beyond the single screen
- no external APIs
- no file upload
- no payments
- no extra tabs
- no hidden setup steps

Output requirement:
- generate a result that is compatible with the current VF_APP preview flow and can be rendered by the existing Preview tab

Success condition for the run:
- generation completes
- project receives a valid renderable `vfAppSpec`
- Preview tab loads
- app renders
- a new todo can be added
- an existing todo can be toggled complete
- the UI visibly updates correctly

Rules:
- same prompt every run
- no scope expansion
- no manual rescue edits after generation
- if the run fails, log the failure instead of patching it
