# Changelog

## Unreleased

### Changed

- `META_ALLOWED_AD_ACCOUNTS` agora e obrigatorio por default; uso sem escopo exige `META_UNSAFE_ALLOW_ALL_AD_ACCOUNTS=true`.
- `streamable-http` agora exige `META_HTTP_BEARER_TOKEN` por default; o bypass sem auth so existe com `META_UNSAFE_ALLOW_UNAUTHENTICATED_HTTP=true` em loopback.
- `appsecret_proof` agora e redigido junto com `access_token` em logs, erros e URLs sanitizadas.

### Added

- Testes para os novos gates de config e para a sanitizacao de `appsecret_proof`.
- Smoke test HTTP cobrindo request sem bearer e request autorizada.

## 0.1.0 - 2026-04-08

Initial validated read-only release candidate.

### Added

- GitHub Actions workflow for automated test execution across Python 3.10, 3.11, 3.12, and 3.14.
- Local `unittest` coverage for config, Meta API helpers, server tool behavior, and transport smoke tests.
- Read-only UAT runner at `scripts/run_uat_smoke.py`.

### Changed

- Lazy runtime bootstrap for settings and client creation.
- Stronger allowlist enforcement with ownership checks for campaign, ad set, and ad derived reads.
- Retry/backoff handling for transient Meta API failures.
- Structured JSON logging and stronger sensitive-value masking.
- Standardized pagination validation with `limit` and `after` support.
- Structured handling for invalid JSON and deleted-app token errors from Meta.

### Validated

- Local suite passing with 33 tests.
- `stdio` and `streamable-http` startup smoke-tested locally.
- Editable install and packaged CLI entrypoint validated in a local virtual environment.
- Real Meta read-only UAT validated at account, campaign, ad set, ad, and insights levels.
