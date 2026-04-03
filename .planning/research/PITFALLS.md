# Pitfalls Research

**Domain:** SEO Content Marketing Automation
**Researched:** 2026-04-03
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Content Duplication

**What goes wrong:**
O mesmo artigo é gerado e publicado múltiplas vezes, ou o mesmo post social é enviado repetidamente.

**Why it happens:**
Sem idempotência, re-runs do pipeline executam as mesmas ações. APIs não têm deduplicação nativa.

**How to avoid:**
- UUIDs por operação, salvos em contexto
- Check "already done?" antes de cada ação
- Store com keys únicas para cada artigo/post

**Warning signs:**
- Logs mostram mesma action executada 2x
- WordPress mostra posts com títulos duplicados
- Social media mostra posts idênticos

**Phase to address:**
Phase 3 (Operational Foundation) — idempotency é requirement

---

### Pitfall 2: API Rate Limiting

**What goes wrong:**
Chamadas excessivas às APIs (Arvo, WordPress, Blotado) causam 429 errors ou banimento temporário.

**Why it happens:**
Execução paralela de chamadas sem controle de concurrency. Falta de backoff exponencial.

**How to avoid:**
- Rate limiter centralizado (async queue com delay)
- Retry com backoff exponencial (1s, 2s, 4s, 8s)
- Batch operations onde possível

**Warning signs:**
- 429 Too Many Requests responses
- API auth failures after periods of silence
- "Quota exceeded" errors

**Phase to address:**
Phase 3 (Operational Foundation) — retry queue

---

### Pitfall 3: Brand Kit Ignored

**What goes wrong:**
Artigos gerados saem genéricos, sem voz da marca, CTAs errados, ou links internos incorretos.

**Why it happens:**
Brand kit não é enforced no prompt para Arvo. Falta de validação pós-geração.

**How to avoid:**
- Brand kit como input obrigatório para geração
- Prompt engineering com regras de marca
- Checklist de validação antes de publicar

**Warning signs:**
- Tom inconsistente entre artigos
- CTAs missing ou genéricos
- Links internos ausentes

**Phase to address:**
Phase 2 (Brand Kit & Configuration) + Phase 4 (Content Pipeline)

---

### Pitfall 4: Credential Exposure

**What goes wrong:**
API keys e passwords commitados no git, expostos em logs, ou salvos em plaintext inseguro.

**Why it happens:**
Desenvolvedor em modo "make it work" não prioriza segurança inicial.

**How to avoid:**
- .env.example SEM valores reais
- .env no .gitignore
- Secrets nunca em logs (chalk掩藏着?)
- Passwords WordPress via app password, não real password

**Warning signs:**
- git log mostra tokens/API keys
- .env file not in .gitignore
- Logs com password or key strings

**Phase to address:**
Phase 1 (Foundation) — .env.example + security practices

---

### Pitfall 5: Unreliable Weekly Execution

**What goes wrong:**
O pipeline não executa dependurado, ou executa mas falhas são silenciosas.

**Why it happens:**
- Scheduler não está rodando (Windows task não criada)
- Falhas não disparam alertas
- Rede/API timeout sem retry

**How to avoid:**
- Verificação de saúde antes de executar (health check)
- Alertas em falha (email, Slack webhook)
- Logs persistentes e acessíveis
- Retry automático para falhas transientes

**Warning signs:**
- Sem logs na janela de execução esperada
- Erros "Connection refused" não retryados
- Zero novos posts mas pipeline disse "success"

**Phase to address:**
Phase 3 (Operational Foundation) + Phase 5 (Weekly Runner)

---

### Pitfall 6: Keyword Cannibalization

**What goes wrong:**
Múltiplos artigos para a mesma keyword competem entre si, diluindo autoridade.

**Why it happens:**
Sem gestão de keyword mapping, diferentes artigos瞄mesmo tema.

**How to avoid:**
- Keyword mapping centralizado (quais topics já cobertos)
- Ferramenta de tracking de published content
- Revisão editorial antes de nova pauta

**Warning signs:**
- SEMrush/Ahrefs mostram múltiplas páginas ranqueando para mesmo termo
- Articles com titles muito similares
- Google Search Console mostra "duplicates"

**Phase to address:**
Phase 2 (Keyword Research + Planning)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded credentials | Quick to test | Security breach | Never |
| No retry logic | Simpler code | Silent failures | MVP only |
| Single .env file | Simple setup | Hard to rotate | MVP only |
| sync fs operations | Familiar syntax | Blocks event loop | MVP only |
| console.log debugging | No setup | No searchability | MVP only |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Arvo API | Não tratar 429/rate limits | Implement retry with backoff |
| WordPress REST | Usar password real em vez de Application Password | WP Application Password for auth |
| Blotado | Postar o mesmo content 2x | Idempotency key per post |
| RSS Feed | Assumir formato consistent | Handle malformed XML gracefully |
| All APIs | Ignoring timeout | Set reasonable timeout + retry |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sequential API calls | 10+ seconds for single run | Parallel where possible | 5+ articles per run |
| Large JSON context file | Slow read/write | Paginate or archive old entries | 100+ runs |
| No caching of competitor data | Slow re-analysis | Cache for 24h | Weekly runner |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Real WP password in .env | Full site compromise | Application Password |
| API keys in git history | Unauthorized usage | git filter-branch / pre-commit hooks |
| No HTTPS for APIs | Token interception | Always use HTTPS |
| Verbose error messages | Information disclosure | Sanitize error messages |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Auto-publish with errors | Bad content live | Manual approval by default |
| No visibility into pipeline | User doesn't trust system | Clear logs + status reports |
| Complex setup | User gives up | .env.example + README with steps |
| Silent failures | User thinks it's working | Notifications on failure |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **API Integration:** Often missing timeout handling — verify requests don't hang forever
- [ ] **Retry Logic:** Often missing exponential backoff — verify retries don't DDoS APIs
- [ ] **Idempotency:** Often missing — verify re-running doesn't create duplicates
- [ ] **Brand Kit:** Often not actually used in prompts — verify output matches brand rules
- [ ] **Weekly Runner:** Often not actually scheduled — verify Windows Task Scheduler exists

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate post | MEDIUM | Delete duplicate post, add to idempotency store |
| Rate limited | LOW | Wait, implement backoff, retry |
| Bad article published | MEDIUM | Unpublish, fix prompt, regenerate |
| Credential exposure | HIGH | Rotate immediately, audit logs, rotate again |
| Pipeline silent failure | LOW | Check logs, re-run with --force |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Content Duplication | Phase 3 (Idempotency) | Re-run pipeline, verify no duplicates |
| API Rate Limiting | Phase 3 (Retry Queue) | Simulate 429, verify backoff |
| Brand Kit Ignored | Phase 2 (Brand Kit) | Review generated content against brand rules |
| Credential Exposure | Phase 1 (Setup) | Security audit of .env handling |
| Unreliable Weekly Runner | Phase 5 (Weekly Runner) | Miss a scheduled run, verify alert |
| Keyword Cannibalization | Phase 2 (Keyword Research) | Track published keywords |

## Sources

- SEO content workflow post-mortems
- API integration failure case studies
- Node.js security best practices

---
*Pitfalls research for: SEO Content Marketing Automation*
*Researched: 2026-04-03*
