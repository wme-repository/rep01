# Architecture: Meta Ads MCP Read-Only

## Pattern: Layered MCP Server

```
┌─────────────────────────────────────────┐
│  server.py (FastMCP)                    │
│  - Tool definitions (@mcp.tool())       │
│  - Input validation                      │
│  - Output formatting (to_json)           │
└────────────────┬────────────────────────┘
                 │ calls
                 ▼
┌─────────────────────────────────────────┐
│  meta_api.py (GraphApiClient)           │
│  - HTTP requests to Meta Graph API       │
│  - Auth (access_token, appsecret_proof)  │
│  - Error handling                        │
└────────────────┬────────────────────────┘
                 │ uses
                 ▼
┌─────────────────────────────────────────┐
│  config.py (Settings dataclass)          │
│  - Environment variable loading         │
│  - Account normalization                │
└─────────────────────────────────────────┘
```

## Data Flow

1. **MCP Tool Call** → `server.py` receives tool invocation
2. **Validation** → Checks `account_id` against allowlist via `ensure_allowed_account()`
3. **API Request** → `GraphApiClient.get()` builds request with auth params
4. **Response** → `to_json()` serializes dict to string return

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Settings as frozen dataclass | Imutabilidade para evitar modificações acidentais |
| Normalização de account_id | Flexibilidade de entrada (`123` ou `act_123`) |
| JSON strings como retorno | MCP protocol usa strings para tool responses |
| Allowlist check no server | Centraliza segurança em `meta_api.py` |

## Entry Points
- **CLI:** `meta-ads-mcp-readonly` (via pyproject.toml scripts)
- **Transport:** `stdio` ou `streamable-http` via argparse