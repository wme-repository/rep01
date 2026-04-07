# Meta Ads MCP Read-Only

## What This Is

MCP server read-only para leitura de dados do Meta Ads (Facebook/Instagram). Permite consultar contas, campanhas, ad sets, anúncios e métricas via Meta Graph API. Execução via stdio (MCP CLI) ou HTTP.

## Core Value

Ferramentas de leitura do Meta Ads com segurança por allowlist e observabilidade de uso — sem qualquer capacidade de escrita.

## Requirements

### Validated

- ✓ Scaffold MCP server com FastMCP — existente
- ✓ 5 tools de leitura (get_ad_accounts, get_campaigns, get_adsets, get_ads, get_insights) — existente
- ✓ Cliente Graph API com auth e appsecret_proof — existente
- ✓ Allowlist de contas via META_ALLOWED_AD_ACCOUNTS — existente
- ✓ Transport stdio e streamable-http — existente

### Active

- [ ] Foundation: config via environment, validação de inputs, logging
- [ ] Hardening: retries com backoff, paginação completa, testes unitários
- [ ] UAT: validação com conta sandbox e real allowlisted

### Out of Scope

- Qualquer operação de escrita (criação, edição, pausa, ativação, exclusão) — v1 read-only
- Upload de mídia — fora do escopo
- Integração com Pipeboard — fora do escopo
- Write operations de qualquer tipo — segurança-first por design

## Context

- Escopo travado em read-only desde o início
- Baseado em análise de `pipeboard-co/meta-ads-mcp` como referência técnica
- Não depende de Pipeboard — scaffold independente
- Projeto já tem estrutura Python com pyproject.toml e 5 tools implementadas

## Constraints

- **Tech stack**: Python 3.10+, httpx, mcp, python-dotenv
- **Segurança**: Nunca escreve na conta Meta, token nunca logado completo
- **Observabilidade**: Headers de usage da Meta são logados

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Read-only por default | Minimizar risco de uso indevido | ✓ Good |
| Allowlist de contas | Controle de acesso granular | ✓ Good |
| Frozen dataclass para Settings | Imutabilidade previne bugs | ✓ Good |
| stdio como transport default | Compatibilidade MCP CLI | ✓ Good |

---
*Last updated: 2026-04-07 after codebase mapping*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state