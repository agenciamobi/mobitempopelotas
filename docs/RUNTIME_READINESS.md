# Preflight de ambiente de produção

O preflight verifica se o runtime do Tempo Pelotas recebeu a configuração mínima para operar com Supabase externo, autenticação, Web Push, crons, REDEMET e host canônico.

Ele foi desenhado para falhar sem imprimir valores de credenciais. O relatório contém somente o nome das verificações, o estado e uma descrição sanitizada.

## Validação segura do template

O CI executa:

```bash
npm run runtime:check:example
```

Essa validação lê apenas `.env.example` e confirma:

- presença das declarações operacionais obrigatórias;
- modo `mock` como padrão seguro do repositório;
- `https://www.tempopelotas.com.br` como host canônico;
- URL base HTTPS da REDEMET;
- formato aceito para `VAPID_SUBJECT`;
- ausência de declarações client-side para secrets server-only.

O comando não exige e não deve receber credenciais reais.

## Validação do ambiente real

Execute somente em um terminal ou runtime protegido onde as variáveis do ambiente de produção já estejam carregadas:

```bash
npm run runtime:check
```

O comando exige:

- `SUPABASE_MODE=external` e `VITE_SUPABASE_MODE=external`;
- URLs pública e server-side do Supabase idênticas e em HTTPS;
- publishable keys pública e server-side idênticas;
- chave administrativa do Supabase exclusiva do servidor;
- `CRON_SECRET` e `PUSH_ADMIN_SECRET` distintos, não triviais e com pelo menos 32 caracteres;
- par VAPID P-256 correspondente, com chave pública não comprimida;
- `VAPID_SUBJECT` em `mailto:` ou HTTPS;
- chave da REDEMET e base HTTPS;
- `GEMINI_API_KEY` quando `GEMINI_WEATHER_ENABLED` usa `true`, `1` ou `on`;
- ausência de secrets indevidamente configurados com prefixo `VITE_`;
- `VITE_SITE_URL=https://www.tempopelotas.com.br`.

O resultado sanitizado é salvo em:

```text
artifacts/runtime-readiness/report.json
```

Não publique arquivos de ambiente, capturas do painel ou saídas que contenham valores reais de secrets.

## Limites do preflight

A aprovação do comando confirma somente presença, coerência e formato básico da configuração. Ela não confirma:

- aplicação das migrations no Supabase oficial;
- isolamento real das policies RLS entre contas;
- funcionamento do login Google e dos redirects OAuth;
- execução real dos schedulers;
- entrega Web Push em navegadores;
- emissão de certificado, propagação DNS ou redirect do domínio raiz;
- disponibilidade das fontes externas.

Esses itens continuam sujeitos aos testes reais e ao runbook de cutover em `docs/PRODUCTION_CUTOVER.md`.

## Ordem recomendada

1. validar `.env.example` no CI;
2. aplicar e revisar migrations no Supabase oficial;
3. configurar variáveis no ambiente de preview;
4. executar `npm run runtime:check` com as variáveis de preview carregadas;
5. testar RLS, OAuth, exportação, exclusão, cron e Web Push;
6. repetir o preflight no ambiente de produção;
7. executar o smoke test público e o checklist de cutover;
8. alterar DNS somente após todas as evidências estarem registradas.
