# Conventions: Meta Ads MCP Read-Only

## Code Style
- **Type hints:** `from __future__ import annotations` + PEP 604 union syntax (`str | None`)
- **Async:** `async def` para operações I/O-bound (httpx)
- **Dataclasses:** `@dataclass(frozen=True)` para Settings

## Error Handling
- **HTTP errors:** `httpx.HTTPStatusError` → retorna JSON com `status_code`, `details`
- **Request errors:** `httpx.RequestError` → retorna JSON com `message`, `endpoint`, `details`
- **Validation errors:** `ValueError` → capturada no tool, retornada como JSON error

## Patterns

### JSON Response Pattern
```python
def to_json(payload: dict) -> str:
    return json.dumps(payload, indent=2, ensure_ascii=False)
```

### Account Normalization
```python
def normalize_ad_account_id(account_id: str) -> str:
    value = (account_id or "").strip()
    if value and not value.startswith("act_"):
        return f"act_{value}"
    return value
```

### Allowlist Check
```python
def ensure_allowed_account(settings: Settings, account_id: str) -> str:
    normalized = normalize_ad_account_id(account_id)
    if settings.allowed_ad_accounts and normalized not in settings.allowed_ad_accounts:
        raise ValueError(f"account_id {normalized} is not allowlisted")
    return normalized
```

## Logging
- `logging.basicConfig(level=logging.INFO)` em server.py
- Usar `logger.info()` para requisições e usage headers
- Nunca logar `access_token` completo

## Imports
- Preferir imports explícitos (`from .config import Settings`)
- `__future__` annotations em todos os arquivos