# SEO Ranker - Guia de Uso

## Dashboard Web

Iniciar o dashboard (API + Frontend):
```bash
npm run dashboard
```

- **API Server**: http://localhost:3001
- **Frontend**: http://localhost:5173

O frontend faz proxy automático das requisições `/api/*` para a API.

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dashboard` | Inicia API + Frontend |
| `npm run server` | Inicia apenas a API (porta 3001) |
| `npm start` | Executa CLI principal |
| `npm run analyze` | Analisa competidores |
| `npm run plan` | Gera calendário editorial |
| `npm run generate` | Gera artigos |
| `npm run publish` | Publica no WordPress |
| `npm run social` | Executa pipeline social |
| `npm run run:weekly` | Executa ciclo semanal completo |

---

## API Endpoints

### Health Check
```
GET /api/health
```
Retorna status de saúde do sistema (variáveis de ambiente, WordPress, disco).

### Store (Dados)
```
GET /api/store          # Dados completos
GET /api/store/articles # Calendário editorial
GET /api/store/operations # Operações recentes
GET /api/store/logs     # Logs recentes
```

### Pipelines
```
POST /api/pipeline/blog   # Executa pipeline blog
POST /api/pipeline/social # Executa pipeline social
POST /api/pipeline/all    # Executa ambos
```

Corpo da requisição (opcional):
```json
{ "dryRun": true }
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `BUSINESS_NAME` | Sim | Nome da empresa/marca |
| `ARVO_API_KEY` | Sim | Chave da API Arvo (geração de conteúdo) |
| `WORDPRESS_URL` | Sim | URL do WordPress (ex: https://site.com) |
| `WORDPRESS_USER` | Sim | Usuário WordPress |
| `WORDPRESS_APP_PASSWORD` | Sim | Senha de aplicação WordPress |
| `COMPETITORS` | Não | Lista de sites competidores (separados por vírgula) |
| `DRY_RUN` | Não | Modo teste (não publica realmente) |
| `MAIN_SITE_URL` | Não | URL do site principal para verificação |
| `NOTIFY_WEBHOOK_URL` | Não | Webhook para notificações de falha |

---

## Pipelines

### Pipeline Blog
1. Health check
2. Análise de competidores
3. Pesquisa de palavras-chave
4. Geração de calendário editorial
5. Geração de artigos (Arvo)
6. Publicação no WordPress

### Pipeline Social
1. Health check
2. Leitura de RSS (Hacker News)
3. Geração de posts sociais
4. Publicação nas plataformas (Twitter, LinkedIn, Facebook)

### Ciclo Completo
Executa blog + social em paralelo.

---

## Frontend (Dashboard)

### Abas
- **Dashboard**: Cards com resumo (artigos publicados, planejados, keywords, saúde)
- **Pipeline**: Botões para executar pipelines com output em tempo real
- **Articles**: Tabela do calendário editorial com status
- **Health**: Status detalhado de cada verificação

### Modo Dry Run
Por padrão, o dashboard executa em modo teste. Para executar realmente, envie:
```json
{ "dryRun": false }
```
via API ou defina `DRY_RUN=false` no ambiente.

---

## Estrutura de Arquivos

```
src/
├── cli/           # Interface de comandos
├── core/          # Lógica de negócio (runners, health, analyzer)
├── integrations/  # Arvo, WordPress, Blotado, RSS
├── services/      # Logger, store, retry queue
├── server/        # API Express
│   ├── index.js
│   └── routes/
│       ├── health.js
│       ├── pipeline.js
│       └── store.js
└── config/        # Carregamento de env vars
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── PipelinePanel.jsx
│   │   ├── ArticleTable.jsx
│   │   └── HealthCheck.jsx
│   ├── App.jsx
│   ├── api.js
│   └── main.jsx
└── vite.config.js
context/
└── store.json     # Dados persistentes
logs/
└── seo-ranker-*.log
```

---

## Solução de Problemas

### "Connection refused" no navegador
Verifique se ambos os servidores estão rodando:
```bash
curl http://localhost:3001/api/health
curl http://localhost:5173
```

### Health check falhando
1. Verifique as variáveis de ambiente no `.env`
2. Verifique conexão com WordPress
3. Execute `npm run analyze` para testar análise de competidores

### Pipeline não executa
- Use `dryRun: true` primeiro para testar
- Verifique os logs em `logs/seo-ranker-YYYY-MM-DD.log`
