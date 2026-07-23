# Arquivo meteorológico diário

## Objetivo

O arquivo meteorológico preserva uma série diária normalizada de Pelotas para reduzir a dependência de uma única fonte externa e permitir a evolução do histórico público do portal.

Ele não transforma previsão em medição oficial. Cada registro mantém a fonte utilizada e a data local completa à qual os valores se referem.

## Tabela

A migration `20260723070000_create_weather_daily_snapshots.sql` cria `public.weather_daily_snapshots` com chave primária composta por:

- `location_slug`;
- `observed_date`.

Essa chave torna a captura idempotente: executar a rotina novamente para a mesma localidade e data atualiza o registro existente em vez de criar duplicatas.

A tabela aceita valores nulos para precipitação e rajada. Isso evita converter “não informado” em zero.

## Segurança

- RLS permanece habilitada;
- `anon` e `authenticated` não recebem acesso direto;
- leitura e escrita usam somente o cliente administrativo server-only;
- nenhuma chave administrativa utiliza prefixo `VITE_*`;
- a rota de captura exige `Authorization: Bearer <CRON_SECRET>`;
- respostas da rota usam `Cache-Control: no-store` e `X-Robots-Tag: noindex, nofollow`.

## Variáveis necessárias

```env
SUPABASE_MODE=external
SUPABASE_URL=
SUPABASE_SECRET_KEY=
CRON_SECRET=
```

Projetos que ainda usam o modelo legado de chaves podem definir `SUPABASE_SERVICE_ROLE_KEY` no lugar de `SUPABASE_SECRET_KEY`.

## Rotas operacionais

### Captura diária

```http
GET /api/cron/weather-snapshot
Authorization: Bearer <CRON_SECRET>
```

A rotina procura exclusivamente o dia completo anterior no fuso `America/Sao_Paulo`. Se a fonte ainda não publicou essa data, nada é gravado e a resposta indica indisponibilidade temporária.

### Preenchimento inicial

```http
POST /api/cron/weather-snapshot
Authorization: Bearer <CRON_SECRET>
```

O preenchimento grava a série histórica real disponível, atualmente limitada aos últimos 30 dias usados pela página pública.

## Comportamento do histórico público

1. O servidor consulta o arquivo próprio quando o Supabase externo está configurado.
2. Em seguida, consulta Open-Meteo Historical Forecast, Open-Meteo Archive e NASA POWER conforme a cadeia de contingência existente.
3. Para datas presentes nas duas origens, a resposta externa atual prevalece. O arquivo próprio preenche somente datas ausentes na série externa.
4. Se todas as fontes externas falharem, o portal exibe somente os dias já arquivados e identifica a série como parcial.
5. Se não houver fonte externa nem arquivo próprio, a página permanece indisponível sem criar números demonstrativos.

## Scheduler

A rota é compatível com um scheduler externo ou Supabase Cron/Edge Function. A frequência recomendada é diária, depois que o dia anterior já estiver disponível na fonte histórica.

O scheduler definitivo deve registrar:

- horário de início e término;
- status HTTP;
- data capturada;
- quantidade de registros gravados;
- falhas consecutivas;
- identificador de correlação, sem registrar chaves ou cabeçalhos de autorização.

## Aplicação da migration

Antes de aplicar SQL no projeto oficial:

1. conferir `supabase migration list` no projeto externo;
2. confirmar se uma tabela homônima já existe;
3. comparar colunas, constraints, grants e triggers;
4. testar leitura anônima negada;
5. testar upsert administrativo em ambiente de preview;
6. regenerar `database.types.ts` a partir do schema aplicado.
