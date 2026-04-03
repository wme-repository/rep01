# Phase 05 Verification

**Phase:** 05 - RSS & Social
**Status:** ✅ Planned (not yet executed)

## Success Criteria (from ROADMAP.md)

| # | Criterion | Verification Method |
|---|-----------|---------------------|
| 1 | `read-rss` detecta novos posts não processados | CLI test with RSS_FEED_URL |
| 2 | `social --generate` cria posts para cada novo artigo | CLI test with dry-run |
| 3 | `social --publish` envia para Blotado | CLI test with dry-run |
| 4 | Posts duplicados não são recriados | Run twice, check no duplicates |

## Requirements Coverage

| Requirement | Plan | Implementation |
|-------------|------|----------------|
| RSS-01: Leitura de feed RSS | 05-01 | fetchFeed(), getNewPosts() |
| SOCIAL-01: Automação social via Blotado | 05-02 | generateSocialPost(), publishSocialPost() |

## Pre-Execution Checklist

- [ ] Phase 4 fully implemented
- [ ] RSS_FEED_URL configured in .env
- [ ] BLOTADO_API_KEY and BLOTADO_BLOG_ID configured in .env
- [ ] xml2js installed

## Execution Order

1. **05-01** (wave 1): RSS reader + read-rss CLI
2. **05-02** (wave 1): Blotado adapter + social CLI

## Post-Execution Validation

```bash
# Test 1: Read RSS feed
RSS_FEED_URL=https://example.com/feed node src/cli/index.js read-rss
# Expected: lists new posts from feed

# Test 2: Generate social posts (dry run)
DRY_RUN=true node src/cli/index.js social --generate
# Expected: shows Twitter/LinkedIn/Facebook posts for each new article

# Test 3: Generate for specific platform
DRY_RUN=true node src/cli/index.js social --generate --platform linkedin
# Expected: shows only LinkedIn post

# Test 4: Idempotency
# Run social --generate twice - second run should show "no new posts"
```

## Blockers to Monitor

- Blotado API endpoints not confirmed — may need adjustment
- RSS feed URL needs real value for full test
