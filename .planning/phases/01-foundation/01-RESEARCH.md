# Phase 1: Foundation - Research

**Researched:** 2026-04-07
**Domain:** Python MCP server foundation -- environment validation, token masking, logging, transport configuration
**Confidence:** MEDIUM-HIGH

## Summary

The scaffold at `src/meta_ads_mcp_readonly/` implements the core MCP server with httpx and FastMCP. The FOUND-01 through FOUND-06 requirements map to four technical domains: (1) env var validation at startup, (2) token masking in logging, (3) transport configuration, and (4) verifying existing working code. The scaffold has meaningful gaps: `Settings.from_env()` accepts empty tokens with no validation, no token masking filter exists, and the stdio/HTTP transports need verification. The project convention of `frozen=True` dataclass means adding pydantic would be a breaking change -- lightweight dataclass validation is the correct approach.

**Primary recommendation:** Add a `Settings.validate()` classmethod called explicitly at startup in `server.py` before constructing the GraphApiClient, and install a `MaskingFilter` on the root logger to guarantee the access token is never emitted in any log statement.

## User Constraints (from CONTEXT.md)

### Locked Decisions
*(none -- no CONTEXT.md found; all Phase 1 requirements are open for research)*

### Claude's Discretion
- Choice of validation approach (dataclass-native vs pydantic)
- Token masking implementation details
- How to structure the startup validation call

### Deferred Ideas (OUT OF SCOPE)
- Retry with backoff (HARD-01 -- Phase 2)
- Cursor-based pagination completeness (HARD-02 -- Phase 2)
- JSON structured logging for production (HARD-06 -- Phase 2)
- Unit tests (HARD-03/04/05 -- Phase 2)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Complete env var configuration (META_ACCESS_TOKEN, META_APP_SECRET, META_API_VERSION, META_ALLOWED_AD_ACCOUNTS, META_REQUEST_TIMEOUT_SECONDS) with validation at startup | Sections 1 and 2 below |
| FOUND-02 | account_id validation against allowlist before any API call | Already implemented in `ensure_allowed_account()` -- Section 3 |
| FOUND-03 | Token never logged complete -- only prefixes for debugging | Section 4 below |
| FOUND-04 | Logging of Meta usage headers (x-app-usage, x-business-use-case-usage, x-ad-account-usage) | Already implemented in `_log_usage_headers()` -- Section 3 |
| FOUND-05 | stdio transport works correctly with MCP CLI | Section 5 below |
| FOUND-06 | streamable-http transport works with configurable host/port | Section 5 below |

---

## 1. Environment Variable Validation at Startup

### Current State (Scaffold Gap)

`config.py` has `Settings.from_env()` which reads env vars via `os.getenv()` but performs **no validation**:

```python
# Current -- no validation, empty strings pass through
meta_access_token=os.getenv("META_ACCESS_TOKEN", "").strip()
# If META_ACCESS_TOKEN is unset, this becomes "" and is accepted
```

`server.py` calls `settings = Settings.from_env()` at module-import time (line 19) with no subsequent validation. An empty `META_ACCESS_TOKEN` would be stored in the frozen dataclass and only fail at API call time -- not at startup.

### Recommended Approach: Dataclass-Native Validation

Since the project uses `@dataclass(frozen=True)` and adding `pydantic` would contradict the frozen-immutable pattern and require adding a dependency, the standard approach is a **`validate()` classmethod** on `Settings`:

```python
from dataclasses import dataclass
import os

@dataclass(frozen=True)
class Settings:
    meta_access_token: str
    meta_app_secret: str
    meta_api_version: str
    allowed_ad_accounts: tuple[str, ...]
    request_timeout_seconds: float

    @classmethod
    def from_env(cls) -> "Settings":
        # Read raw values
        return cls(
            meta_access_token=os.getenv("META_ACCESS_TOKEN", "").strip(),
            meta_app_secret=os.getenv("META_APP_SECRET", "").strip(),
            meta_api_version=os.getenv("META_API_VERSION", "v24.0").strip() or "v24.0",
            allowed_ad_accounts=parse_account_allowlist(
                os.getenv("META_ALLOWED_AD_ACCOUNTS", "")
            ),
            request_timeout_seconds=float(
                os.getenv("META_REQUEST_TIMEOUT_SECONDS", "30").strip() or "30"
            ),
        )

    def validate(self) -> None:
        """Validate settings at startup. Raises ValueError on failure."""
        if not self.meta_access_token:
            raise ValueError("META_ACCESS_TOKEN is required and cannot be empty")
        if not self.meta_api_version.startswith("v"):
            raise ValueError(f"META_API_VERSION must start with 'v', got {self.meta_api_version!r}")
        if self.request_timeout_seconds <= 0:
            raise ValueError(
                f"META_REQUEST_TIMEOUT_SECONDS must be positive, got {self.request_timeout_seconds}"
            )
```

