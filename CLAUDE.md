<!-- GSD:project-start source:PROJECT.md -->
## Project

**Meta Ads MCP Read-Only**

MCP server read-only para leitura de dados do Meta Ads (Facebook/Instagram). Permite consultar contas, campanhas, ad sets, anúncios e métricas via Meta Graph API. Execução via stdio (MCP CLI) ou HTTP.

**Core Value:** Ferramentas de leitura do Meta Ads com segurança por allowlist e observabilidade de uso — sem qualquer capacidade de escrita.

### Constraints

- **Tech stack**: Python 3.10+, httpx, mcp, python-dotenv
- **Segurança**: Nunca escreve na conta Meta, token nunca logado completo
- **Observabilidade**: Headers de usage da Meta são logados
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

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
### Account Normalization
### Allowlist Check
## Logging
- `logging.basicConfig(level=logging.INFO)` em server.py
- Usar `logger.info()` para requisições e usage headers
- Nunca logar `access_token` completo
## Imports
- Preferir imports explícitos (`from .config import Settings`)
- `__future__` annotations em todos os arquivos
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern: Layered MCP Server
```
```
## Data Flow
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
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
