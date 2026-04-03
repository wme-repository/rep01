# Phase 06 Verification

**Phase:** 06 - Weekly Runner
**Status:** ✅ Planned (not yet executed)

## Success Criteria (from ROADMAP.md)

| # | Criterion | Verification Method |
|---|-----------|---------------------|
| 1 | `run-weekly --blog` executa pipeline completo | CLI test with --dry-run |
| 2 | `run-weekly --social` detecta novos posts e distribui | CLI test with --dry-run |
| 3 | Health check antes de executar | Check runs before pipeline in live mode |
| 4 | Status report ao final da execução | Console output with summary |
| 5 | Failures disparam notificação | notifyFailure called on errors |

## Requirements Coverage

| Requirement | Plan | Implementation |
|-------------|------|----------------|
| OPS-03: Comandos operacionais recorrentes | 06-01 | runWeeklyBlog(), runWeeklySocial() |
| OPS-02: Tratamento de falhas com fallback | 06-02 | notifyFailure(), health checks |

## Execution Order

1. **06-01** (wave 1): Weekly runner orchestration
2. **06-02** (wave 1): Health checks and notifications

## Post-Execution Validation

```bash
# Test 1: Health check standalone
node src/cli/index.js run-weekly --check

# Test 2: Blog pipeline (dry run)
DRY_RUN=true node src/cli/index.js run-weekly --blog

# Test 3: Social pipeline (dry run)
DRY_RUN=true node src/cli/index.js run-weekly --social

# Test 4: Both pipelines
DRY_RUN=true node src/cli/index.js run-weekly --all
```
