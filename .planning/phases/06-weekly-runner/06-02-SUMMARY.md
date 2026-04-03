# Summary 06-02: Health Checks and Notifications

**Phase:** 06 - Weekly Runner
**Status:** ✅ Implemented
**Date:** 2026-04-03

## Files Created

- `src/core/health.js` — Health check and notification module

## What Was Built

- `checkHealth()` — Validates config vars, WordPress API, network connectivity
- `runHealthCheck()` — Interactive health check with formatted output
- `notifyFailure(message, details)` — Logs and optionally sends webhook notification
- Health check runs before pipeline (skipped in dry-run mode)
- `run-weekly --check` — Standalone health check command

## Health Checks

1. **Config vars**: BUSINESS_NAME, ARVO_API_KEY, WORDPRESS_URL/USER/PASSWORD
2. **WordPress API**: Validates credentials via /users/me endpoint
3. **Network**: Connectivity to MAIN_SITE_URL
4. **Disk space**: System availability

## Verification

- `node src/cli/index.js run-weekly --check` — shows health status
- In live mode: pipeline aborts if health check fails