**Call site in `server.py`:**

```python
settings = Settings.from_env()
settings.validate()  # raises ValueError on invalid config
```

This is the standard Python pattern for dataclass validation and requires no additional dependencies. Validation is explicit and fails fast at startup.

### Validation Rules by Variable

| Variable | Required | Validation Rule |
|----------|----------|-----------------|
| `META_ACCESS_TOKEN` | Yes | Non-empty string after strip |
| `META_APP_SECRET` | No | Non-empty if set (needed for appsecret_proof) |
| `META_API_VERSION` | No | Must start with "v" (e.g., "v24.0") |
| `META_ALLOWED_AD_ACCOUNTS` | No | Comma-separated `act_` IDs (normalize_ad_account_id handles) |
| `META_REQUEST_TIMEOUT_SECONDS` | No | Positive float |

### Anti-Pattern to Avoid

**Do not** use `pydantic.BaseSettings` -- it would require replacing `@dataclass(frozen=True)` with `pydantic.BaseModel`, adding a new dependency, and breaking the project's existing immutability convention. The dataclass-native approach above is correct for this project.

---

## 2. Token Masking in Logging

### Current State (Scaffold Gap)

The CONCERNS.md explicitly flags this risk: "Token não é logado completo (partial masking não implementado)." The existing code does not log the token directly in the places reviewed, but:

1. No `MaskingFilter` exists to prevent future accidental logging
2. `httpx` may log request URLs/headers containing the token at DEBUG level
3. Any exception stringification could expose the token

### Recommended Approach: Logging Filter with Token Masking

Install a custom `Filter` on the root logger that replaces the access token value in any log record before emission:

```python
import logging
import re

class SensitiveValueFilter(logging.Filter):
    """Replaces sensitive values (tokens, secrets) in log messages with masked versions."""

    def __init__(self, name: str, sensitive_values: dict[str, str]):
        super().__init__(name)
        # Map of key -> (pattern_or_value, replacement)
        self._patterns: list[tuple[re.Pattern[str], str]] = []
        for key, value in sensitive_values.items():
            if value and len(value) > 8:
                # Replace last 8 chars with asterisks: tok...XXXX
                suffix = "".join("*" for _ in range(min(8, len(value))))
                pattern = re.compile(re.escape(value))
                self._patterns.append(
                    (pattern, f"{key}...{value[-4:]}")  # e.g., "token...xxxx"
                )

    def filter(self, record: logging.LogRecord) -> bool:
        if not self._patterns:
            return True
        msg = record.getMessage()
        for pattern, replacement in self._patterns:
            msg = pattern.sub(replacement, msg)
        record.msg = msg
        return True
```

**Installation in `server.py`:**

```python
from .config import Settings

# Build sensitive values map (call after Settings.from_env())
_settings = Settings.from_env()
_token = _settings.meta_access_token

# Install filter on root logger to catch ALL loggers
sensitive_filter = SensitiveValueFilter(
    "sensitive",
    {"access_token": _token}
)
root_logger = logging.getLogger()
root_logger.addFilter(sensitive_filter)
```

This approach:
- Catches token in any logger (`httpx`, `httpcore`, `mcp`, etc.) because it filters at the root level
- Uses regex substitution so partial matches also get masked
- Preserves the last 4 characters for debugging prefix identification
- Is additive -- does not require changing existing `logger.info()` calls

### Additional Safeguard: Custom URL/Params Redaction in httpx

For httpx specifically, since it logs request URLs and params at DEBUG level, also add a redaction transform. However, the primary defense is the logging filter above. For httpx 0.27+, you can pass event hooks:

```python
# In GraphApiClient.get() or httpx.AsyncClient construction
# Hook to strip token from httpx's own log events
```

This is secondary -- the `SensitiveValueFilter` on the root logger is the primary mitigation for FOUND-03.

### What NOT to Do

Do not try to wrap `logger.info()` calls individually. The filter approach covers all loggers and all callsites simultaneously.

---

## 3. Allowlist and Usage Headers (Already Implemented)

### FOUND-02: Allowlist Enforcement

The `ensure_allowed_account()` function in `meta_api.py` is correctly implemented:

```python
def ensure_allowed_account(settings: Settings, account_id: str) -> str:
    normalized = normalize_ad_account_id(account_id)
    if not normalized:
        raise ValueError("account_id is required")
    if settings.allowed_ad_accounts and normalized not in settings.allowed_ad_accounts:
        raise ValueError(
            f"account_id {normalized} is not allowlisted in META_ALLOWED_AD_ACCOUNTS"
        )
    return normalized
```

