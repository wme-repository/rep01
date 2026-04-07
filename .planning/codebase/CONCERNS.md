# Concerns: Meta Ads MCP Read-Only

## Technical Debt

### Missing Tests
- **Severity:** High
- **Description:** Sem testes unitários — risco de regressions
- **Fix:** Adicionar pytest na fase 3 (Hardening)

### Logging Token Exposure Risk
- **Severity:** Medium
- **Description:** Código usa `logger.info()` com `access_token` em contexto
- **Current mitigation:** Token não é logado completo (partial masking não implementado)
- **Risk:** Se logs forem escritos em arquivo, token pode vazar
- **Fix:** Implementar token masking em logging

## Security Considerations

### Allowlist Enforcement
- ✅ Implementado em `ensure_allowed_account()` — bom
- ⚠️ `get_ad_accounts` filtra após buscar — pode vazamento se API retornar dados não filterados antes
- **Status:** Abordagem ok para v1 read-only

### appsecret_proof
- ✅ Implementado corretamente com HMAC-SHA256
- ⚠️ Opcional — apenas usado se `META_APP_SECRET` configurado

## Fragile Areas

### Pagination
- **Status:** Parcialmente implementado (`after` param existe)
- ⚠️ `get_campaigns`, `get_adsets`, `get_ads`, `get_insights` suportam cursor-based pagination
- ⚠️ `get_ad_accounts` NÃO tem parâmetro `after` — pode não retornar todas contas
- **Fix:** Considerar adicionar pagination completa se account limit > 100

### Error Response Consistency
- ⚠️ Erros em tools são dicionários `{"error": {"message": ...}}`
- ⚠️ Erros internos do GraphApiClient também usam formato similar
- **Impact:** Baixo — formato consistente o suficiente

## Missing Features (Out of Scope v1)
- Retry with backoff — mencionado em ROADMAP fase 3
- Structured logging (JSON) — mencionado em ROADMAP fase 3
- Media upload — explicitamente fora do escopo
- Write operations (create, edit, pause, delete) — explicitamente fora do escopo