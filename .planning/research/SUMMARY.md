# Project Research Summary

**Project:** SEO Content Marketing Automation
**Domain:** SEO Content Marketing Automation
**Researched:** 2026-04-03
**Confidence:** MEDIUM

## Executive Summary

Este projeto é um sistema autônomo de automação de marketing de conteúdo SEO. Executa localmente via Claude Code + Node.js, integrando-se com Arvo (geração de artigos), WordPress (publicação) e Blotado (social media). O fluxo principal é: análise competitiva → pesquisa de keywords → planejamento editorial → geração de conteúdo → publicação.

A stack recomendada é Node.js + JavaScript/TypeScript com JSON files para storage (MVP). Arquitetura em pipeline com adapters para APIs externas. O maior risco é a falta de idempotência e retry logic causando duplicação ou falhas silenciosas.

## Key Findings

### Recommended Stack

Node.js 20+ como runtime para execução de scripts autônomos. JavaScript/ES2022+ como linguagem principal. Principais libraries: node-fetch (HTTP), xml2js (RSS), winston (logging), node-schedule (agendamento), uuid (idempotency), chalk (CLI output), dotenv (env vars).

**Core technologies:**
- Node.js: Runtime — execution local autônoma, npm ecosystem
- Claude Code: Agente executor — workflow principal
- JSON files: Storage — simples para MVP, sem DB overhead

### Expected Features

**Must have (table stakes):**
- Competitor keyword gap analysis — base de qualquer estratégia SEO
- Keyword research (bottom-funnel) — alto valor comercial
- Editorial calendar generation — títulos + pautas + datas
- Arvo API integration — geração de artigos
- WordPress publishing — REST API
- Manual approval mode — controle de qualidade

**Should have (competitive):**
- Brand kit enforcement — evita conteúdo genérico
- RSS feed reading — detecta novos posts
- Weekly runner — execução autônoma recorrente
- Retry + idempotency — confiabilidade

**Defer (v2+):**
- Multi-language support
- Image generation
- Email automation
- Ranking dashboard

### Architecture Approach

Sistema em camadas: CLI Interface → Core Services → Integration Adapters → Storage. Padrão pipeline para o fluxo principal. Adapter pattern para APIs externas (Arvo, WordPress, Blotado). Command pattern para operações com retry/rollback.

**Major components:**
1. CLI Interface — comandos operacionais (analyze, plan, run, etc)
2. Analyzer/Planner — lógica de negócio (concorrentes, keywords, editorial)
3. Integration Adapters — Arvo, WordPress, Blotado, RSS
4. Operational Services — logger, queue, store

### Critical Pitfalls

1. **Content Duplication** — sem idempotência, re-runs duplicam conteúdo. Prevenção: UUIDs por operação.
2. **API Rate Limiting** — chamadas excessivas causam 429s. Prevenção: retry com backoff + rate limiter.
3. **Brand Kit Ignored** — artigos genéricos. Prevenção: brand kit enforced no prompt.
4. **Credential Exposure** — API keys em git. Prevenção: .env.example sem valores + .gitignore.
5. **Unreliable Weekly Execution** — pipeline não executa ou falha silenciosa. Prevenção: health check + alertas.

## Implications for Roadmap

### Phase 1: Foundation
**Rationale:** Setup básico sem o qual nada funciona
**Delivers:** Estrutura de pastas, .env.example, package.json, CLI básico, store básico
**Avoids:** Credential exposure (security from day 1)

### Phase 2: Brand Kit & Configuration
**Rationale:** Configuração de marca antes de gerar conteúdo
**Delivers:** Brand kit configurável, editorial rules, keyword mapping
**Avoids:** Brand kit ignored pitfall

### Phase 3: Operational Foundation
**Rationale:** Infraestrutura de reliability (retry, idempotency, logging)
**Delivers:** Retry queue, idempotency store, Winston logger
**Avoids:** Content duplication, silent failures, rate limiting

### Phase 4: Core Pipeline
**Rationale:** Fluxo principal de análise → planejamento → geração → publicação
**Delivers:** Pipeline completo executável
**Implements:** Analyzer, Planner, Arvo adapter, WP adapter

### Phase 5: RSS & Social
**Rationale:** Completedo ciclo: RSS detecta novos posts → social
**Delivers:** RSS reader, Blotado integration
**Uses:** Existing adapters pattern

### Phase 6: Weekly Runner
**Rationale:** Automação completa recorrente
**Delivers:** Scheduled execution, health checks, failure alerts
**Avoids:** Unreliable execution pitfall

### Phase Ordering Rationale

- Phase 1 (Foundation) primeiro: tudo depende de setup básico
- Phase 2 (Brand Kit) segundo: conteúdo depende de regras de marca
- Phase 3 (Ops) terceiro: reliability antes do fluxo principal
- Phase 4 (Pipeline) quarto: fluxo principal
- Phase 5 (RSS/Social) quinto: extensão do pipeline
- Phase 6 (Runner) sexto: automation completa

### Research Flags

- **Phase 4 (Core Pipeline):** Arvo API research needed — verificar formato de prompts e rate limits
- **Phase 4 (WordPress):** WP REST API authentication research — Application Password flow
- **Phase 5 (Blotado):** Blotado API research — endpoints e auth não familiares

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Standard Node.js CLI setup
- **Phase 3 (Operational):** Known retry/idempotency patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Node.js + npm ecosystem padrão; JSON files para MVP |
| Features | MEDIUM | Baseado em patterns de SEO tools; specifics dependem de credenciais |
| Architecture | MEDIUM | Pipeline + Adapter pattern é padrão; especificidades dependerem de API docs |
| Pitfalls | MEDIUM | Patterns comuns de automação; podem haver pitfalls específicos de API |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Arvo API:** Não temos documentação verificada — need API research phase
- **Blotado API:** Idem — need Blotado API research
- **Real competitor URLs:** Placeholders no env — quando preenchido, análise pode precisar ajustes

## Sources

### Primary (HIGH confidence)
- Node.js 2025 best practices
- SEO automation tooling landscape (SEMrush, Ahrefs, MarketMuse patterns)

### Secondary (MEDIUM confidence)
- Content marketing workflow patterns
- API integration patterns (REST, retry, idempotency)

### Tertiary (LOW confidence)
- Arvo API specifics — documentação não verificada
- Blotado API specifics — documentação não verificada

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
