# Roadmap: SEO Content Marketing Automation

## Overview

Este projeto automatiza o ciclo completo de content marketing SEO: análise competitiva → pesquisa de keywords → planejamento editorial → geração de artigos via Arvo → publicação WordPress → distribuição social via Blotado. Executável semanalmente de forma autônoma via Claude Code.

## Phases

- [ ] **Phase 1: Foundation** - Estrutura base, config, CLI
- [ ] **Phase 2: Brand Kit & Configuration** - Config de marca e regras editoriais
- [ ] **Phase 3: Operational Foundation** - Logging, retry, idempotency
- [ ] **Phase 4: Core Pipeline** - Análise, planejamento, geração, publicação
- [ ] **Phase 5: RSS & Social** - Leitura de RSS e integração Blotado
- [ ] **Phase 6: Weekly Runner** - Agendamento semanal e health checks

## Phase Details

### Phase 1: Foundation
**Goal**: Estrutura base do projeto, package.json, .env.example, CLI funcional, store básico
**Depends on**: Nothing (first phase)
**Requirements**: OPS-04
**Success Criteria** (what must be TRUE):
  1. .env.example existe com todas as variáveis necessárias
  2. Estrutura de pastas criada conforme arquitetura
  3. package.json com dependências básicas
  4. CLI aceita comandos --help e mostra estrutura
  5. Store.json existe em context/

**Plans**: 3 plans

Plans:
- [ ] 01-01: Setup project structure and package.json
- [ ] 01-02: Create .env.example with all required variables
- [ ] 01-03: Implement basic CLI with --help

---

### Phase 2: Brand Kit & Configuration
**Goal**: Brand kit configurável com tom de voz, CTAs, links, editorial rules
**Depends on**: Phase 1
**Requirements**: BRAND-01, BRAND-02
**Success Criteria** (what must be TRUE):
  1. brand-kit.json carrega de arquivo local
  2. Brand kit validado antes de geração de conteúdo
  3. Editorial rules configuráveis (comprimento, densidade, links)
  4. Palavras-chave proibidas funcionam

**Plans**: 2 plans

Plans:
- [ ] 02-01: Brand kit structure and loader
- [ ] 02-02: Editorial rules engine

---

### Phase 3: Operational Foundation
**Goal**: Sistema de reliability — logging, retry queue, idempotency, store
**Depends on**: Phase 1
**Requirements**: OPS-01, OPS-02
**Success Criteria** (what must be TRUE):
  1. Winston logs gravam em logs/ com rotação
  2. Retry com backoff exponencial funciona
  3. Idempotency store previne duplicação
  4. Erros são pegos e logados com stack trace

**Plans**: 3 plans

Plans:
- [ ] 03-01: Winston logger with rotation
- [ ] 03-02: Retry queue with exponential backoff
- [ ] 03-03: Idempotency store

---

### Phase 4: Core Pipeline
**Goal**: Pipeline completo — competitor analysis → keyword research → editorial calendar → Arvo → WordPress
**Depends on**: Phase 2, Phase 3
**Requirements**: SEO-01, SEO-02, SEO-03, CONTENT-01, PUBLISH-01, PUBLISH-02
**Success Criteria** (what must be TRUE):
  1. analyze --competitors funciona e detecta lacunas
  2. plan --keywords gera calendário editorial
  3. generate --article envia para Arvo e recebe artigo
  4. publish --article publica no WordPress
  5. APPROVAL_MODE=true pausa antes de publicar
  6. --dry-run mostra output sem publicar

**Plans**: 5 plans

Plans:
- [ ] 04-01: Competitor analyzer module
- [ ] 04-02: Keyword research module
- [ ] 04-03: Editorial planner module
- [ ] 04-04: Arvo integration adapter
- [ ] 04-05: WordPress publishing adapter

---

### Phase 5: RSS & Social
**Goal**: Leitura de feed RSS e criação de posts sociais via Blotado
**Depends on**: Phase 4
**Requirements**: RSS-01, SOCIAL-01
**Success Criteria** (what must be TRUE):
  1. read-rss detecta novos posts não processados
  2. social --generate cria posts para cada novo artigo
  3. social --publish envia para Blotado
  4. Posts duplicados não são recriados

**Plans**: 2 plans

Plans:
- [ ] 05-01: RSS reader module
- [ ] 05-02: Blotado integration adapter

---

### Phase 6: Weekly Runner
**Goal**: Automação recorrente — scheduled execution, health checks, notifications
**Depends on**: Phase 5
**Requirements**: OPS-03
**Success Criteria** (what must be TRUE):
  1. run-weekly-blog executa pipeline completo
  2. run-weekly-social detecta novos posts e distribui
  3. Health check antes de executar
  4. Status report ao final da execução
  5. Failures disparam notificação

**Plans**: 2 plans

Plans:
- [ ] 06-01: Weekly runner orchestration
- [ ] 06-02: Health checks and notifications

---

### Phase 7: Frontend Upgrade
**Goal**: Dashboard moderna com formulário de configurações para variáveis de ambiente
**Depends on**: Phase 6
**Requirements**: FRONTEND-01, FRONTEND-02
**Success Criteria** (what must be TRUE):
  1. Dashboard com visual moderno (Tailwind CSS)
  2. Formulário de configurações editing .env variables
  3. Navegação com abas/rotas
  4. Componentes acessíveis e responsivos

**Plans**: 2 plans

Plans:
- [ ] 07-01: Modern UI with Tailwind CSS
- [x] 07-02: Settings form for environment variables

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | ✅ Complete | 2026-04-03 |
| 2. Brand Kit & Configuration | 2/2 | ✅ Complete | 2026-04-03 |
| 3. Operational Foundation | 3/3 | ✅ Complete | 2026-04-03 |
| 4. Core Pipeline | 5/5 | ✅ Complete | 2026-04-03 |
| 5. RSS & Social | 2/2 | ✅ Complete | 2026-04-03 |
| 6. Weekly Runner | 2/2 | ✅ Complete | 2026-04-03 |
| 7. Frontend Upgrade | 1/2 | In Progress|  |

**Total: 7 phases, 19 plans**
