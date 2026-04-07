# Roadmap: Meta Ads MCP Read-Only

**3 phases** | **16 requirements** | All v1 requirements covered ✓

## Phase 1: Foundation

**Goal:** Completar configuracao e hardening inicial do scaffold existente

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06

**Success Criteria:**
1. Todas variáveis de ambiente configuradas e validadas na inicialização
2. Account não allowlisted retorna erro claro antes de chamar API
3. Logs nunca contêm token completo
4. Headers de usage da Meta são logados via logger.info()
5. Transport stdio funciona com `meta-ads-mcp-readonly --transport stdio`
6. Transport HTTP funciona com `meta-ads-mcp-readonly --transport streamable-http --host localhost --port 8080`

---

## Phase 2: Hardening

**Goal:** Resiliência de produção e testes

**Requirements:** HARD-01, HARD-02, HARD-03, HARD-04, HARD-05, HARD-06

**Success Criteria:**
1. Retry automático com backoff exponencial em HTTP 429 e 5xx
2. Pagination cursor-based implementada em todas as tools
3. Testes unitários para config.py cobrem normalization e allowlist parsing
4. Testes unitários para meta_api.py cobrem allowlist enforcement
5. Testes unitários para server.py com mocks — 5 tools testadas
6. Logs em formato JSONStructured para produção

---

## Phase 3: UAT

**Goal:** Validação real com contas

**Requirements:** UAT-01, UAT-02, UAT-03, UAT-04

**Success Criteria:**
1. get_ad_accounts retorna contas sandbox
2. get_campaigns, get_adsets, get_ads retornam dados corretos
3. get_insights retorna métricas (impressions, reach, spend)
4. Account não allowlisted recebe erro: "account_id X is not allowlisted in META_ALLOWED_AD_ACCOUNTS"
5. Headers de usage são visíveis nos logs

---

## Milestone v1

**Complete:** 3 phases delivered, 16 requirements verified

**What we shipped:**
- MCP server read-only com 5 tools
- Allowlist de segurança
- Transport stdio e HTTP
- Testes unitários
- Retry com backoff
- Paginacao completa
- Logs estruturados