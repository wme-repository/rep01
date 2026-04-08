# Roadmap: Meta Ads MCP Read-Only

**3 phases** | **v1 still in progress**

## Phase 1: Foundation

**Goal:** Finish safe runtime bootstrap for the existing scaffold.

**Current status:** Implemented and locally smoke-tested.

**Implemented**

- Environment-driven settings loader
- Settings validation
- Token masking filter
- Read-only FastMCP server with 5 tools
- `stdio` and `streamable-http` transport wiring

**Still pending**

1. Confirm operational logging behavior end-to-end in CI environments

---

## Phase 2: Hardening

**Goal:** Production resilience and confidence.

**Implemented**

- Ownership checks for campaign, ad set, and ad level access before protected reads
- Retry with exponential backoff for 429 / 5xx and transient request failures
- Structured JSON logging by default
- Standardized `limit` validation and `after` cursor support across paginated tools
- Initial `unittest` suite for config, API helpers, and server tool behavior
- GitHub Actions CI workflow for automated test execution across supported Python versions
- Local test execution succeeded on Python 3.14.3
- Local transport smoke checks are covered by automated integration tests
- Editable install and packaged CLI entrypoint validation succeeded in a local virtual environment
- Read-only UAT runner prepared for credentialed execution against Meta
- Full read-only UAT succeeded against a real allowlisted account
- Live validation confirmed account, campaign, ad set, ad, and insights reads
- Live validation confirmed ad set-scoped `get_ads` behavior

**Still pending**

1. Observe and stabilize the CI workflow if any test failures appear
2. Optionally repeat the same read-only UAT against a sandbox account

---

## Phase 3: UAT

**Goal:** Validate real-world behavior with approved accounts.

**Implemented**

- Real allowlisted account validation
- Log verification for Meta usage headers during live reads
- Insights reads validated at account, campaign, ad set, and ad levels

**Still pending**

1. Sandbox account validation
2. Insights field review for useful defaults and filters

---

## Milestone v1

**Status:** Not complete

**Already delivered in code**

- Read-only MCP server
- 5 core read tools
- Basic allowlist enforcement
- Runtime settings validation
- Token masking
- Ownership checks to reduce allowlist bypass risk
- Retry/backoff
- Structured JSON logging
- Pagination guardrails
- Initial unit test scaffolding

**Required before calling v1 complete**

- Observed CI passing on supported Python versions
- Optional sandbox-account UAT if that environment matters for release
