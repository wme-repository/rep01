# SEO Content Marketing Automation

Sistema autônomo de automação de SEO e marketing de conteúdo. Executa localmente via Claude Code.

## Stack

- **Node.js 20+** | JavaScript/ES2022+ | React 19 | Express
- **Dashboard:** Vite + React + Tailwind CSS v4
- **APIs:** Arvo (geração), WordPress (publicação), Blotado (social)

## Funcionalidades

- Análise competitiva de keywords
- Planejamento editorial automatizado
- Geração de artigos via IA (Arvo)
- Publicação direta no WordPress
- Distribuição social via Blotado
- Dashboard web para monitoramento

## Setup

```bash
# Instalar dependências
npm install

# Copiar e configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves de API

# Iniciar dashboard (frontend + backend)
npm run dashboard
```

## Uso

```bash
# Análise competitiva
npm run analyze

# Planejar conteúdo
npm run plan

# Gerar artigos
npm run generate

# Publicar
npm run publish

# Social media
npm run social

# Executar pipeline completo semanal
npm run run:weekly
```

## Dashboard

Acesse `http://localhost:5173` após iniciar com `npm run dashboard`.

- **Dashboard** - Visão geral com métricas
- **Pipeline** - Execute pipelines manualmente
- **Artigos** - Gerencie artigos gerados
- **Health Check** - Status dos serviços
- **Settings** - Configure variáveis de ambiente

## Arquitetura

```
seo-ranker/
├── src/
│   ├── cli/           # Interface de comandos
│   ├── core/          # Lógica de negócio
│   ├── integrations/  # Arvo, WordPress, Blotado, RSS
│   ├── services/      # Logger, queue, store
│   └── server/        # Express API server
├── frontend/          # React dashboard (Vite)
├── plans/             # Planos de execução
├── context/           # Contexto persistente
├── logs/              # Logs operacionais
└── brand-kit/         # Arquivos de marca
```

## Pipelines

1. **Weekly Blog:** Analyze → Plan → Generate → Publish
2. **Weekly Social:** RSS → Detect new → Generate → Publish

## License

MIT
