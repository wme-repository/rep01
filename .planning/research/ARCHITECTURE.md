# Architecture Research

**Domain:** SEO Content Marketing Automation
**Researched:** 2026-04-03
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Interface Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Analyzer │  │ Planner  │  │ Runner   │  │ Monitor  │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
├───────┴────────────┴────────────┴──────────────┴──────────────┤
│                    Service Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ Competitor │  │ Keyword    │  │ Editorial  │              │
│  │ Analyzer   │  │ Research   │  │ Planner    │              │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘              │
│        │               │               │                      │
├────────┴───────────────┴───────────────┴──────────────────────┤
│                    Integration Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Arvo    │  │WordPress │  │ Blotado  │  │   RSS    │     │
│  │   API    │  │   REST   │  │   API    │  │  Parser  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    Storage Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Context  │  │  Plans   │  │  Logs    │  │ Brand    │     │
│  │  Store   │  │  Store   │  │  Store   │  │   Kit    │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CLI Interface | Comandos operacionais, args parsing | Node.js CLI com commander.js ou chalk |
| Analyzer | Análise de concorrentes e keywords | Web scraping + Claude Code analysis |
| Planner | Geração de calendário editorial | Prompt engineering + templates |
| Runner | Execução de jobs e workflows | node-schedule + async queues |
| Monitor | Logs, retries, idempotência | Winston + UUID tracking |
| Arvo Integration | Geração de artigos SEO | REST API calls |
| WordPress Integration | Publicação de conteúdo | WP REST API v2 |
| Blotado Integration | Social media posts | Blotado API |
| RSS Parser | Leitura de feeds | xml2js |
| Context Store | Persistência de contexto | JSON files |
| Brand Kit | Regras editoriais | JSON config |

## Recommended Project Structure

```
seo-ranker/
├── src/
│   ├── cli/              # Interface de linha de comando
│   │   ├── commands/     # Comandos (analyze, plan, run, etc)
│   │   └── index.js      # Entry point
│   ├── core/             # Lógica de negócio principal
│   │   ├── analyzer.js   # Análise de concorrentes
│   │   ├── planner.js    # Planejamento editorial
│   │   └── brand-kit.js  # Regras de marca
│   ├── integrations/     # Conexões externas
│   │   ├── arvo.js       # Arvo API client
│   │   ├── wordpress.js  # WordPress REST API
│   │   ├── blotado.js    # Blotado API
│   │   └── rss.js        # RSS feed parser
│   ├── services/         # Serviços utilitários
│   │   ├── logger.js     # Winston logger
│   │   ├── queue.js      # Retry queue
│   │   └── store.js      # JSON file storage
│   └── config/           # Configurações
│       └── index.js      # Env vars loader
├── plans/                # Planos de execução gerados
├── context/              # Contexto persistente
├── logs/                 # Logs operacionais
├── brand-kit/            # Arquivos de marca
├── .env.example          # Template de variáveis
├── package.json
└── README.md
```

### Structure Rationale

- **src/cli/:** Separa interface do usuário da lógica de negócio
- **src/core/:** Núcleo reutilizável independent de interfaces
- **src/integrations/:** Adapters para APIs externas — fáceis de trocar
- **src/services/:** Cross-cutting concerns (logging, storage, queue)
- **plans/, context/, logs/:** Dados operacionais fora do src/

## Architectural Patterns

### Pattern 1: Pipeline Architecture

**What:** Dados fluem através de estágios sequenciais (analyze → plan → generate → publish)
**When to use:** Workflows definidos com estágios claros
**Trade-offs:** Simples de entender, mas inflexível se o fluxo mudar

**Example:**
```javascript
async function runPipeline(stages, context) {
  for (const stage of stages) {
    context = await stage.execute(context);
  }
  return context;
}
```

### Pattern 2: Adapter Pattern

**What:** Abstrai integrações externas atrás de interfaces consistentes
**When to use:** APIs externas que podem mudar ou serem substituídas
**Trade-offs:** Mais código inicial, mas flexibilidade depois

**Example:**
```javascript
class ArvoAdapter {
  async generateArticle(prompt) {
    // Call Arvo API
  }
}
```

### Pattern 3: Command Pattern

**What:** Cada operação é um "command" com execute() e undo()
**When to use:** Operações que precisam de retry ou rollback
**Trade-offs:** Verbose, mas idempotente e retry-friendly

**Example:**
```javascript
class PublishCommand {
  async execute() { /* publish */ }
  async undo() { /* unpublish */ }
}
```

## Data Flow

### Request Flow

```
[Weekly Cron Trigger]
    ↓
[CLI Command: run-weekly]
    ↓
[Analyzer: competitor analysis]
    ↓
[Planner: editorial calendar]
    ↓
[Generator: Arvo article generation]
    ↓
[Approval Gate: manual/auto]
    ↓
[Publisher: WordPress REST API]
    ↓
[Social: Blotado (optional)]
    ↓
[Logs: Winston + stored context]
```

### State Management

```
[JSON Store: context.json]
    ↓ (read at startup)
[Runtime Context]
    ↓ (write after each stage)
[JSON Store: context.json]
```

### Key Data Flows

1. **Weekly run flow:** Cron → Analyze → Plan → Generate → Publish → Social → Log
2. **Content detection flow:** RSS → Diff against stored → Trigger social if new

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|-------------------------|
| 1 site | Monolito simples, JSON files |
| 5-10 sites | Multi-context, shared brand kit |
| 10+ sites | Database migration, job queue (BullMQ) |

### Scaling Priorities

1. **First bottleneck:** Concurrent API calls — rate limiting
2. **Second bottleneck:** Storage — JSON files get large

## Anti-Patterns

### Anti-Pattern 1: God Script

**What people do:** Colocar tudo em um único arquivo massive
**Why it's wrong:** Impossível de manter, testar, ou debugar
**Do this instead:** Módulos separados por responsabilidade

### Anti-Pattern 2: Synchronous Blocking

**What people do:** await em loops sequenciais quando paralelo é possível
**Why it's wrong:** Slow execution, API rate limits hit harder
**Do this instead:** Promise.all para chamadas independentes

### Anti-Pattern 3: No Idempotency

**What people do:** Executar o mesmo comando múltiplas vezes = resultado diferente
**Why it's wrong:** Execuções duplicadas, posts duplicados, chaos
**Do this instead:** UUIDs por operação, check antes de agir

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Arvo | REST API POST | Article generation, credits-based |
| WordPress | REST API v2 | Authentication via application password |
| Blotado | REST API | Social post scheduling |
| RSS Feed | HTTP GET + XML parse | Read-only, standard format |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI ↔ Core | Direct function calls | Simple, synchronous |
| Core ↔ Integrations | Adapter interfaces | Swappable |
| Runner ↔ Store | JSON file read/write | ACID-like transactions via temp files |

## Sources

- SEO content workflow patterns
- Node.js CLI architecture
- API integration patterns

---
*Architecture research for: SEO Content Marketing Automation*
*Researched: 2026-04-03*
