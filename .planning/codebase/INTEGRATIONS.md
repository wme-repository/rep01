# Integrations: Meta Ads MCP Read-Only

## Meta Graph API
- **Endpoint base:** `https://graph.facebook.com/{version}`
- **Version:** configurável via `META_API_VERSION` (default: v24.0)
- **Auth:** access token + optional `appsecret_proof` (HMAC-SHA256)

## API Endpoints Used
| Endpoint | Purpose |
|----------|---------|
| `/{user_id}/adaccounts` | Lista contas de anúncio do usuário |
| `/{account_id}/campaigns` | Lista campanhas de uma conta |
| `/{account_id}/adsets` | Lista ad sets (opcional filtrado por campaign) |
| `/{account_id}/ads` | Lista anúncios (opcional filtrado por campaign/adset) |
| `/{object_id}/insights` | Retorna métricas (impressions, reach, spend, etc.) |

## Security: Allowlist
- `META_ALLOWED_AD_ACCOUNTS` — lista de contas permitidas (formato `act_XXXXX`)
- Verificação em `meta_api.py::ensure_allowed_account()`
- Accounts não allowlisted retornam erro `ValueError`

## Header Logging (Usage Observability)
- `x-app-usage` — uso de API a nível de app
- `x-business-use-case-usage` — uso por business case
- `x-ad-account-usage` — uso por conta de anúncio
- Headers logados via `logger.info()` em `_log_usage_headers()`

## No External Integrations
- Sem banco de dados
- Sem cache
- Sem webhook endpoints
- Sem integração com Pipeboard ou outros serviços