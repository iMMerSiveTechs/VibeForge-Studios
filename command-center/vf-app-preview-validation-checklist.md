# VF_APP Preview Validation Checklist

## Purpose

Use this checklist to decide whether the current repo's real preview loop is reliable enough to build on.

This validates the actual implemented path:

`POST /api/generate` → `Project` record updated → `Preview` tab renders `vfAppSpec`

This is an operational gate, not a vibes check.

---

## Scope Note

This repo currently validates a **VF_APP preview loop**, not a React Native WebView code-runner loop.

**Not currently implemented in this repo:**
- RN-web Tier 3 preview
- WebView HTML wrapper preview for generated RN code
- Babel-in-browser RN transform path

Do not score failures or successes as if those capabilities already exist.

---

## Canonical Test Goal

Validate that the system can:
1. generate a valid VF_APP-compatible result through `POST /api/generate`
2. update the project record successfully
3. render the result in the Preview tab
4. support the required todo interactions in the current VF_APP preview runtime

---

## Pass / Fail Criteria

### PASS
A run counts as **PASS** only if all are true:
1. `POST /api/generate` completes without blocker-level error.
2. The project record is updated with a valid, renderable `vfAppSpec`.
3. The Preview tab loads the generated result.
4. The main preview screen renders.
5. A new todo can be added through the current preview interaction model.
6. A todo can be toggled complete/incomplete through the current preview interaction model.
7. The UI visibly updates correctly.
8. No hidden manual fixes were required.

### PASS (after retry)
A run counts as **PASS (after retry)** only when:
- the first attempt failed due to an obvious transient preview/load/network issue
- one immediate retry was used
- the retry passed without hidden manual fixes

This is not a clean PASS. Log it separately in notes.

### FAIL
A run is **FAIL** if any of these happen:
- generation request fails
- project does not receive a usable `vfAppSpec`
- Preview tab cannot render the result
- required interaction does not work
- generated output is incompatible with the current VF_APP preview path
- a manual repair was required to make it work
- the scope drifted from the canonical test

---

## Failure Buckets

Use one primary bucket per failed run.

### 1. Generation Failure
The AI output was bad or incompatible with the current path.
Examples:
- no valid `vfAppSpec`
- malformed VF_APP structure
- output only produced code files with no renderable preview spec
- todo interaction logic missing from generated spec

### 2. Preview Failure
The result may be valid, but the current Preview tab/runtime failed to render or behave correctly.
Examples:
- Preview tab did not load the spec correctly
- a supported node/action failed in the renderer
- render/runtime issue inside the current VF_APP preview surface

### 3. Integration Failure
The glue path failed before or around preview.
Examples:
- `/api/generate` failed
- project update failed
- wrong project state loaded
- auth/session/backend wiring issue blocked the run

### 4. Test Design Failure
Use only if the test itself became inconsistent.
Examples:
- prompt drift
- changed success standard mid-run
- compared current VF_APP preview against unimplemented RN-web expectations

---

## Success Thresholds

### Greenlight
- **7/10 passes or better** on the canonical test

### Yellow Zone
- **5–6/10 passes**
- promising but not trustworthy yet
- inspect dominant failure pattern before building more

### Red Zone
- **0–4/10 passes**
- do not add infrastructure
- fix the core loop first

---

## Timing Thresholds

Track elapsed time from prompt submission to usable rendered preview.

- **Good:** under 5 minutes
- **Acceptable:** 5–10 minutes
- **Concerning:** 10–20 minutes
- **Bad:** 20+ minutes

---

## Retry Rule

Allow **one immediate retry max** only for obvious transient failure such as:
- preview load glitch
- temporary network hiccup
- transient backend/load issue

Do not retry for:
- bad generated spec
- incompatible output shape
- broken interaction logic
- drifted scope
- manual rescue temptation

If retry succeeds:
- log the run as **PASS (after retry)**
- note the original transient failure in the Notes column

If retry fails:
- log the run as **FAIL**

---

## Manual Test Rules

1. Use the same canonical prompt every run.
2. Do not patch failed runs by hand.
3. Do not change the pass standard mid-test.
4. Do not score against unimplemented RN-web/WebView preview expectations.
5. Do not build more infrastructure based on one flashy success.
6. Record one primary failure bucket per failed run.
7. If model, provider, tier, or environment changes, log it explicitly.

---

## Decision Rule After 10 Runs

- If results are **7/10 or better**, the current VF_APP preview loop is good enough to build on.
- If failures cluster in **Generation Failure**, improve prompt constraints and output shape.
- If failures cluster in **Preview Failure**, improve the VF_APP preview renderer/runtime.
- If failures cluster in **Integration Failure**, fix auth/backend/project-update wiring before touching the model.
- If failures cluster in **Test Design Failure**, tighten the test before interpreting the results.
