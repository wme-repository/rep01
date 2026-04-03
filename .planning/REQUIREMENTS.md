# Requirements

**Project:** SEO Content Marketing Automation
**Version:** 1.0
**Last Updated:** 2026-04-03

## Traceability

Traceability matrix linking requirements to roadmap phases.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 4 | Pending |
| SEO-03 | Phase 4 | Pending |
| CONTENT-01 | Phase 4 | Pending |
| PUBLISH-01 | Phase 4 | Pending |
| PUBLISH-02 | Phase 4 | Pending |
| RSS-01 | Phase 5 | Pending |
| SOCIAL-01 | Phase 5 | Pending |
| BRAND-01 | Phase 2 | Pending |
| BRAND-02 | Phase 2 | Pending |
| OPS-01 | Phase 3 | Pending |
| OPS-02 | Phase 3 | Pending |
| OPS-03 | Phase 6 | Pending |
| OPS-04 | Phase 1 | Pending |

## v1 Requirements

### Configuration & Setup

- [ ] **OPS-04**: Configuração por variáveis de ambiente e .env.example
  - Criar .env.example com todas as variáveis necessárias
  - Variáveis: BUSINESS_NAME, TARGET_AUDIENCE, BUSINESS_GOAL, MAIN_SITE_URL, CMS_TYPE, COMPETITORS, ARVO_API_KEY, WORDPRESS_URL, WORDPRESS_USER, WORDPRESS_APP_PASSWORD, BLOTADO_API_KEY, BLOTADO_BLOG_ID, RSS_FEED_URL, APPROVAL_MODE
  - Validação de credenciais ao iniciar

### Brand & Editorial

- [ ] **BRAND-01**: Brand kit configurável para evitar conteúdo genérico
  - Tom de voz (formal, casual, técnico)
  - CTAs padrão por tipo de artigo
  - Links internos padrão
  - Palavras-chave proibidas
  - Estrutura de artigo (h2, h3, parágrafos)

- [ ] **BRAND-02**: Regras editoriais configuráveis
  - Quantidade mínima/máxima de palavras
  - Densidade de keyword
  - Quantidade de links internos/externos
  - Tópicos proibidos

### SEO & Research

- [ ] **SEO-01**: Análise automática de concorrentes e identificação de lacunas de keywords
  - Input: lista de concorrentes (urls)
  - Output: keywords que concorrentes rankeiam mas usuário não
  - Análise de SERP para cada keyword

- [ ] **SEO-02**: Identificação e priorização de keywords de fundo de funil
  - Keywords de alta intenção de compra
  - Ordenação por volume x dificuldade x intent
  - Identificação de long-tail opportunities

- [ ] **SEO-03**: Geração de títulos, pautas e calendário editorial
  - Títulos otimizados para SEO
  - Pautas detalhadas por artigo
  - Datas de publicação sugeridas
  - Coordenação com keywords priorizadas

### Content Generation

- [ ] **CONTENT-01**: Integração com Arvo via API para geração de artigos
  - Envio de pauta + brand kit para Arvo
  - Recebimento de artigo gerado
  - Validação de output (comprimento, estrutura)
  - Modo draft vs publish

### Publishing

- [ ] **PUBLISH-01**: Publicação automática em WordPress via REST API
  - Criação de posts/pages
  - Categorias e tags
  - Imagens destacadas
  - SEO metadata (yoast-compatible)

- [ ] **PUBLISH-02**: Modo com aprovação manual antes da publicação
  - Flag APPROVAL_MODE=true
  - Output do artigo para revisão antes de publicar
  - Comando approve/reject

### Social & Distribution

- [ ] **RSS-01**: Leitura de feed RSS do blog para detectar novos posts
  - Parse de RSS XML
  - Comparação com posts já processados
  - Identificação de novos posts

- [ ] **SOCIAL-01**: Automação de criação de conteúdo para redes sociais via Blotado
  - Geração de posts sociais a partir de novos artigos
  - Ajustes de formato por rede (Twitter, LinkedIn, etc)
  - Programação de posts via Blotado API

### Operational

- [ ] **OPS-01**: Sistema de logs, retries, filas e idempotência
  - Logs estruturados com Winston
  - Retry com backoff exponencial
  - Fila de operações
  - Ids de operação para idempotência

- [ ] **OPS-02**: Tratamento de falhas com fallback e alertas
  - Catch de erros em cada estágio
  - Fallback para graceful degradation
  - Alertas em falha (log de erro + notificação)

- [ ] **OPS-03**: Comandos operacionais recorrentes (semanal blog, social)
  - Comando: run-weekly-blog
  - Comando: run-weekly-social
  - Health check antes de executar
  - Status report ao final

## v2 Requirements (Deferred)

- [ ] Multi-language content generation
- [ ] Image generation/optimization
- [ ] Email marketing integration
- [ ] Real-time ranking monitoring
- [ ] A/B testing headlines
- [ ] Database migration (SQLite/Postgres)

## Out of Scope

| Exclusion | Reason |
|-----------|--------|
| Multi-site management | Complexidade além do MVP |
| Image generation | Requer integração adicional |
| Email marketing automation | Provider-specific, adiar |
| Real-time SEO monitoring | Ferramenta externa (SEMrush, etc) |
| Multi-language | Foco em português inicialmente |
| Backlink analysis | Escopo diferente |

## Requirement Quality Checklist

- [x] Specific and testable
- [x] User-centric (system can X)
- [x] Atomic (one capability per requirement)
- [x] Independent (minimal dependencies)

---
*Requirements defined: 2026-04-03*
