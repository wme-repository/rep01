# Requirements: Meta Ads MCP Read-Only

**Defined:** 2026-04-07
**Core Value:** Ferramentas de leitura do Meta Ads com segurança por allowlist e observabilidade de uso

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Configuração completa por variáveis de ambiente (META_ACCESS_TOKEN, META_APP_SECRET, META_API_VERSION, META_ALLOWED_AD_ACCOUNTS, META_REQUEST_TIMEOUT_SECONDS)
- [ ] **FOUND-02**: Validação de account_id contra allowlist antes de qualquer chamada API
- [ ] **FOUND-03**: Token nunca logado completo — apenas prefixos para debugging
- [ ] **FOUND-04**: Logging de headers de usage da Meta (x-app-usage, x-business-use-case-usage, x-ad-account-usage)
- [ ] **FOUND-05**: Transport stdio funciona corretamente com MCP CLI
- [ ] **FOUND-06**: Transport streamable-http funciona com host/port configuráveis

### Hardening

- [ ] **HARD-01**: Retry com backoff exponencial em falhas transitórias (HTTP 429, 5xx)
- [ ] **HARD-02**: Paginacao completa em todas as tools (cursor-based com 'after')
- [ ] **HARD-03**: Testes unitarios para config.py (normalize_ad_account_id, parse_account_allowlist)
- [ ] **HARD-04**: Testes unitarios para meta_api.py (ensure_allowed_account, allowlist enforcement)
- [ ] **HARD-05**: Testes unitarios para server.py (cada tool com mock do GraphApiClient)
- [ ] **HARD-06**: Logging estruturado (JSON) para produksi

### UAT

- [ ] **UAT-01**: Validação com conta sandbox — todas as 5 tools retornam dados esperados
- [ ] **UAT-02**: Validação com conta real allowlisted — fluxo completo funciona
- [ ] **UAT-03**: Headers de usage são logados corretamente
- [ ] **UAT-04**: Account não allowlisted retorna erro claro

## Out of Scope

| Feature | Reason |
|---------|--------|
| Operações de escrita (create, edit, pause, delete) | v1 é explicitamente read-only |
| Upload de mídia | Não é ferramenta de criação |
| Integração com Pipeboard | Dependência externa não necessária |
| Write operations | Segurança-first — escopo travado |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| HARD-01 | Phase 2 | Pending |
| HARD-02 | Phase 2 | Pending |
| HARD-03 | Phase 2 | Pending |
| HARD-04 | Phase 2 | Pending |
| HARD-05 | Phase 2 | Pending |
| HARD-06 | Phase 2 | Pending |
| UAT-01 | Phase 3 | Pending |
| UAT-02 | Phase 3 | Pending |
| UAT-03 | Phase 3 | Pending |
| UAT-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial requirements definition*