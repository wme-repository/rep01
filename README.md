# Meta Ads MCP Read-Only

MCP proprio para leitura de Meta Ads com escopo inicial de baixo risco.

## Escopo v1

Ferramentas permitidas:

- `get_ad_accounts`
- `get_campaigns`
- `get_adsets`
- `get_ads`
- `get_insights`

Fica explicitamente fora do v1:

- criacao, edicao, pausa, ativacao, exclusao ou duplicacao
- upload de midia
- integracao com Pipeboard
- qualquer tool que escreva na conta

## Seguranca

- O servidor registra apenas tools de leitura.
- O token nunca e logado por completo.
- `appsecret_proof` e usado quando `META_APP_SECRET` estiver configurado.
- Existe allowlist de contas por `META_ALLOWED_AD_ACCOUNTS`.
- O codigo coleta headers de uso da Meta para observabilidade.
- IDs de campanha, ad set e ad sao verificados contra a conta allowlisted antes de consultas derivadas.

## Hardening

- Retries com backoff exponencial em HTTP 429, 5xx e erros transitorios de rede.
- Logging estruturado em JSON por padrao.
- Parametros de paginacao padronizados com `limit` validado entre `1` e `500`.
- Todas as tools paginadas aceitam cursor `after`.

## Status de Validacao

- Suite local passando com `33` testes.
- Smoke tests locais validados para `stdio` e `streamable-http`.
- Instalacao editavel validada em venv local com entrypoint `meta-ads-mcp-readonly`.
- UAT real concluida em modo somente leitura com conta allowlisted.
- Leituras validadas em nivel de conta, campanha, conjunto, anuncio e insights.
- URLs de paginacao retornam `access_token=[REDACTED]`.

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

- `META_ACCESS_TOKEN`: token de acesso da Meta
- `META_APP_SECRET`: opcional, recomendado para chamadas server-to-server
- `META_API_VERSION`: padrao `v24.0`
- `META_ALLOWED_AD_ACCOUNTS`: contas permitidas, separadas por virgula
- `META_REQUEST_TIMEOUT_SECONDS`: timeout HTTP
- `META_MAX_RETRIES`: quantidade maxima de retries automaticos
- `META_RETRY_BACKOFF_SECONDS`: base do backoff exponencial em segundos
- `META_LOG_FORMAT`: `json` ou `plain`

## Paginacao

- `get_ad_accounts`, `get_campaigns`, `get_adsets`, `get_ads` e `get_insights` aceitam `limit`.
- O cursor `after` pode ser usado para seguir a paginacao retornada pela Graph API.

## Execucao

Instale dependencias e rode:

```bash
python -m pip install -e .
meta-ads-mcp-readonly --transport stdio
```

Para HTTP:

```bash
meta-ads-mcp-readonly --transport streamable-http --host localhost --port 8080
```

## Testes

Execute a suite local com:

```bash
python -m unittest discover -s tests -v
```

O repositorio tambem inclui workflow de CI em `.github/workflows/ci.yml` para rodar os testes automaticamente em Python 3.10, 3.11, 3.12 e 3.14.

## UAT Read-Only

Para rodar uma validacao read-only contra a Meta, preencha no minimo:

- `META_ACCESS_TOKEN`
- `META_ALLOWED_AD_ACCOUNTS`
- `META_UAT_ACCOUNT_ID`

Campos opcionais para aprofundar a UAT:

- `META_APP_SECRET`
- `META_UAT_CAMPAIGN_ID`
- `META_UAT_ADSET_ID`
- `META_UAT_AD_ID`

Depois execute:

```bash
python scripts/run_uat_smoke.py
```

Ou sobrescreva os IDs via CLI:

```bash
python scripts/run_uat_smoke.py --account-id act_123 --campaign-id 456 --adset-id 789 --ad-id 999
```

## Observacao

Esse projeto foi iniciado do zero para o nosso protocolo read-only. A analise do `pipeboard-co/meta-ads-mcp` serviu como referencia tecnica, mas este scaffold nao depende de Pipeboard.
