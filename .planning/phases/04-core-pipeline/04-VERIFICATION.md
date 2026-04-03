# Phase 04 Verification

**Phase:** 04 - Core Pipeline
**Status:** ✅ Planned (not yet executed)

## Success Criteria (from ROADMAP.md)

| # | Criterion | Verification Method |
|---|-----------|---------------------|
| 1 | `analyze --competitors` funciona e detecta lacunas | CLI test with competitors |
| 2 | `plan --keywords` gera calendário editorial | CLI test with keyword research |
| 3 | `generate --article` envia para Arvo e recebe artigo | CLI test with dry-run |
| 4 | `publish --article` publica no WordPress | CLI test with dry-run |
| 5 | `APPROVAL_MODE=true` pausa antes de publicar | Manual test |
| 6 | `--dry-run` mostra output sem publicar | CLI test |

## Requirements Coverage

| Requirement | Plan | Implementation |
|-------------|------|----------------|
| SEO-01: Análise automática de concorrentes | 04-01 | analyzeCompetitors() |
| SEO-02: Keywords fundo de funil | 04-02 | prioritizeKeywords() with funnel scoring |
| SEO-03: Geração de títulos e calendário | 04-03 | generateEditorialCalendar() |
| CONTENT-01: Integração Arvo | 04-04 | generateArticle() |
| PUBLISH-01: Publicação WordPress | 04-05 | publishArticle() |
| PUBLISH-02: Modo aprovação manual | 04-05 | APPROVAL_MODE in generate.js |

## Pre-Execution Checklist

- [ ] Phase 1-3 fully implemented and working
- [ ] COMPETITORS env var set with real competitor URLs
- [ ] ARVO_API_KEY configured in .env
- [ ] WordPress credentials (URL, user, app_password) configured
- [ ] `node src/cli/index.js --help` works
- [ ] Store has valid data structure

## Execution Order

1. **04-01** (wave 1): analyzeCompetitors() + analyze --competitors
2. **04-02** (wave 1): keywordGaps() + plan --keywords
3. **04-03** (wave 1): editorialCalendar() + plan --calendar
4. **04-04** (wave 2): generateArticle() + generate --article
5. **04-05** (wave 2): publishArticle() + publish --article

## Post-Execution Validation

### Functional Tests

```bash
# Test 1: Competitor analysis
node src/cli/index.js analyze --competitors
# Expected: fetches URLs, extracts keywords, caches in store

# Test 2: Keyword research
node src/cli/index.js plan --keywords --count 5
# Expected: shows 5 prioritized keywords with funnel stages

# Test 3: Editorial calendar
node src/cli/index.js plan --calendar --weeks 2
# Expected: shows 2-week calendar with titles

# Test 4: Article generation (dry run)
DRY_RUN=true node src/cli/index.js generate --article
# Expected: outputs article draft to console

# Test 5: Publish (dry run)
DRY_RUN=true node src/cli/index.js publish --article
# Expected: shows what would be published

# Test 6: Full pipeline (if APPROVAL_MODE=false)
APPROVAL_MODE=false DRY_RUN=false node src/cli/index.js run-weekly --dry-run
# Expected: shows full pipeline output
```

## Blockers to Monitor

- Arvo API documentation unverified
- Blotado API endpoints unconfirmed (Phase 5)
- All credentials are placeholders — full execution needs real values
