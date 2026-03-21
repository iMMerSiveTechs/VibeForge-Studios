# Preview Validation Checklist

## Purpose

Use this checklist to decide whether the preview loop is reliable enough to build on.

This is an operational gate, not a vibes check.

---

## Canonical Test Goal

Validate that the system can generate a simple todo app change and show the result in preview reliably enough to be useful.

---

## Pass / Fail Criteria

### PASS
A run counts as **PASS** only if all are true:
1. The AI generates actual app code, not fake placeholder output.
2. The preview loads without manual rescue edits.
3. The main screen renders.
4. A todo can be added.
5. A todo can be toggled complete.
6. The UI visibly updates correctly.
7. No blocker-level error prevents evaluation.

### PASS (after retry)
A run counts as **PASS (after retry)** only when:
- the first attempt failed due to an obvious transient preview/load/network issue
- one immediate retry was used
- the retry passed without hidden manual fixes

This is not a clean PASS. Log it separately in notes.

### FAIL
A run is **FAIL** if any of these happen:
- build/render never loads
- generated code is obviously incomplete or broken
- interaction does not work
- preview cannot meaningfully show the result
- manual code repair was required to make it work
- the scope drifted from the canonical test

---

## Failure Buckets

Use one primary bucket per failed run.

### 1. Generation Failure
The model produced bad code.
Examples:
- invalid component structure
- broken logic
- missing handlers
- hallucinated imports
- unusable output

### 2. Preview Failure
The code may be fine, but the preview layer failed.
Examples:
- transform or wrapper failure
- react-native-web incompatibility
- WebView load failure
- unsupported primitive or runtime behavior

### 3. Integration Failure
The glue pipeline failed.
Examples:
- wrong file loaded
- state mismatch
- storage/load path broke
- build handoff failed
- fetch/transform pipeline broke

### 4. Test Design Failure
Use only if the test itself became inconsistent.
Examples:
- prompt drift
- changed success standard mid-run
- compared different app shapes as if identical

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

Track elapsed time from prompt submission to usable preview.

- **Good:** under 5 minutes
- **Acceptable:** 5–10 minutes
- **Concerning:** 10–20 minutes
- **Bad:** 20+ minutes

---

## Retry Rule

Allow **one immediate retry max** only for obvious transient failure such as:
- preview load glitch
- temporary network hiccup
- obvious non-deterministic wrapper/load issue

Do not retry for:
- bad generated code
- broken logic
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
4. Do not excuse preview failures as “basically working.”
5. Do not build more infrastructure based on one flashy success.
6. Record one primary failure bucket per failed run.
7. If model, tier, or environment changes, log it explicitly.

---

## Decision Rule After 10 Runs

- If results are **7/10 or better**, the loop is good enough to build on.
- If failures cluster in **Preview Failure**, improve the preview layer.
- If failures cluster in **Generation Failure**, improve prompting and output constraints.
- If failures cluster in **Integration Failure**, fix the pipeline before touching the model.
- If failures cluster in **Test Design Failure**, tighten the test before interpreting the results.
