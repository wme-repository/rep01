# Structure: Meta Ads MCP Read-Only

## Directory Layout

```
meta-ads-mcp-readonly/
├── .claude/                    # GSD planning (não commitado)
├── .planning/                  # Documentação de planejamento
│   └── codebase/               # Docs de mapeamento (commitado)
├── src/
│   └── meta_ads_mcp_readonly/
│       ├── __init__.py
│       ├── __main__.py          # Entry point alternativa
│       ├── config.py            # Settings dataclass
│       ├── meta_api.py          # GraphApiClient
│       └── server.py            # FastMCP server + tools
├── pyproject.toml               # Projeto + dependências
├── README.md                    # Documentação principal
├── ROADMAP.md                   # Roadmap original (legacy)
├── .env.example                 # Template de variáveis
└── .gitignore
```

## Key Files

| File | Purpose |
|------|---------|
| `src/meta_ads_mcp_readonly/server.py` | 5 tools MCP + main() |
| `src/meta_ads_mcp_readonly/meta_api.py` | Cliente HTTP async + allowlist |
| `src/meta_ads_mcp_readonly/config.py` | Settings + account normalization |
| `pyproject.toml` | hatch build + entry point |

## Naming Conventions
- **Módulos:** `snake_case` (meta_api, not metaApi)
- **Classes:** `PascalCase` (GraphApiClient, Settings)
- **Funções:** `snake_case` (ensure_allowed_account, normalize_ad_account_id)
- **Constantes:** `SCREAMING_SNAKE_CASE` (CAMPAIGN_FIELDS, DEFAULT_INSIGHTS_FIELDS)

## Package Structure
- Namespace package em `src/` (package = `meta_ads_mcp_readonly`)
- Sem imports relativos ambiguous (`from .config import`)