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
- `https://tempopelotas.com.br` como host canônico;
- URL base HTTPS da REDEMET;
- Santiago (`sg`) como área de radar preferencial no template e `maxcappi` como produto inicial;
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
- `REDEMET_RADAR_AREA=sg` recomendado enquanto Santiago for a estação operacional preferencial; se houver override diferente, ele deve ser intencional e revisado contra `docs/REDEMET_OPERATIONS.md`;
- `GEMINI_API_KEY` quando `GEMINI_WEATHER_ENABLED` usa `true`, `1` ou `on`;
- ausência de secrets indevidamente configurados com prefixo `VITE_`;
- `VITE_SITE_URL=https://tempopelotas.com.br`.

O resultado sanitizado é salvo em:

```text
artifacts/runtime-readiness/report.json
```

Não publique arquivos de ambiente, capturas do painel ou saídas que contenham valores reais de secrets.

## REDEMET: o que o preflight não decide

A presença de `REDEMET_API_KEY` não significa que toda estação ou produto esteja operacional naquele instante.

Em agosto de 2026 foi observado que:

- Canguçu (`cn`) continuava cadastrado, mas podia aparecer sem `path`/timestamp de imagem;
- Santiago (`sg`) estava entregando MAXCAPPI com cobertura sobre Pelotas;
- o backend passou a escolher a estação depois de receber a resposta e só aceita quadros cujos bounds cubram Pelotas;
- Canguçu permanece como alternativa quando voltar a fornecer imagem válida;
- satélite e STSC são validados separadamente.

Por isso o smoke de runtime, e não apenas o preflight de variáveis, é a evidência de disponibilidade real. A fonte de verdade da integração está em `docs/REDEMET_OPERATIONS.md`.

## CPTEC/SIGMA

CPTEC/SIGMA não é dependência do ambiente de produção atual. A pesquisa técnica está preservada em `docs/CPTEC_SIGMA_RESEARCH.md`, mas qualquer integração pública foi adiada para novembro/dezembro de 2026 e depende de nova revisão de autorização, termos e disponibilidade.

Não adicionar variáveis, endpoints, WMS ou assets CPTEC ao preflight enquanto essa decisão não for formalmente revisada.

## Limites do preflight

A aprovação do comando confirma somente presença, coerência e formato básico da configuração. Ela não confirma:

- aplicação das migrations no Supabase oficial;
- isolamento real das policies RLS entre contas;
- funcionamento do login Google e dos redirects OAuth;
- execução real dos schedulers;
- entrega Web Push em navegadores;
- emissão de certificado, propagação DNS ou redirect do domínio raiz;
- disponibilidade das fontes externas;
- disponibilidade de uma estação de radar específica;
- atualidade de um quadro de radar, satélite ou STSC.

Esses itens continuam sujeitos aos testes reais e ao runbook de cutover em `docs/PRODUCTION_CUTOVER.md`.

## Ordem recomendada

1. validar `.env.example` no CI;
2. aplicar e revisar migrations no Supabase oficial;
3. configurar variáveis no ambiente de preview;
4. executar `npm run runtime:check` com as variáveis de preview carregadas;
5. testar RLS, OAuth, exportação, exclusão, cron e Web Push;
6. repetir o preflight no ambiente de produção;
7. executar o smoke test público, incluindo radar, satélite e STSC, e o checklist de cutover;
8. alterar DNS somente após todas as evidências estarem registradas.
