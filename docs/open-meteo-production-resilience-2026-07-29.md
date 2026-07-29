# Resiliência da previsão Open-Meteo — produção

Data: **29 de julho de 2026**  
Portal: `https://tempopelotas.com.br`  
Projeto Supabase: `ovcpgjyomwjteapbvfwk`

## Problema confirmado

A consulta completa ao Open-Meteo executada diretamente pelo hosting Lovable passou a receber limitação HTTP 429 pelo IP compartilhado do provedor.

Consequências observadas no endpoint público antes da correção:

- portal em estado `degraded`;
- `forecastSource` alterado para `met-norway`;
- Open-Meteo marcado como indisponível;
- chance de chuva horária e diária ausente;
- rajadas horárias e diárias ausentes.

O MET Norway funcionou corretamente como contingência, mas não publica todos os campos detalhados usados pelo portal.

## Arquitetura aplicada

### Edge Function

Foi criada a função privada `open-meteo-forecast` no Supabase.

Responsabilidades:

- consultar o payload completo de sete dias do Open-Meteo;
- exigir token privado em comparação de tempo constante;
- validar presença das séries `current`, `hourly` e `daily`;
- executar até duas tentativas com timeout;
- não expor CORS público;
- retornar o payload somente ao backend autorizado do portal.

### Cache central

A migration `20260729071500_create_open_meteo_payload_cache.sql` criou:

- tabela server-only `weather_provider_payload_cache`;
- RLS e acesso exclusivo de `service_role`;
- cache válido por quatro minutos;
- lease de atualização para impedir consultas concorrentes;
- preservação do último payload válido em falhas transitórias;
- estados `live`, `stale` e `unavailable`.

O índice secundário inicialmente criado foi removido pela migration `20260729073000_remove_redundant_weather_cache_index.sql`, porque a tabela é consultada pela chave primária `provider_key`.

### Portal

O módulo `open-meteo-resilient.server.ts` passou a:

1. consultar a Edge Function autenticada;
2. reutilizar o parser e os normalizadores existentes do portal;
3. preservar o timestamp real do cache;
4. sinalizar o uso do último payload válido quando o cache estiver atrasado;
5. usar a consulta direta apenas como contingência para desenvolvimento ou falha do Supabase.

A agregação principal e a server function pública deixaram de importar diretamente o coletor sujeito ao IP do Lovable.

## Validação em produção

Após a publicação:

- endpoint `pelotas.json` retornou `status: live`;
- `forecastSource: open-meteo`;
- `forecastProvider: Open-Meteo`;
- fonte Open-Meteo com status `live` e sem motivo de degradação;
- chance de chuva horária preenchida;
- rajada horária preenchida;
- chance de chuva diária preenchida;
- rajada diária preenchida.

O cache central registrou:

- status `live`;
- 168 pontos horários;
- 7 pontos diários;
- nenhum erro;
- nenhum lease abandonado.

Uma segunda chamada autenticada retornou `cacheStatus: fresh`, demonstrando reutilização do cache sem nova consulta externa. A mesma Edge Function, sem token, retornou HTTP 401.

## Segurança e desempenho

O advisor de segurança não apontou vulnerabilidade nova. Permanecem apenas avisos informativos antigos para tabelas deliberadamente server-only sem policy de cliente.

O advisor de desempenho deixou de apontar o índice redundante do cache após sua remoção. Índices recém-criados ou ainda sem carga suficiente podem continuar aparecendo como `unused_index` até acumularem uso real.

## Validação não realizada

O deploy de produção compilou e o runtime foi testado por chamadas reais. O GitHub não apresentou status de CI associado ao commit consultado; portanto, este documento não afirma que a suíte completa de testes, lint e typecheck tenha sido executada em CI.
