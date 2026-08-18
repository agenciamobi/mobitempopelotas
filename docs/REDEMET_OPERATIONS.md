# REDEMET / DECEA — operação atual do Tempo Pelotas

Última consolidação: 18/08/2026.

Este documento é a fonte de verdade operacional para radar, satélite e trovoadas da REDEMET no Tempo Pelotas. Ele substitui, para a implementação nativa em `src/`, referências antigas que ainda possam existir em `_legacy/`.

## Resumo do estado atual

- A integração REDEMET é server-side e depende de `REDEMET_API_KEY`.
- A credencial nunca deve usar prefixo `VITE_`, nunca deve ser enviada ao browser e nunca deve aparecer em logs, screenshots, HARs versionados ou mensagens de diagnóstico.
- O radar operacional para Pelotas é selecionado pela disponibilidade real e pela cobertura geográfica da imagem.
- Em 18/08/2026, os HARs oficiais analisados mostraram Canguçu (`cn`) cadastrado, porém sem `path` e sem timestamp de imagem recente, enquanto Santiago (`sg`) entregava imagem válida.
- O MAXCAPPI de Santiago observado cobria Pelotas; produtos de alcance menor só podem ser usados quando os bounds efetivamente incluírem Pelotas.
- Canguçu continua como alternativa automática quando voltar a entregar imagem oficial adequada.
- Satélite e STSC continuam independentes da disponibilidade do radar.

## Arquivos ativos

- `src/lib/redemet/redemet-radar.server.ts`: seleção resiliente do radar e parsing da resposta oficial.
- `src/lib/redemet/redemet-stsc.server.ts`: contrato atual do STSC/trovoadas.
- `src/lib/redemet/redemet.server.ts`: integração de satélite e compatibilidade histórica; não é a fonte de verdade do radar novo.
- `src/lib/redemet/redemet-last-good.server.ts`: último quadro válido durante indisponibilidades curtas.
- `src/routes/api/redemet/radar.ts`: endpoint público sanitizado do radar.
- `src/routes/api/redemet/satellite.ts`: endpoint público sanitizado de satélite.
- `src/routes/api/redemet/storms.ts`: endpoint público sanitizado do STSC.
- `src/routes/api/redemet/image.ts`: proxy controlado das imagens oficiais.
- `src/production/components/weather-map.tsx`: renderização MapLibre na Home.
- `src/components/redemet/RedemetOverview.tsx`: visão editorial da página de radar/satélite.
- `tests/redemet-performance.test.ts`: contratos de regressão extraídos dos formatos observados.

## Radar

### Contrato observado

A resposta de `produtos/radar/{produto}` pode trazer registros de várias estações. A seleção da estação é feita no servidor depois que a resposta chega; não se deve assumir que o parâmetro `area` é necessário para obter o conjunto correto.

Cada registro útil precisa conter, no mínimo:

- `localidade` da estação;
- `path` de uma imagem oficial permitida;
- `data` ou timestamp equivalente;
- `lon_min`, `lon_max`, `lat_min` e `lat_max` válidos.

A ausência de `path` é tratada como estação cadastrada, porém sem imagem disponível naquele quadro — não como falha de autenticação.

### Seleção para Pelotas

Ordem operacional de estações:

1. Santiago (`sg`), estado operacional observado em 18/08/2026;
2. Canguçu (`cn`), mantido como alternativa quando voltar a fornecer imagem recente.

A ordem pode começar pela área configurada em `REDEMET_RADAR_AREA`, mas o código sempre mantém os candidatos conhecidos. O template de ambiente deve usar `sg` enquanto Santiago for a estação operacional preferencial.

Ordem de produtos consultados:

1. `maxcappi`;
2. `10km`;
3. `07km`;
4. `05km`;
5. `03km`.

Um produto só pode ser exibido para Pelotas se os bounds do quadro incluírem as coordenadas de Pelotas. Isso evita mostrar um produto de Santiago com alcance insuficiente apenas porque a estação está operacional.

### Evidência de agosto de 2026

Nos HARs analisados em 18/08/2026:

