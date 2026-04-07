# Testing: Meta Ads MCP Read-Only

## Current State
- **Nenhum teste implementado** — projeto em fase de scaffold
- ROADMAP.md menciona "testes unitarios" na fase 3 (Hardening)

## Testing Strategy (Para Implementação)

### Framework Recomendado
- `pytest` — padrão industry para Python
- `pytest-asyncio` — para tests de funções async

### Test Structure Proposta
```
tests/
├── __init__.py
├── conftest.py              # pytest fixtures
├── test_config.py           # Settings, normalization
├── test_meta_api.py         # GraphApiClient
└── test_server.py           # MCP tools
```

### Areas Críticas para Testar
1. **config.py:** `normalize_ad_account_id()`, `parse_account_allowlist()`
2. **meta_api.py:** `ensure_allowed_account()`, allowlist enforcement
3. **server.py:** Cada tool com mocks do GraphApiClient

### Mock Strategy
- Mock `httpx.AsyncClient` para testar API client
- Mock `GraphApiClient.get()` nos tests de tools
- Fixtures para Settings com diferentes configs

### Coverage Target
- Mínimo: 80% para código de segurança (allowlist, auth)
- Nice to have: 70% overall