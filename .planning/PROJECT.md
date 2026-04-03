# SEO Content Marketing Automation

## What This Is

Sistema autônomo de automação de SEO e marketing de conteúdo. O agente recebe contexto do negócio e automaticamente: analiza concorrentes, identifica lacunas de keywords, gera planejamento editorial, envia pautas para o Arvo (geração de artigos), publica no WordPress/CMS, e optionally cria conteúdo para redes sociais via Blotado.

## Context

**Stack desejada:** Node.js + JavaScript/TypeScript | Local storage para contexto e planos
**Banco de dados:** Local (JSON files) para MVP
**Hospedagem:** Execução local no PC do operador (modo autônomo)

## Problem Resolved

Operações manuais de SEO e content marketing consomem horas semanais de trabalho repetitivo: pesquisa de keywords, análise de concorrentes, criação de calendário editorial, redação de artigos, publicação, e criação de posts para redes sociais. Este projeto automatiza o ciclo completo, permitindo execução recorrente semanal com mínima intervenção.

## Core Value

Ciclo completo de content marketing SEO automatizado — de análise competitiva a publicação — executável semanalmente de forma autônoma pelo agente.

## Who This Is For

Operador técnico autônomo (o agente Claude Code) executando no PC do usuário. O usuário configura credenciais uma vez e o sistema executa sozinho.

## Business Context (placeholders — preencher via variáveis de ambiente)

- **Empresa/Nicho:** `[BUSINESS_NAME]` — via `BUSINESS_NAME` env var
- **Público-alvo:** `[TARGET_AUDIENCE]` — via `TARGET_AUDIENCE` env var
- **Objetivo:** `[BUSINESS_GOAL]` — via `BUSINESS_GOAL` env var (leads, vendas, tráfego)
- **Site principal:** `[MAIN_SITE_URL]` — via `MAIN_SITE_URL` env var
- **CMS:** `WORDPRESS` ou outro — via `CMS_TYPE` env var
- **Concorrentes:** `[COMPETITOR_1, COMPETITOR_2]` — via `COMPETITORS` env var

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Execução local via Claude Code | Autonomia total sem infraestrutura cloud adicional | — Pending |
| Arvo para geração de conteúdo | API de IA disponível para geração de artigos otimizados | — Pending |
| WordPress REST API para publicação | CMS mais comum, API madura | — Pending |
| Blotado para social media | Automação de postagem em redes sociais | — Pending |
| Modo dual: automático e com aprovação | Usuário escolhe nível de controle por operação | — Pending |

## Requirements

### Active

- [ ] **SEO-01**: Análise automática de concorrentes e identificação de lacunas de keywords
- [ ] **SEO-02**: Identificação e priorização de keywords de fundo de funil (alta intenção de compra)
- [ ] **SEO-03**: Geração de títulos, pautas e calendário editorial
- [ ] **CONTENT-01**: Integração com Arvo via API para geração de artigos SEO
- [ ] **PUBLISH-01**: Publicação automática em WordPress via REST API
- [ ] **PUBLISH-02**: Modo com aprovação manual antes da publicação
- [ ] **RSS-01**: Leitura de feed RSS do blog para detectar novos posts
- [ ] **SOCIAL-01**: Automação de criação de conteúdo para redes sociais via Blotado
- [ ] **BRAND-01**: Brand kit enforcement (tom, voz, CTAs, links) para evitar conteúdo genérico
- [ ] **BRAND-02**: Links internos e regras editoriais configuráveis
- [ ] **OPS-01**: Sistema de logs, retries, filas e idempotência
- [ ] **OPS-02**: Tratamento de falhas com fallback e alertas
- [ ] **OPS-03**: Comandos operacionais recorrentes (semanal blog, social)
- [ ] **OPS-04**: Configuração por variáveis de ambiente e .env.example

### Out of Scope

- Monitoramento de rankings em tempo real — ferramenta externa
- Automação de email marketing — depende de provedor específico
- Geração de imagens — requer integração adicional
- Multi-idioma — focar em português inicialmente
- Análise de backlinks — ferramenta externa

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after initialization*
