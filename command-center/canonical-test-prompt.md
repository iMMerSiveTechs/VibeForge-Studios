# Canonical Test Prompt

Use this exact prompt for every validation run.
Do not drift scope.
Do not add extra features.
Do not silently fix code by hand after generation.

---

Build a simple mobile todo app preview using the existing preview flow.

Requirements:
- one main screen only
- show a title at the top: Todo Test
- include a text input for a new todo
- include an Add button
- render a visible list of todos below
- each todo must be tappable to toggle complete/incomplete
- completed todos must visibly change style so the state change is obvious
- start with exactly two seeded example todos:
  - Buy milk
  - Ship build
- keep the UI simple and functional
- no authentication
- no navigation
- no external APIs
- no file upload
- no payments
- no extra tabs
- no hidden setup steps

Success condition for the run:
- preview loads
- app renders
- a new todo can be added
- an existing todo can be toggled complete
- the UI visibly updates correctly

Rules:
- same prompt every run
- no scope expansion
- no manual rescue edits after generation
- if the run fails, log the failure instead of patching it
