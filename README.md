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
- O codigo ja coleta headers de uso da Meta para observabilidade.

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

- `META_ACCESS_TOKEN`: token de acesso da Meta
- `META_APP_SECRET`: opcional, recomendado para chamadas server-to-server
- `META_API_VERSION`: padrao `v24.0`
- `META_ALLOWED_AD_ACCOUNTS`: contas permitidas, separadas por virgula
- `META_REQUEST_TIMEOUT_SECONDS`: timeout HTTP

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

## Observacao

Esse projeto foi iniciado do zero para o nosso protocolo read-only. A analise do `pipeboard-co/meta-ads-mcp` serviu como referencia tecnica, mas este scaffold nao depende de Pipeboard.
