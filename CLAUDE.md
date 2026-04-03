<!-- GSD:project-start source:.planning/PROJECT.md -->
## Project

**SEO Content Marketing Automation**

Sistema autônomo de automação de SEO e marketing de conteúdo. Executa localmente via Claude Code.

**Core value:** Ciclo completo de content marketing SEO automatizado — de análise competitiva a publicação — executável semanalmente de forma autônoma.

**Stack:** Node.js 20+ | JavaScript/ES2022+ | JSON files | Claude Code

**Context:** Usuário quer deixar PC ligado e avançar sozinho o máximo possível.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:.planning/research/STACK.md -->
## Technology Stack

**Core:** Node.js 20+, JavaScript/ES2022+
**Dependencies:** node-fetch, xml2js, dotenv, chalk, node-schedule, winston, uuid
**Dev:** nodemon

**Installation:**
```bash
npm init -y
npm install node-fetch xml2js dotenv chalk node-schedule winston uuid
npm install -D nodemon
```

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:.planning/REQUIREMENTS.md -->
## Conventions

- REQ-ID format: `[CATEGORY]-[NUMBER]` (e.g., SEO-01, CONTENT-01)
- Plan files: `{phase}-{plan}-PLAN.md` (e.g., 01-01-PLAN.md)
- Commit messages: imperative mood ("add", "fix", "implement")
- 14 requirements across 6 phases
- Idempotency required: every operation must be safely re-runnable

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:.planning/research/ARCHITECTURE.md -->
## Architecture

**Layers:** CLI Interface → Core Services → Integration Adapters → Storage

**Structure:**
```
seo-ranker/
├── src/
│   ├── cli/           # Interface de comandos
│   ├── core/          # Lógica de negócio
│   ├── integrations/  # Arvo, WordPress, Blotado, RSS
│   ├── services/      # Logger, queue, store
│   └── config/        # Env vars loader
├── plans/             # Planos de execução
├── context/           # Contexto persistente
├── logs/              # Logs operacionais
├── brand-kit/         # Arquivos de marca
└── .env.example       # Template de variáveis
```

**Pipelines:**
1. Weekly Blog: Analyze → Plan → Generate → Publish
2. Weekly Social: RSS → Detect new → Generate → Publish

<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->
