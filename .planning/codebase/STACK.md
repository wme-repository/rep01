# Stack: Meta Ads MCP Read-Only

## Language & Runtime
- **Python 3.10+** — requisito do projeto
- Módulos principais: `asyncio`, `dataclasses`

## Frameworks & Libraries
- **httpx** `>=0.27.0,<1.0.0` — cliente HTTP async para Meta Graph API
- **mcp[cli]** `>=1.12.0,<2.0.0` — Model Context Protocol server (FastMCP)
- **python-dotenv** `>=1.0.0,<2.0.0` — carregamento de variáveis de ambiente
- **hatchling** — build backend (pyproject.toml)

## Key Dependencies
| Package | Purpose |
|---------|---------|
| `httpx` | Requisições HTTP async para Meta API |
| `mcp` | Server MCP com transports stdio e streamable-http |
| `python-dotenv` | .env file loading |

## Configuration
- **pyproject.toml** — projeto Hatch com script entry point `meta-ads-mcp-readonly`
- **.env.example** — template de variáveis de ambiente
- Sem arquivos `setup.py` ou `setup.cfg` — tudo em `pyproject.toml`

## Environment Variables
| Variable | Required | Default |
|----------|----------|---------|
| `META_ACCESS_TOKEN` | Yes | — |
| `META_APP_SECRET` | No | "" |
| `META_API_VERSION` | No | v24.0 |
| `META_ALLOWED_AD_ACCOUNTS` | No | (empty) |
| `META_REQUEST_TIMEOUT_SECONDS` | No | 30 |

## Transport Options
- **stdio** (default) — para integração MCP CLI
- **streamable-http** — para servidores HTTP com host/port configuráveis