# Tempo Pelotas — inventário de dados históricos

Última consolidação: 22/08/2026  
Estado: **documento de referência para coleta, backfill e futura oferta de histórico**

## 1. Objetivo

Este documento organiza **o que o Tempo Pelotas já armazena, o que já captura mas ainda não historiza por completo, o que pode ser recuperado retroativamente e o que deve ser tratado como oportunidade futura**.

A regra central é:

> **Preservar primeiro, comercializar depois.**

Sempre que uma variável temporal útil já passar pelos coletores do Tempo Pelotas, a tendência deve ser preservá-la no Historical Data Layer, desde que isso seja tecnicamente razoável e não viole restrições conhecidas da fonte.

Isso não significa que todo dado armazenado possa automaticamente ser usado em recursos pagos, exportado ou redistribuído.

A governança comercial permanece separada da ingestão. No banco, uma fonte nova deve continuar bloqueada para uso pago enquanto não houver revisão específica de retenção, redistribuição, atribuição e uso comercial.

Referências principais:

- `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md`;
- `docs/OFFICIAL_DATA_SOURCE_POLICY.md`;
- `docs/ANA_RHN_INTEGRATION.md`;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`;
- `docs/REDEMET_OPERATIONS.md`;
- `supabase/migrations/20260822025000_create_historical_data_layer.sql`;
- `supabase/migrations/20260822072000_archive_embrapa_daily_extremes.sql`;
- `src/lib/history/historical-archive.server.ts`.

## 2. Classes obrigatórias de dados

O histórico não deve misturar tipos de dado que possuem significados diferentes.

### `observation`

Medição ou observação recebida de estação, sensor ou rede de monitoramento.

Exemplos:

- temperatura medida pela Embrapa;
- nível do Laranjal;
- nível de São Lourenço do Sul;
- chuva observada em estação;
- radiação medida por estação automática;
- coordenadas de ocorrência de atividade elétrica quando o produto representar observação.

### `forecast`

Valor previsto por um modelo ou provedor para um horário/data futura.

Exemplos:

- Open-Meteo prevendo 18,5 mm para amanhã;
- MET Norway prevendo rajada de 42 km/h;
- probabilidade de precipitação prevista para determinada hora.

O histórico deve preservar **quando a previsão foi emitida** e **para quando ela era válida**.

### `reanalysis`

Reconstrução histórica/modelada, útil para séries longas e preenchimento comparativo, mas que não deve ser apresentada como observação direta de estação.

Exemplos futuros:

- ERA5;
- ERA5-Land;
- outros datasets históricos equivalentes.

### `derived`

Indicador calculado pelo próprio Tempo Pelotas a partir de dados de origem identificada.

Exemplos futuros:

- variação do nível em 6 h;
- chuva acumulada calculada para uma janela;
- direção predominante do vento;
- maior rajada do período;
- tempo aproximado entre elevação observada em diferentes estações;
- indicadores de acurácia de previsão.

## 3. Estado atual do arquivo histórico

Em 22/08/2026 o projeto já possui uma camada histórica canônica com:

- `historical_data_sources`;
- `historical_stations`;
- `historical_measurements`;
- `historical_collection_runs`;
- coletor protegido e agendado;
- deduplicação por fonte + estação + variável + classe + horário;
- separação entre `observation`, `forecast`, `reanalysis` e `derived`;
- `paid_access_allowed=false` por padrão para fontes ainda não revisadas comercialmente;
- espelhamento automático da observação Embrapa;
- extremos diários da Embrapa mantidos como um ponto canônico por dia local, atualizado ao longo do dia e retropreenchido a partir do arquivo próprio já existente;
- coleta hidrológica ambiental agendada a cada 5 minutos, com backfill diário da janela exposta pelas fontes.

O banco também mantém estruturas anteriores/especializadas que não devem ser destruídas apenas para centralização:

- `weather_station_observations`;
- `weather_station_current`;
- `weather_forecast_predictions`;
- `weather_forecast_verifications`;
- `weather_daily_snapshots`;
- `weather_provider_payload_cache`.

O Historical Data Layer deve consolidar acesso e patrimônio de dados sem exigir refatoração destrutiva dos subsistemas já corretos.

## 4. Inventário executivo

| Fonte / conjunto | Variáveis ou ativos históricos | Classe | Situação | Potencial retroativo | Prioridade |
| --- | --- | --- | --- | --- | --- |
| Embrapa Clima Temperado — atual | temperatura, sensação, umidade, ponto de orvalho, pressão, tendência de pressão, vento, direção, chuva, evapotranspiração | `observation` | **já armazenando** | arquivo próprio desde 29/07/2026; investigar acervo anterior | muito alta |
| Embrapa — extremos diários | temperatura min/max + horário, umidade min/max, ponto de orvalho min/max, vento máximo + horário | `observation` | **já armazenando em ponto diário canônico** | retropreenchido a partir do arquivo próprio; investigar boletins/acervo anterior | muito alta |
| Embrapa/UFPel — boletins agroclimáticos | conjunto amplo de variáveis meteorológicas diárias, médias mensais e dados de solo conforme boletim | `observation` | candidato de backfill | acervo histórico conhecido; validar formato e termos antes da importação | muito alta |
| INMET — estações automáticas | temperatura, extremos, umidade, ponto de orvalho, pressão, chuva, vento, direção, rajada, radiação e demais campos disponíveis | `observation` | ainda não importado para o arquivo próprio | arquivos históricos anuais conforme estação/período disponível | muito alta |
| Laranjal / LabHidroSens | nível da Lagoa | `observation` | **já armazenando** | janela disponibilizada pela fonte + coleta daqui para frente | muito alta |
| Monitoramento Lagoa dos Patos | níveis de Rio Grande, São Lourenço, Arambaré, São José do Norte e Itapuã/Viamão | `observation` | **já armazenando** | backfill limitado ao que o endpoint expõe hoje; investigar períodos maiores | muito alta |
| Cais Mauá / MetSul-TideSat | nível | `observation` | **já armazenando** | janela atual disponível; investigar acervo e termos | alta |
| Gasômetro / Nível Guaíba | nível | `observation` | **já armazenando daqui para frente** | investigar histórico oficial/subjacente e origem ANA/SGB quando aplicável | alta |
| ANA / SNIRH / RHN | nível, vazão, chuva e outros parâmetros conforme estação | `observation` | integração em validação | HidroWeb possui acervo histórico; contrato técnico e uso ainda precisam ser fechados | **muito alta** |
| Defesa Civil RS | nível, chuva, temperatura, umidade, pressão, sensação, vento, rajada, direção, radiação e outros sensores | `observation` | pesquisa/inventário | API identificada com operação `Historic`; confirmar estações, retenção e termos | **muito alta** |
| Open-Meteo — forecast | temperatura, sensação, umidade, ponto de orvalho, chuva, probabilidade, pressão, visibilidade, nuvens, CAPE, camada limite, vento, rajada, direção e campos diários | `forecast` | arquivo parcial já existe | preservar todos os ciclos daqui para frente; backfill de forecast quando contratualmente disponível | **imediata** |
| MET Norway — forecast | temperatura, umidade, ponto de orvalho, pressão, cobertura de nuvens, precipitação, vento, rajada, direção e condição | `forecast` | usado no runtime, ainda sem arquivo histórico completo | coleta própria daqui para frente | alta |
| Open-Meteo Historical / ERA5 | amplo conjunto meteorológico histórico | `reanalysis` | não importado | potencial de décadas, dependendo do dataset e plano de acesso | alta |
| NASA POWER | meteorologia, energia solar/radiação e variáveis agroclimáticas | `reanalysis` / dataset modelado | já usado como fallback em snapshot diário; sem arquivo amplo próprio | potencial de série longa | alta |
| REDEMET radar | produto, radar, timestamp, bounds, sequência e referência de quadro | monitoramento / metadado | não arquivado como série própria completa | guardar metadados é barato; retenção de imagens requer revisão | média/alta |
| REDEMET satélite | IR, realçado, visível, timestamp, bounds e referência de quadro | monitoramento / metadado | não arquivado como série própria completa | metadados podem ser preservados; imagens dependem de política/storage | média/alta |
| REDEMET STSC | timestamp + coordenadas de ocorrências de trovoada | `observation` / evento | usado no runtime, ainda não arquivado historicamente | coleta própria daqui para frente | alta |
| INMET — alertas | evento, severidade, publicação, início, fim, áreas, municípios, texto e instruções | evento oficial | usado no runtime; sem arquivo imutável completo | coleta daqui para frente + eventual recuperação oficial | alta |
| SIMAGRO RS | produtos WRF/GFS em imagem | `view_only` | **não converter em feed numérico** | não usar OCR/pixel para backfill | bloqueado para ingestão numérica |

## 5. Embrapa — maior riqueza disponível agora

### 5.1. Variáveis já historizadas

O Historical Data Layer já recebe da estação Embrapa:

- `temperature`;
- `humidity`;
- `feels_like`;
- `dew_point`;
- `pressure`;
- `pressure_trend`;
- `wind_speed`;
- `wind_direction`;
- `rain_daily`;
- `rain_monthly`;
- `rain_annual`;
- `evapotranspiration_daily`;
- `evapotranspiration_monthly`;
- `evapotranspiration_annual`.

### 5.2. Extremos diários agora historizados

O parser reconhece os extremos e seus horários, e desde a migration `20260822072000_archive_embrapa_daily_extremes.sql` esses campos deixam de escapar do arquivo canônico.

Variáveis preservadas:

```text
temperature_daily_min
temperature_daily_max
humidity_daily_min
humidity_daily_max
dew_point_daily_min
dew_point_daily_max
wind_speed_daily_max
```

Semântica adotada:

- existe **um ponto por variável e por dia local de Pelotas**, usando `America/Sao_Paulo`;
- o `observed_at` representa o início do dia local da estatística diária, não o horário em que o extremo ocorreu;
- o horário informado pela Embrapa para cada mínimo/máximo fica em `metadata.extremeTime`;
- `metadata.period = day` diferencia explicitamente a natureza diária do ponto;
- o ponto do dia corrente é atualizado conforme novas leituras da própria Embrapa mudam o extremo acumulado daquele dia;
- o backfill inicial usa a última observação disponível de cada dia no arquivo próprio `weather_station_observations`;
- dados anteriores ao início do arquivo próprio continuam dependendo de boletins/acervo externo e revisão específica.

Essa abordagem evita gerar uma “medição falsa” no horário do mínimo/máximo e também evita gravar centenas de versões intermediárias da mesma estatística diária.

### 5.3. Boletins históricos Embrapa/UFPel

Há forte potencial de backfill por boletins agroclimáticos anteriores. A importação deve ocorrer somente depois de:

1. inventariar os períodos realmente disponíveis;
2. validar se o formato é estável ao longo dos anos;
3. listar as variáveis de cada período;
4. preservar estação, unidade e método quando informados;
5. revisar regras de uso/retenção;
6. importar por lote idempotente;
7. registrar qualidade e lacunas.

O objetivo é priorizar observação real local antes de recorrer a reanálise quando a mesma variável e período estiverem disponíveis em estação.

### 5.4. Dados de solo e agroclimatologia

Os boletins podem oferecer dados além da meteorologia de superfície, incluindo temperatura de solo em diferentes coberturas/profundidades e outras variáveis agroclimatológicas.

Esses campos não precisam necessariamente aparecer no portal público, mas devem ser considerados para preservação caso o acervo e os termos sustentem a importação.

## 6. INMET — candidato principal para backfill de estação automática

O inventário deve selecionar as estações que realmente representam Pelotas e região, preservando:

- código oficial;
- nome da estação;
- latitude/longitude;
- altitude;
- data de início/fim de operação quando disponível;
- mudança de estação/referência quando houver;
- unidade de cada campo;
- flags de ausência/qualidade.

Variáveis prioritárias:

- temperatura;
- temperatura máxima;
- temperatura mínima;
- umidade;
- umidade máxima/mínima quando presente;
- ponto de orvalho;
- pressão;
- precipitação;
- velocidade do vento;
- direção do vento;
- rajada;
- radiação solar;
- outras variáveis estruturadas do arquivo anual que tenham valor analítico.

Regra: não fundir automaticamente duas estações diferentes em uma única série apenas porque ambas ficam na região de Pelotas.

## 7. Radiação solar

Radiação deve ser tratada como um domínio histórico próprio porque pode sustentar recursos futuros para agricultura, energia, climatologia e comparação sazonal.

Fontes candidatas:

### Observação

- INMET, quando a estação selecionada fornecer radiação;
- Embrapa/UFPel, quando o acervo estruturado confirmar a variável no período.

### Dataset histórico/modelado

- NASA POWER;
- Open-Meteo Historical / ERA5 ou dataset equivalente.

Nunca rotular reanálise ou satélite/modelo como “medição da estação”.

Possíveis indicadores derivados futuros:

- pico diário;
- média diária;
- acumulado/energia diária conforme unidade apropriada;
- comparação mês a mês;
- comparação observado x dataset modelado;
- anomalia em relação a normal climatológica.

## 8. Hidrologia

### 8.1. Já armazenado

O coletor atual preserva `water_level` para:

- Laranjal;
- Rio Grande / FURG CCMAR;
- São Lourenço do Sul;
- Arambaré;
- São José do Norte;
- Itapuã / Viamão;
- Cais Mauá;
- Gasômetro.

A deduplicação é feita por estação + variável + classe + timestamp.

No banco oficial, a coleta `environmental-capture` está agendada a cada 5 minutos e a ação `environmental-backfill` roda diariamente para reaproveitar a janela histórica que cada fonte ainda expõe. Execuções bem-sucedidas e contagens são registradas em `historical_collection_runs`.

### 8.2. ANA / RHN

A ANA/RHN é candidata para ampliar significativamente o histórico de:

- nível;
- vazão;
- chuva;
- demais parâmetros hidrometeorológicos efetivamente presentes por estação.

O histórico só deve ser importado depois de validar:

- código oficial da estação;
- operador;
- parâmetro;
- unidade;
- referência/cota/datum quando aplicável;
- timezone;
- estado/qualidade;
- contrato estável de acesso;
- permissão de retenção/exportação/uso comercial.

Não comparar níveis absolutos de réguas diferentes por simples subtração.

### 8.3. Defesa Civil RS

A rede possui potencial para criar uma malha regional observacional com:

- nível de rio;
- tendência do nível;
- chuva em diferentes janelas;
- temperatura;
- máximas/mínimas/médias quando disponíveis;
- umidade;
- pressão e tendência;
- sensação térmica;
- radiação solar;
- vento médio;
- vento máximo/rajada;
- direção do vento.

Antes de ingestão em produção:

1. concluir catálogo `DCRS-xxxxx`;
2. mapear município/bacia/coordenadas;
3. identificar sensores reais de cada estação;
4. separar `METEOROLOGY`, `HYDROLOGY`, `BOTH`, `OUT_OF_SCOPE`;
5. revisar termos de histórico/cache/redistribuição/uso comercial.

## 9. Previsões históricas

O histórico de previsão é um patrimônio diferente do histórico observado.

Não basta guardar “a previsão de hoje”. Devemos saber:

> **o que cada provedor previa em cada ciclo para cada horário futuro.**

### 9.1. Open-Meteo

O runtime já recebe séries horárias ricas com:

- temperatura;
- sensação térmica;
- umidade;
- ponto de orvalho;
- probabilidade de precipitação;
- precipitação;
- pressão ao nível do mar;
- visibilidade;
- cobertura de nuvens total;
- nuvens baixas;
- nuvens médias;
- nuvens altas;
- CAPE;
- altura da camada limite;
- velocidade do vento;
- rajada;
- direção do vento;
- weather code;
- indicador dia/noite.

Campos diários já incluem, entre outros:

- temperatura mínima/máxima;
- precipitação acumulada;
- probabilidade máxima;
- rajada máxima;
- nascer/pôr do sol.

Prioridade imediata: preservar o **forecast run completo**, não apenas os poucos campos hoje usados na tabela de acurácia.

Estrutura conceitual:

```text
provider
model
issued_at
valid_at
lead_hours
variable
value
unit
```

### 9.2. MET Norway

O fallback MET Norway já fornece campos úteis que também merecem arquivo separado:

- temperatura;
- umidade;
- ponto de orvalho;
- pressão;
- cobertura de nuvens total/baixa/média/alta;
- vento;
- rajada;
- direção;
- precipitação;
- probabilidade quando disponível;
- símbolo/condição do período.

Nunca consolidar Open-Meteo e MET Norway em uma série única antes de armazenar. O dado bruto normalizado por provedor deve permanecer auditável.

## 10. Reanálise e datasets históricos

Reanálise é útil principalmente para:

- períodos anteriores ao início da coleta própria;
- lacunas;
- climatologia;
- comparação com estação;
- continuidade espacial/temporal.

Candidatos:

- Open-Meteo Historical / ERA5 / ERA5-Land;
- NASA POWER;
- outros datasets futuros que passem por revisão.

Regras:

- `data_class = reanalysis`;
- preservar dataset/modelo;
- preservar resolução espacial e temporal quando conhecida;
- não substituir silenciosamente observação de estação;
- permitir comparação entre observado e reanálise;
- registrar período de cobertura e data de ingestão.

## 11. Radar, satélite e atividade elétrica

### 11.1. Radar REDEMET

Já recebemos metadados úteis de cada quadro:

- estação/área;
- produto;
- timestamp;
- bounds;
- referência/path da imagem;
- ordem da sequência.

Primeira etapa recomendada: arquivar **metadados dos quadros**, que têm custo de armazenamento baixo e permitem reconstruir disponibilidade/cadência histórica.

Não iniciar um arquivo de imagens de longo prazo sem revisar:

- autorização de retenção;
- redistribuição;
- uso no PRO;
- atribuição;
- volume/storage;
- política de expiração.

### 11.2. Satélite REDEMET

Aplicar a mesma regra para:

- infravermelho;
- infravermelho realçado;
- visível.

Guardar primeiro metadados; imagem binária somente após governança e sizing de storage.

### 11.3. STSC / trovoadas

O produto estruturado de atividade elétrica possui valor histórico próprio.

Candidatos a armazenamento:

- timestamp do quadro;
- latitude;
- longitude;
- distância derivada até Pelotas;
- faixa de distância derivada;
- identificador do quadro/produto;
- fonte.

Possíveis derivados futuros:

- quantidade de ocorrências por período;
- dia/hora de maior atividade;
- menor distância observada de Pelotas;
- distribuição por faixa regional;
- relação temporal com chuva/rajadas/alertas.

## 12. Alertas oficiais

Os alertas devem formar um arquivo de **eventos oficiais**, e não uma série meteorológica comum.

Para INMET, preservar quando disponível:

- identificador;
- evento;
- headline;
- descrição;
- instruções;
- severidade;
- publicação;
- início;
- fim;
- áreas;
- municípios;
- códigos municipais;
- URL/documento oficial;
- horário de ingestão.

Isso permitirá futuramente cruzar:

- alerta x chuva observada;
- alerta x rajada;
- alerta x nível;
- alerta x previsão disponível antes do evento.

A classificação oficial jamais deve ser inferida de observações próprias.

## 13. O que não deve ser convertido em histórico numérico

### SIMAGRO RS

Os produtos atuais são imagens WRF/GFS usadas como visualização complementar.

Regra permanente enquanto não existir endpoint numérico estruturado e aprovado:

- não usar OCR;
- não ler pixels;
- não reconstruir valores de temperatura/chuva/vento a partir do PNG;
- não tratar a imagem como série numérica do Historical Data Layer.

O arquivo pode, se houver justificativa futura, registrar apenas metadados de disponibilidade do produto gráfico.

## 14. Governança por fonte

Toda nova fonte histórica deve ter cadastro com, no mínimo:

```text
source_key
name
category
homepage_url
attribution
retention_policy_status
paid_access_allowed
collection_enabled
coverage_start
collection_start
terms_url
terms_checked_at
notes
```

Estados de retenção:

- `approved`;
- `pending_review`;
- `restricted`.

Regra de segurança comercial:

> `paid_access_allowed` permanece `false` até revisão documental específica.

Coletar internamente para evitar perda temporal e liberar comercialmente são decisões diferentes.

## 15. Política de resolução e agregação

Não servir anos de leituras minuto a minuto diretamente ao navegador.

O dado canônico pode permanecer detalhado enquanto rollups atendem as telas e APIs.

Direção recomendada:

| Janela de consulta | Resolução preferencial |
| --- | --- |
| até 7 dias | original / alta resolução quando útil |
| 15 dias | alta resolução ou horária |
| 30 dias | horária/diária conforme variável |
| 60 dias | horária ou diária |
| 90 dias | diária |
| 12 meses | diária |
| 24 meses | diária/mensal |
| múltiplos anos | diária/mensal/anual |

Rollups futuros devem preservar conforme a variável:

- mínimo;
- máximo;
- média;
- soma/acumulado;
- primeiro valor;
- último valor;
- quantidade de amostras;
- cobertura esperada x recebida;
- flag de qualidade.

## 16. Prioridades de implementação

### Prioridade 0 — não perder o que já passa pelo código

Concluído nesta prioridade:

1. extremos diários da Embrapa agora possuem ponto canônico diário e backfill do próprio arquivo;
2. níveis/hidrologia já permanecem em coleta contínua.

Próximos itens urgentes:

1. preservar forecast run rico do Open-Meteo;
2. iniciar arquivo equivalente do MET Norway;
3. avaliar arquivo estruturado do STSC;
4. iniciar arquivo de eventos INMET.

Essa etapa é urgente porque não depende de recuperar o passado: evita perder o presente.

### Prioridade 1 — backfill observacional local/regional

1. Embrapa/UFPel;
2. INMET;
3. ANA/HidroWeb;
4. Defesa Civil RS após inventário e revisão.

Observação real tem prioridade sobre reanálise para o mesmo local/período quando a série for confiável e comparável.

### Prioridade 2 — séries modeladas/reanálise

1. NASA POWER para solar/agroclima e lacunas apropriadas;
2. Open-Meteo Historical / ERA5/ERA5-Land;
3. outros datasets aprovados.

### Prioridade 3 — sensoriamento e eventos

1. metadados REDEMET radar;
2. metadados REDEMET satélite;
3. arquivo STSC;
4. alertas oficiais;
5. somente depois avaliar storage de imagens completas.

## 17. Critérios para importar um backfill

Um lote retroativo só deve entrar quando estiverem definidos:

- fonte;
- estação/dataset;
- variável;
- classe do dado;
- unidade;
- timezone;
- período;
- identidade do registro;
- tratamento de `null`/ausente;
- tratamento de duplicata;
- qualidade;
- atribuição;
- regra de retenção;
- status de uso comercial;
- estratégia de reprocessamento idempotente.

O backfill deve ser auditável e reiniciável sem duplicar dados.

## 18. Relação com Público, Gratuito e PRO

O patrimônio histórico pertence ao **Tempo Pelotas Data Layer**, não ao usuário.

A conta controla acesso.

Direção de produto aprovada:

### Público

Mantém tudo que já é público atualmente no portal.

### Cadastrado gratuito

- favoritos;
- preferências;
- histórico de até 60 dias;
- demais recursos gratuitos futuros.

### PRO

- histórico completo disponível no acervo;
- 7 dias;
- 30 dias;
- 60 dias;
- 90 dias;
- 12 meses;
- 24 meses;
- períodos maiores quando houver acervo suficiente;
- comparações;
- exportações quando a fonte permitir;
- radar completo;
- satélite completo;
- novos recursos avançados.

Uma fonte com `paid_access_allowed=false` não deve ser exposta pelo PRO/exportação apenas porque está armazenada internamente.

## 19. Resultado esperado

O objetivo de longo prazo é que o Tempo Pelotas consiga responder, com rastreabilidade, perguntas como:

- quanto choveu nos últimos 7, 30, 60, 90 dias, 12 ou 24 meses;
- qual foi a maior chuva diária do período;
- como temperatura, vento, umidade, pressão e radiação evoluíram;
- qual foi a maior rajada;
- como o nível do Laranjal evoluiu e como se compara temporalmente com São Lourenço, São José do Norte e Rio Grande;
- o que o Open-Meteo previa 24/48/72 horas antes de um evento;
- qual provedor teve melhor desempenho;
- quais alertas oficiais estavam ativos durante um evento;
- quantas ocorrências de atividade elétrica foram registradas;
- como uma observação real se compara à reanálise histórica.

O Historical Data Layer deve evoluir de maneira que essas perguntas possam ser respondidas sem depender de reconsultar a fonte original e sem perder a proveniência do dado.

## 20. Próximas ações

1. desenhar o schema de forecast runs completos sem destruir `weather_forecast_predictions`;
2. começar a preservar Open-Meteo e MET Norway por ciclo;
3. criar inventário técnico de estações INMET relevantes;
4. mapear o acervo Embrapa/UFPel para backfill;
5. concluir o contrato histórico ANA/RHN;
6. concluir o catálogo da Defesa Civil RS;
7. definir política de eventos para INMET/STSC;
8. avaliar metadados de radar/satélite;
9. somente depois iniciar backfills massivos de reanálise e storage pesado.

Este documento deve ser atualizado sempre que:

- uma nova fonte começar a ser coletada;
- uma nova variável temporal passar a ser preservada;
- um backfill for concluído;
- mudar o período de cobertura;
- uma fonte for aprovada/restrita para uso comercial;
- uma nova classe de dado for introduzida;
- uma fonte deixar de ser operacional.