Called at the top of each tool (`get_campaigns`, `get_adsets`, `get_ads`, `get_insights`) before making any API call. The `get_ad_accounts` tool filters post-fetch -- acceptable for v1 read-only per ARCHITECTURE.md.

**Verification needed:** The `normalize_ad_account_id()` function must handle edge cases (empty string, whitespace-only, already-normalized `act_` prefix). `config.py` handles these correctly.

### FOUND-04: Usage Header Logging

`_log_usage_headers()` in `meta_api.py` (lines 52-69) correctly extracts and logs the three Meta usage headers. This is already implemented and working.

---

## 4. Structured Logging in Python (Background -- Phase 2)

HARD-06 (Phase 2) requires JSON structured logging for production. The current `logging.basicConfig(level=logging.INFO)` produces unstructured text logs. For Phase 1, plain text is acceptable since HARD-06 is out of scope.

**For Phase 2 planning:** The standard approach is `python-json-logger` or `structlog`. `structlog` is the more modern choice and pairs well with httpx/mcp stacks:

```bash
pip install structlog
```

---

## 5. Transport Configuration (stdio and streamable-http)

### Current State

`server.py` main() uses `argparse` with `--transport`, `--host`, `--port`:

```python
parser.add_argument("--transport", choices=["stdio", "streamable-http"], default="stdio")
parser.add_argument("--host", default="localhost")
parser.add_argument("--port", type=int, default=8080)

if args.transport == "streamable-http":
    mcp.settings.host = args.host
    mcp.settings.port = args.port
    mcp.settings.stateless_http = True
    mcp.settings.json_response = True
    mcp.run(transport="streamable-http")
    return

mcp.run(transport="stdio")
```

### stdio Transport (FOUND-05)

`mcp.run(transport="stdio")` is the standard FastMCP stdio runner. This should work correctly with the MCP CLI when invoked as `meta-ads-mcp-readonly --transport stdio`. The entry point in `pyproject.toml` correctly maps to `server:main`.

**Verification command:**
```bash
meta-ads-mcp-readonly --transport stdio
# Should start and wait for MCP JSON-RPC input on stdin
```

### streamable-http Transport (FOUND-06)

The `mcp.settings` attributes being set (`host`, `port`, `stateless_http`, `json_response`) are FastMCP instance attributes. The configuration looks correct but **needs end-to-end verification** -- the code pattern is right but the attribute names should be confirmed against the installed `mcp` version.

**Verification command:**
```bash
meta-ads-mcp-readonly --transport streamable-http --host localhost --port 8080
# Should start HTTP server on localhost:8080
# curl http://localhost:8080/mcp  (or similar health check)
```

### Key Concern: `mcp.settings` Attribute Names

The FastMCP `settings` object attributes (`host`, `port`, `stateless_http`, `json_response`) need to be verified against the installed `mcp` library version (1.12.0-2.0.0). If the attribute names differ, the HTTP transport will not configure correctly. This should be confirmed via a test import:

```python
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("test")
print(dir(mcp.settings))  # check available attributes
```

This is a **LOW confidence** finding -- the attribute names may need verification in the actual environment.

---

## Architecture Patterns

### Recommended Project Structure (no change needed)

```
src/meta_ads_mcp_readonly/
├── __init__.py
├── __main__.py          # Entry point alternative
├── config.py            # Settings dataclass + validation (augment)
├── meta_api.py          # GraphApiClient + allowlist + usage headers
└── server.py            # FastMCP tools + main() + logging init
```

No structural changes needed for Phase 1. The scaffold layout is appropriate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env var validation | Custom validation loop with if/else | Dataclass `validate()` classmethod | Standard pattern, no extra deps, fails fast |
| Token masking | Per-callsite redaction | `logging.Filter` on root logger | Covers all loggers including httpx/httpcore |
| HTTP client errors | Manual status code handling | `httpx.HTTPStatusError` + `httpx.RequestError` | Already used, correctly catches 4xx/5xx |

---

## Common Pitfalls

### Pitfall 1: Validating After Construction
**What goes wrong:** Calling `validate()` after the frozen dataclass is already constructed means you cannot fix invalid state -- you can only raise.
**How to avoid:** Call `Settings.from_env()` then immediately `validate()` in the same expression: `Settings.from_env().validate()` -- or split into two steps with explicit error handling at startup.

### Pitfall 2: Logging Token Before Filter Installed
**What goes wrong:** If any `logger.info()` call fires between module import and the filter being added, sensitive values could leak.
**How to avoid:** Install the `SensitiveValueFilter` before any other module code runs -- ideally as the first line of `server.py` after `load_dotenv()` but before any other imports that might log.

