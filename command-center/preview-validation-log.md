# Preview Validation Log

Use this table for the 10-run canonical validation.

| Run | Tier | Prompt Version | Build ID / Commit | Environment | Result | Time | Failure Bucket | Notes |
|-----|------|----------------|-------------------|-------------|--------|------|----------------|-------|
| 1 |  |  |  |  |  |  |  |  |
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
- loaded on retry after transient WebView failure
- invalid imports from generated code
- preview rendered but toggle handler broke
- wrong file loaded into preview