- Canguçu (`cn`) aparecia na resposta da REDEMET com `path: null` e `data: null`;
- Santiago (`sg`) aparecia com imagem MAXCAPPI recente e bounds que incluíam Pelotas;
- uma segunda fonte oficial analisada em modo de pesquisa (SIGMA/CPTEC) também mostrava Canguçu com último CAPPI antigo e Santiago com CAPPI atualizado. Essa fonte não faz parte do runtime de produção; ver `docs/CPTEC_SIGMA_RESEARCH.md`.

A conclusão operacional é: não rotular uma imagem de Santiago como se fosse de Canguçu. A interface deve sempre exibir a estação real que originou o quadro.

## Satélite

Os produtos usados pelo portal permanecem:

- `realcada` — infravermelho realçado;
- `ir` — infravermelho;
- `vis` — visível.

Satélite é uma camada independente do radar. Falha ou ausência de imagem de uma estação de radar não deve derrubar o satélite.

## Trovoadas / STSC

O contrato observado no portal oficial usa o endpoint STSC no formato `produtos/stsc/0`.

A resposta relevante pode trazer `data` como lista de quadros, com campos como:

- `start`;
- `stop`;
- `horario`;
- `ultima_ocorrencia`;
- `pontos`, com coordenadas `la` e `lo`.

O Tempo Pelotas normaliza esses quadros e mantém apenas pontos em um raio regional de até 450 km de Pelotas. STSC representa ocorrências detectadas e não deve ser apresentado como alerta meteorológico oficial.

Toda chamada nova da página e do overview deve usar `redemet-stsc.server.ts`; o parser antigo não é a fonte de verdade.

## Segurança

Regras obrigatórias:

- `REDEMET_API_KEY` somente no runtime de servidor;
- nunca adicionar a chave em `VITE_*`, HTML, JSON público, query string retornada ao browser ou atributos de DOM;
- nunca registrar a URL autenticada completa em logs;
- permitir apenas hosts oficiais explicitamente allowlisted;
- imagens passam pelo proxy do Tempo Pelotas, com validação de protocolo, host, tipo e tamanho;
- `.env` e variantes privadas ficam ignorados pelo Git;
- HARs que contenham credenciais são material de diagnóstico privado e não devem ser commitados.

O fato de o portal oficial poder usar uma credencial em query string não autoriza expor a chave do Tempo Pelotas. Quando o contrato externo exigir esse formato, a query autenticada é construída exclusivamente no servidor.

## Cache e contingência

- Radar disponível: pode usar cache curto e `stale-while-revalidate` para reduzir carga.
- Radar indisponível: o TTL negativo deve permanecer curto para que uma estação que volte a operar seja detectada rapidamente.
- `withRedemetLastGood` pode manter temporariamente o último quadro válido durante falhas curtas, sem transformar dado antigo em dado atual.
- Toda interface deve mostrar horário/origem e estado explícito de indisponibilidade.

## Diagnóstico seguro

Quando uma camada falhar, registrar somente dados sanitizados, por exemplo:

- estação consultada;
- produto;
- quantidade de registros correspondentes;
- quantidade de registros com `path` utilizável;
- quantidade de quadros cujos bounds cobrem Pelotas;
- código HTTP ou motivo normalizado da falha.

Nunca registrar headers de autenticação, valor da chave, cookies ou a URL autenticada completa.

## Validação

Os seguintes contratos devem continuar protegidos por testes e smoke de produção:

- radar não confunde Santiago com Canguçu;
- Canguçu com `path: null` não é tratado como imagem válida;
- Santiago/MAXCAPPI só é usado se os bounds cobrirem Pelotas;
- a rota pública não expõe segredo;
- STSC aceita o formato observado em HAR e filtra a área regional;
- satélite continua disponível independentemente do radar;
- proxy de imagens bloqueia hosts não autorizados;
- respostas negativas de radar não ficam presas em cache longo.

Veja também:

- `docs/RUNTIME_READINESS.md`;
- `docs/CPTEC_SIGMA_RESEARCH.md`;
- `MIGRATION_MATRIX.md`.
