# ROADMAP

## 0. Contexto

- Escopo travado em read-only.
- Nada de escrita no v1.
- Rollout inicial apenas para contas allowlisted.

## 1. Foundation

- Configuracao por ambiente
- Cliente Graph API
- `appsecret_proof`
- allowlist de contas
- transporte `stdio` e `streamable-http`

## 2. Read Tools

- `get_ad_accounts`
- `get_campaigns`
- `get_adsets`
- `get_ads`
- `get_insights`

## 3. Hardening

- logs estruturados
- retries com backoff
- paginacao padronizada
- testes unitarios

## 4. UAT

- validacao com uma conta sandbox
- validacao com uma conta real allowlisted
- revisao de campos e filtros uteis
