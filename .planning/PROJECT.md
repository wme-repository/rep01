# Meta Ads MCP Read-Only

## What This Is

Read-only MCP server for Meta Ads (Facebook / Instagram). It exposes account, campaign, ad set, ad, and insights reads through the Meta Graph API over `stdio` or HTTP transport.

## Core Value

Low-risk read access to Meta Ads data with strict account allowlisting and basic observability, without any write capability.

## Requirements

### Validated In Code

- FastMCP scaffold exists.
- The server exposes 5 read tools: `get_ad_accounts`, `get_campaigns`, `get_adsets`, `get_ads`, `get_insights`.
- Graph API auth and `appsecret_proof` support exist.
- Account allowlist parsing and enforcement exist.
- `stdio` and `streamable-http` transports are implemented.
- Settings validation exists.
- Sensitive token masking exists in server logging.
- Retry with backoff exists in the HTTP client.
- Structured JSON logging exists.
- Pagination limit validation and `after` cursor support are standardized in the tools.
- Invalid JSON payloads from successful HTTP responses are converted into structured errors.

### Active

- [ ] Observe the new GitHub Actions CI workflow and stabilize any failures.
- [x] Validate retry and pagination behavior against the live Meta API.
- [x] Execute `scripts/run_uat_smoke.py` with real credentials and IDs.
- [x] UAT with a real allowlisted account.
- [ ] Optional: repeat the same read-only UAT against a sandbox account.

### Out of Scope

- Any write operation against Meta Ads accounts.
- Media upload.
- Pipeboard integration.
- Any tool that mutates campaign, ad set, ad, or account state.

## Context

- The repository is past the initial scaffold stage but not yet production-ready.
- The current working tree contains uncommitted hardening changes in `config.py`, `meta_api.py`, and `server.py`.
- A GitHub Actions workflow now exists to run the unit tests on Python 3.10, 3.11, 3.12, and 3.14.
- The local unit test suite passed on Python 3.14.3 using the installed interpreter at `C:\Users\wagne\AppData\Local\Python\bin\python.exe`.
- Local transport smoke checks are now automated in the integration test suite.
- Editable install and the packaged CLI entrypoint were validated in a local virtual environment.
- A read-only UAT helper script exists for credentialed validation against the real Meta API.
- A previous credentialed UAT attempt failed because the provided Meta token was tied to an application that Meta reports as deleted.
- A subsequent credentialed UAT succeeded end-to-end against a real allowlisted account for account, campaign, ad set, ad, and insights reads.
- The live UAT confirmed that ad set scoping on `get_ads` is working correctly after the edge-path fix.
- Internal planning documents were previously inconsistent about completion state and were corrected on 2026-04-08.
- The shell still does not resolve `python` by name, but the absolute interpreter path works.

## Constraints

- Python 3.10+
- `httpx`, `mcp`, `python-dotenv`
- Read-only scope is non-negotiable for v1
- Token values must never be logged in full

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Read-only by default | Minimize misuse risk | Kept |
| Allowlist by ad account | Bound access to approved accounts | Kept |
| Lazy runtime bootstrap | Avoid crashing imports and improve testability | Implemented |
| Ownership checks for nested IDs | Prevent campaign/adset/ad based allowlist bypass | Implemented |
| JSON logs by default | Favor machine-readable observability in server environments | Implemented |
