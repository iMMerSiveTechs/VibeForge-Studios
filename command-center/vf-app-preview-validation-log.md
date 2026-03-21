# VF_APP Preview Validation Log

Use this table for the 10-run canonical validation of the current implemented loop:

`POST /api/generate` → `Project` updated → `Preview` tab renders `vfAppSpec`

| Run | Tier / Loop | Prompt Version | Build ID / Commit | Environment | Result | Time | Failure Bucket | Notes |
|-----|-------------|----------------|-------------------|-------------|--------|------|----------------|-------|
| 1 | VF_APP / generate | v1 (canonical) | fe08c06 | local macOS / bun | FAIL | — | Integration Failure | Backend requires AI provider API key for direct API calls. User has subscription-only access (Claude Max / OpenAI Codex OAuth). No API key available. Backend started, auth worked, project created — blocked at generate step. |
| 2 |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |

## Result values

Use one of:
- PASS
- PASS (after retry)
- FAIL

## Failure Bucket values

Use one of:
- Generation Failure
- Preview Failure
- Integration Failure
- Test Design Failure
- —

## Notes guidance

Keep notes short and operational.
Examples:
- `/api/generate` returned output with no vfAppSpec`
- preview rendered after one retry
- project updated but Preview tab could not render list interaction
- auth/session issue blocked generation request
- output was valid code-oriented text but not VF_APP-compatible
