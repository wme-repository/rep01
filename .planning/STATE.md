# State: Meta Ads MCP Read-Only

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Read-only access to Meta Ads data with allowlist enforcement and observable API usage.
**Current phase:** Phase 3 - UAT validated on a real allowlisted account.

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | Implemented in code |
| 2 | Hardening | Implemented and locally verified |
| 3 | UAT | Implemented and validated on a real account |

## Current Context

- The codebase already exposes 5 read-only MCP tools.
- Settings validation now exists in code and is evaluated lazily at runtime instead of at import time.
- Token masking and allowlist ownership checks were hardened in the current working tree.
- Retry/backoff and structured JSON logging now exist in code.
- Pagination inputs are standardized with validated `limit` and `after` cursor support.
- Invalid JSON responses from the Meta API are now converted into structured error payloads.
- Usage-header logging for failed HTTP responses was refined to avoid duplicate emission.
- Initial `unittest` coverage was added under `tests/`.
- The local Python installation was found at `C:\Users\wagne\AppData\Local\Python\bin\python.exe` (`Python 3.14.3`).
- Automated integration tests now cover local startup of both `streamable-http` and `stdio`.
- `python -m unittest discover -s tests -v` passed locally: 33 tests, 0 failures.
- Editable install and the `meta-ads-mcp-readonly` console entrypoint were validated in a local virtual environment.
- A read-only UAT runner now exists at `scripts/run_uat_smoke.py`.
- A previous UAT attempt against Meta failed with `OAuthException` code `190`: "Error validating application. Application has been deleted."
- Logging was tightened after the UAT attempt to suppress noisy `httpx` request logs that could include full URLs.
- A full read-only UAT now succeeds against a real allowlisted account at account, campaign, ad set, ad, and insights levels.
- Real UAT confirmed that `get_ads` scoped by `adset_id` returns only the expected ad set's ads.
- `paging.next` URLs are being returned with `access_token=[REDACTED]`.

## Next Recommended Action

- Observe the CI workflow on Python 3.10, 3.11, 3.12, and 3.14.
- Decide whether to close the milestone as v1-complete or keep one more pass for documentation polish.

## Last Updated

2026-04-08 after successful read-only UAT on a real allowlisted account