### Pitfall 3: MaskingFilter Pattern Collision
**What goes wrong:** The masked replacement string (e.g., `access_token...xxxx`) could itself contain characters that look like real tokens in future regex substitutions.
**How to avoid:** Use a distinctive format (e.g., `[REDACTED-{key}]`) that cannot collide with any real token pattern.

### Pitfall 4: Empty Allowlist Bypass
**What goes wrong:** If `META_ALLOWED_AD_ACCOUNTS` is empty, `ensure_allowed_account()` skips the check entirely (`if settings.allowed_ad_accounts and ...`). This is intentional per design but could be surprising.
**How to avoid:** Document this behavior. In FOUND-01 startup validation, consider warning if the allowlist is empty.

---

## Code Examples

### Token Masking Filter (FOUND-03)

```python
import logging
import re

class SensitiveValueFilter(logging.Filter):
    def __init__(self, sensitive_values: dict[str, str]):
        super().__init__("sensitive_filter")
        self._patterns: list[tuple[re.Pattern[str], str]] = []
        for key, value in sensitive_values.items():
            if value and len(value) > 4:
                suffix = value[-4:]
                pattern = re.compile(re.escape(value))
                self._patterns.append((pattern, f"[REDACTED-{key}-{suffix}]"))

    def filter(self, record: logging.LogRecord) -> bool:
        if not self._patterns:
            return True
        msg = record.getMessage()
        for pattern, replacement in self._patterns:
            msg = pattern.sub(replacement, msg)
        record.msg = msg
        return True
```

### Settings Validation (FOUND-01)

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    meta_access_token: str
    meta_app_secret: str
    meta_api_version: str
    allowed_ad_accounts: tuple[str, ...]
    request_timeout_seconds: float

    def validate(self) -> "Settings":
        if not self.meta_access_token:
            raise ValueError(
                "META_ACCESS_TOKEN is required. "
                "Set it in your environment or .env file."
            )
        if not self.meta_api_version.startswith("v"):
            raise ValueError(
                f"META_API_VERSION must start with 'v', got {self.meta_api_version!r}"
            )
        if self.request_timeout_seconds <= 0:
            raise ValueError(
                f"META_REQUEST_TIMEOUT_SECONDS must be positive, "
                f"got {self.request_timeout_seconds}"
            )
        return self
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `mcp.settings.host/port/stateless_http/json_response` are the correct FastMCP attribute names | Section 5 | Transport may not configure correctly; need verification |
| A2 | No token is currently logged in the existing code paths | Section 4 | If httpx logs at DEBUG level, token could leak before filter is installed |
| A3 | The allowlist bypass for empty `META_ALLOWED_AD_ACCOUNTS` is intentional design | Section 3 | If user expects empty to mean "no accounts allowed", this is a security gap |

---

## Open Questions

1. **Should empty `META_ALLOWED_AD_ACCOUNTS` warn or fail?**
   - Current code: bypasses allowlist check entirely (allows any account)
   - What we know: The design treats empty as "no restriction" (all accounts allowed)
   - What's unclear: Whether this should produce a startup warning
   - Recommendation: Add a `logger.warning()` at startup if allowlist is empty, since the security model depends on it being set

2. **`mcp.settings` attribute names for HTTP transport:**
   - What we know: FastMCP 1.12.0-2.0.0 is the installed range
   - What's unclear: Exact attribute names for host/port/configuration
   - Recommendation: Add a Wave 0 verification step that prints `mcp.settings` attributes to confirm

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond Python 3.10+ and installed pip packages)

The Phase 1 requirements are all code/configuration changes. All tools (`python`, `pip`, `python-dotenv`, `httpx`, `mcp`) are already covered by the project's `pyproject.toml` dependencies and do not require additional system-level tools.

---

## Sources

### Primary (HIGH confidence)
- `src/meta_ads_mcp_readonly/config.py` -- existing Settings dataclass implementation
- `src/meta_ads_mcp_readonly/meta_api.py` -- allowlist enforcement and usage header logging
- `src/meta_ads_mcp_readonly/server.py` -- transport configuration
- `pyproject.toml` -- dependency versions (httpx 0.27.0, mcp 1.12.0)
- `.planning/codebase/STACK.md` -- confirmed stack components

### Secondary (MEDIUM confidence)
- Python `logging` module documentation -- Filter class behavior
- FastMCP source (via installed package) -- transport runner behavior

### Tertiary (LOW confidence)
- `mcp.settings` attribute names -- need actual environment verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM -- httpx/mcp versions verified, but mcp.settings attribute names need verification
- Architecture: HIGH -- scaffold is well-structured, no changes needed for Phase 1
- Pitfalls: MEDIUM -- logging filter pattern is standard but httpx DEBUG-level logging needs verification

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days -- stack is stable)
