# Stack Research

**Domain:** SEO Content Marketing Automation
**Researched:** 2026-04-03
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 20+ | Runtime para automação | Execução local, scripts autônomos, npm ecosystem |
| JavaScript/TypeScript | ES2022+ | Linguagem | Claude Code native, manutibilidade |
| Claude Code | Latest | Executor autônomo | Agente principal do workflow |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node-fetch | ^3.3 | HTTP client | Chamadas API Arvo, WordPress, Blotado |
| xml2js | ^0.6 | RSS parsing | Leitura de feeds RSS do blog |
| dotenv | ^16.4 | Environment config | Variáveis de ambiente e segredos |
| chalk | ^5.3 | CLI output | Logs coloridos e legíveis |
| node-schedule | ^2.1 | Job scheduling | Execução recorrente semanal |
| winston | ^3.13 | Logging | Logs com rotação e níveis |
| uuid | ^9.0 | Idempotency keys | Prevenção de duplicação |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| VS Code | IDE | Principal ambiente de desenvolvimento |
| Git | Versionamento | Tracking de mudanças no projeto |
| npm | Package manager | Gestão de dependências |

## Installation

```bash
# Core
npm init -y
npm install node-fetch xml2js dotenv chalk node-schedule winston uuid

# Dev dependencies
npm install -D nodemon
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Node.js local | Python scripts | Se preferired shell scripts nativos |
| JSON files | SQLite | Para dados mais estruturados no futuro |
| node-schedule | cron (system) | cron é mais robusto para produção |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Puppeteer/Playwright | Overkill para automação stateless | curl/wget para fetch API |
| Banco relacional | Complejidade desnecessária para MVP | JSON files local |
| Cloud functions | Vai contar executando local | Execução direta via Node.js |

## Stack Patterns by Variant

**Se execução em Windows (ambiente atual):**
- Scripts .bat ou .ps1 para agendamento
- Agendador de tarefas Windows para recorrência

**Se execução em Linux:**
- Cron jobs para recorrência
- Systemd timers para reliability

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| node-fetch@3 | Node 18+ | Suporte a ESM nativo |
| node-schedule@2.1 | Node 14+ | Não suporta 秒 precisação |
| winston@3.13 | Node 12+ | Logger mais flexível |

## Sources

- Node.js 2025 best practices
- SEO automation tooling landscape
- Content marketing workflow patterns

---
*Stack research for: SEO Content Marketing Automation*
*Researched: 2026-04-03*
