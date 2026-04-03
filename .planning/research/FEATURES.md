# Feature Research

**Domain:** SEO Content Marketing Automation
**Researched:** 2026-04-03
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Competitor keyword gap analysis | Base de qualquer estratégia SEO | MEDIUM | Análise de SERPs e identificação de lacunas |
| Keyword research (bottom-funnel) | Keywords de alto valor comercial | MEDIUM | Intenção de compra, volume e dificuldade |
| Editorial calendar generation | Organização do conteúdo | LOW | Títulos, pautas, datas |
| Article generation via AI | Redução de trabalho manual | MEDIUM | Integração com Arvo API |
| WordPress/CMS publishing | Destino final do conteúdo | MEDIUM | REST API integration |
| Manual approval mode | Controle de qualidade | LOW | Gate antes de publicar |
| RSS feed reading | Detectar conteúdo existente | LOW | Parse XML feeds |
| Social media content | Distribuição do conteúdo | MEDIUM | Integração Blotado |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Brand kit enforcement | Evita conteúdo genérico | MEDIUM | Tom, voz, CTAs, links configuráveis |
| Idempotent operations | Execução segura e repetível | MEDIUM | UUIDs, deduplicação |
| Autonomous weekly runner | Zero-touch operacional | HIGH | Agendamento robusto, retries |
| Editorial rules engine | Consistência de marca | MEDIUM | Links internos, palavras-chave proibidas |
| Operational logs/queues | Debugabilidade e reliability | MEDIUM | Winston logs, retry queues |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time ranking monitoring | Ver resultados rápidos | Custo de API, complexidade | Relatórios semanais manuais |
| Multi-language support | Alcance global | Localização é expensive | Foco português inicialmente |
| Automatic image generation | Ilustração automática | Qualidade inconsistente, copyright | Placeholder images + human review |
| Email newsletter automation | Engajamento direto | Provider lock-in | Integração futura via API |

## Feature Dependencies

```
[Keyword Research]
    └──requires──> [Competitor Analysis]

[Editorial Calendar]
    └──requires──> [Keyword Research]

[Article Generation]
    └──requires──> [Editorial Calendar]
    └──requires──> [Brand Kit Config]

[WordPress Publishing]
    └──requires──> [Article Generation]

[Social Media Automation]
    └──requires──> [RSS Feed Reading]
    └──requires──> [Article Generation]

[Weekly Runner]
    └──requires──> [All above]
```

### Dependency Notes

- **Keyword Research requires Competitor Analysis:** Só faz sentido pesquisar keywords sabendo onde estão as lacunas
- **Editorial Calendar requires Keyword Research:** Pautas derivam das oportunidades identificadas
- **Article Generation requires Editorial Calendar + Brand Kit:** Contexto de entrada para o Arvo
- **Social Media Automation requires RSS Feed Reading:** Precisa saber o que foi publicado para criar posts

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Competitor keyword gap analysis (top 3 concorrentes)
- [ ] Keyword prioritization (bottom-funnel, compra)
- [ ] Editorial calendar generation (títulos + pautas)
- [ ] Arvo API integration (article generation)
- [ ] WordPress REST API publishing
- [ ] Manual approval mode toggle
- [ ] RSS feed reading (detectar novos posts)
- [ ] Brand kit config (tom, voz, CTAs)
- [ ] .env.example with all required vars
- [ ] Basic weekly runner (cron/schedule)

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Blotado social media integration
- [ ] Editorial rules engine (links internos)
- [ ] Retry queue + idempotency
- [ ] Detailed operational logs
- [ ] Notification on failures (email/slack)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Multi-language content
- [ ] Image generation/optimization
- [ ] Email marketing integration
- [ ] Ranking tracking dashboard
- [ ] A/B testing headlines

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Competitor analysis | HIGH | MEDIUM | P1 |
| Keyword research | HIGH | MEDIUM | P1 |
| Editorial calendar | HIGH | LOW | P1 |
| Arvo integration | HIGH | MEDIUM | P1 |
| WordPress publishing | HIGH | MEDIUM | P1 |
| Manual approval mode | MEDIUM | LOW | P1 |
| RSS reading | MEDIUM | LOW | P2 |
| Brand kit enforcement | HIGH | MEDIUM | P1 |
| Weekly runner | HIGH | MEDIUM | P1 |
| Blotado integration | MEDIUM | MEDIUM | P2 |
| Retry/idempotency | MEDIUM | HIGH | P2 |
| Editorial rules | MEDIUM | MEDIUM | P2 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | SEMrush/Ahrefs | MarketMuse | Our Approach |
|---------|---------------|------------|--------------|
| Keyword research | CLI-based reports | AI suggestions | Claude Code autonomous analysis |
| Competitor analysis | Manual setup | Automated | Config via env vars |
| Content generation | Templates | AI full | Arvo API direct |
| Publishing | Manual export | Integrations | WordPress REST API |
| Social distribution | No native | No native | Blotado integration |

## Sources

- SEO automation tooling (SEMrush, Ahrefs, MarketMuse)
- Content marketing workflow patterns
- Claude Code autonomous agent patterns

---
*Feature research for: SEO Content Marketing Automation*
*Researched: 2026-04-03*
