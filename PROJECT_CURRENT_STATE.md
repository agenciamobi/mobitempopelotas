# Tempo Pelotas — estado atual do projeto

Última atualização: 22/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Propósito deste documento

Este arquivo é a fonte de verdade de alto nível para responder **o que existe hoje no Tempo Pelotas, o que está ativo, o que está parcial/suspenso e onde cada domínio técnico é mantido**.

Ele não substitui a documentação especializada. Em vez disso, funciona como índice operacional do projeto e aponta para os documentos detalhados.

Regras:

- `PROJECT_CURRENT_STATE.md` descreve o estado atual do produto.
- `MIGRATION_MATRIX.md` registra a migração, paridade e pendências herdadas do legado.
- `docs/*.md` detalha integrações, operação, segurança, SEO, runtime e subsistemas específicos.
- `_legacy/` é referência histórica e **não** define o estado atual.
- Código ativo em `src/`, workflows e migrations prevalecem sobre documentos antigos; divergências devem ser corrigidas no mesmo conjunto de mudanças.
- Nunca versionar HARs brutos, cookies, tokens, chaves, secrets ou URLs autenticadas obtidas em diagnóstico.

## 2. Visão executiva

O Tempo Pelotas é um portal meteorológico regional focado em Pelotas e Zona Sul do Rio Grande do Sul. O produto combina previsão, observação local, radar/satélite, alertas oficiais, hidrologia, histórico, câmeras e páginas regionais, com forte camada editorial, SEO técnico, APIs server-side e monitoramento operacional.

### Estado por domínio

| Domínio | Estado atual | Observação |
| --- | --- | --- |
| Portal público | Ativo | Produção em `tempopelotas.com.br` |
| Interface pública | Ativo | Home, páginas internas/dedicadas e páginas institucionais compartilham o mesmo header/footer editorial, rail de conteúdo e contrato de superfícies da Home; a rota histórica de 2024 foi corrigida para não duplicar o chrome global |
| Home meteorológica | Ativo | Header e hero editoriais; próximas horas e tendência semanal em capítulos separados; tendência posicionada imediatamente antes da central de radar/satélite; alertas e blocos locais autocontidos |
| Previsão hoje/amanhã/7 dias | Ativo | Páginas dedicadas e conteúdo indexável |
| Chuva, vento e meteograma | Ativo | Visões temáticas e hora a hora; `/chuva-em-pelotas` expõe volume previsto por hora e `/vento-em-pelotas` expõe direção prevista por hora reutilizando o meteograma estruturado Open-Meteo; `/meteograma-pelotas` também oferece comparação visual complementar com produtos WRF/GFS do SIMAGRO RS |
| SIMAGRO RS | Ativo complementar / visual only | Meteogramas WRF, GFS e GFS Agro para Pelotas exibidos como PNG oficial da fonte; não há OCR, leitura de pixels ou incorporação desses gráficos ao feed numérico do portal |
| Alertas oficiais | Ativo | INMET e conteúdo preventivo claramente separado; a rota `/alertas` preserva publicação, validade e abrangência territorial completa do CAP/RSS em detalhe progressivo quando disponível |
| Estação Embrapa | Ativo | Observação local, timestamp, estado de atualidade e histórico canônico, incluindo extremos diários |
| Radar REDEMET | Ativo com dependência externa | Santiago (`sg`) é a estação operacional preferencial; Canguçu (`cn`) é fallback quando voltar a fornecer imagem; a página pública deriva janela temporal e cadência observada apenas de quadros com horário utilizável |
| Satélite REDEMET | Ativo | Realçada, infravermelho e visível; VIS filtra quadros sem iluminação solar útil |
| Trovoadas STSC | Ativo | Contrato atual da API REDEMET, filtro regional e contexto derivado de distância aproximada das ocorrências até Pelotas; nunca tratado como alerta oficial |
| Mapa regional MapLibre | Ativo | Camadas de radar, satélite e trovoadas |
| Hidrologia | Ativo | Laranjal, Lagoa dos Patos, Guaíba e rede regional; arquivo próprio ambiental em coleta contínua |
| Rede Hidrometeorológica Defesa Civil RS | Implementação técnica / desativada | Adapter GraphQL server-side, mapa e seção em `/situacao-hidrologica-pelotas` estão preparados; `DEFESA_CIVIL_HYDRO_ENABLED=false` evita consulta e exposição até validar inventário de estações, timezone e referência dos níveis |
| Histórico climático | Ativo | Janela pública de 30 dias com fonte/fallback documentados |
| Historical Data Layer | Ativo / em expansão | Arquivo canônico privado com observações Embrapa, extremos diários, níveis hidrológicos, forecast runs ricos Open-Meteo/MET Norway, eventos estruturados e série horária INMET A887; classes `observation`, `forecast`, `reanalysis` e `derived` permanecem separadas |
| Registro histórico da enchente de 2024 | Ativo | Rota pública `/enchente-2024-pelotas-laranjal` registra a linha do tempo da cheia, a propagação Guaíba → Lagoa dos Patos → Pelotas/Laranjal → estuário e a fase de reconstrução |
| Câmeras | Ativo com dependência externa | YouTube, live/replay e contingências |
| Páginas regionais | Ativo | 23 cidades além de Pelotas |
| Blog | Ativo | Rota pública e indexável |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org e imagem social raster |
| Supabase externo | Ativo | Banco, migrations, RLS, conta/entitlement e coletores históricos implantados; E2E autenticado com duas contas ainda precisa de validação real |
| Login Google / conta | Parcial operacional | Conta, LGPD, Free/PRO estrutural e login por Google Identity Services + ID Token implementados; `VITE_GOOGLE_CLIENT_ID` está configurado no build de produção e falta concluir E2E real |
| Weather AI | Ativo controlado | Snapshot persistido, orçamento mensal e fallback determinístico |
| PWA / Web Push | Suspenso para ativação pública | Código preservado; reativação depende de validação real de navegador e rolagem |
| CPTEC/SIGMA | Pesquisa futura | Não integrar ao runtime público antes da revisão institucional planejada para novembro/dezembro de 2026 |

## 3. Stack atual

Aplicação principal:

- React 19;
- TypeScript 5.8;
- TanStack Start e TanStack Router;
- Vite 8;
- Nitro;
- Tailwind CSS 4;
- Supabase JS/SSR;
- MapLibre GL para mapas;
- Recharts para gráficos;
- Radix UI e componentes próprios;
- Node.js 24 nos workflows de CI;
- Lovable como ambiente conectado de publicação/sincronização.

Scripts principais em `package.json`:

- `npm run dev`;
- `npm run build`;
- `npm test`;
- `npm run test:contracts`;
- `npm run test:routes`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run runtime:check`;
- `npm run runtime:check:example`;
- `npm run cutover:smoke`.

## 4. Rotas públicas indexáveis

`src/lib/public-routes.ts` é a fonte programática das URLs destinadas a sitemap/indexação.

O inventário atual possui **45 rotas públicas indexáveis**: 22 rotas fixas, contando Home e institucionais/editoriais, mais 23 páginas regionais de cidades.

### Pelotas e conteúdo principal

- `/`
- `/tempo-hoje-pelotas`
- `/tempo-amanha-pelotas`
- `/previsao-7-dias-pelotas`
- `/chuva-em-pelotas`
- `/vento-em-pelotas`
- `/meteograma-pelotas`
- `/alertas`
- `/radar-e-satelite-pelotas`
- `/mapa-de-geadas-rio-grande-do-sul`
- `/situacao-hidrologica-pelotas`
- `/nivel-da-lagoa-dos-patos-laranjal`
- `/estacao-embrapa-pelotas`
- `/clima-em-pelotas`
- `/historico-climatico-pelotas`
- `/enchente-2024-pelotas-laranjal`
- `/cameras-ao-vivo-pelotas`
- `/tempo-na-regiao-sul-rs`
- `/blog`
- `/status-dos-dados`
- `/metodologia`
- `/privacidade-e-dados`

### Páginas regionais

Pelotas usa a Home como página principal regional. As demais cidades usam `/tempo-em/{slug}`:

**Pelotas e entorno**

- Capão do Leão;
- Canguçu;
- Morro Redondo;
- Turuçu;
- Arroio do Padre;
- Pedro Osório;
- Cerrito;
- Piratini.

**Costa Doce**

- Rio Grande;
- São José do Norte;
- São Lourenço do Sul;
- Cristal.

**Fronteira Sul**

- Jaguarão;
- Arroio Grande;
- Herval;
- Santa Vitória do Palmar;
- Chuí.

**Campanha**

- Pinheiro Machado;
- Pedras Altas;
- Bagé;
- Candiota;
- Aceguá;
- Dom Pedrito.

Cada cidade possui slug, coordenadas, código IBGE, agrupamento regional e descriptor editorial em `src/lib/regional-cities.ts`.

## 5. Rotas operacionais e não indexáveis

Além das páginas de conteúdo, existem rotas funcionais que não pertencem ao sitemap editorial:

- `/entrar`;
- `/conta`;
- `/painel`;
- `/auth/callback`;
- `/auth/signout`;
- `/embed/nivel-laranjal`;
- `/embed/status-tempo-agora`.

`/auth/callback` permanece como rota de compatibilidade/infraestrutura, mas o botão Google atual não depende de redirecionar o navegador pelo callback técnico do Supabase.

Também existem endpoints/máquinas públicas como `robots.txt`, `sitemap.xml`, feed JSON e `pelotas.json`, protegidos por contratos próprios de conteúdo, cache e indexação.

## 6. Previsão meteorológica e inteligência de dados

O núcleo meteorológico combina múltiplas fontes e regras de reconciliação, evitando tratar uma única fonte externa como verdade absoluta em todos os contextos.

### Previsão

- Open-Meteo: previsão principal/fallback em vários fluxos e páginas;
- a série principal do Open-Meteo preserva, quando fornecidos, volume de precipitação por hora, direção do vento em graus e perfil atmosférico com umidade, ponto de orvalho, pressão, visibilidade, nuvens por camada, CAPE e altura da camada limite;
- o coletor de precisão também preserva, desde 22/08/2026, um forecast run horário rico do Open-Meteo por ciclo de 6 horas, separado da tabela diária de acurácia;
- MET Norway: fonte complementar no domínio de previsão e contingência, preservando campos horários compatíveis; o arquivo rico próprio também preserva snapshots separados por provedor/ciclo e somente `next_1_hours.precipitation_amount` é tratado como volume horário, evitando rotular acumulados de 6h/12h como chuva de uma hora;
- a recuperação Open-Meteo no navegador preserva até 24 horas dos campos horários ricos quando o SSR precisou usar contingência;
- lógica centralizada para condição atual, hora a hora e dias seguintes;
- páginas dedicadas para hoje, amanhã, sete dias, chuva, vento e meteograma;
- `/chuva-em-pelotas` e `/vento-em-pelotas` reutilizam o meteograma estruturado de 48 horas para suas camadas públicas de volume por hora e direção prevista, mantendo previsão separada de observação;
- `/meteograma-pelotas` mantém a série horária estruturada e acrescenta produtos WRF/GFS do SIMAGRO RS apenas como comparação visual identificada;
- normalização de timezone para `America/Sao_Paulo` quando aplicável;
- contratos para integridade de temperatura, precipitação, vento, rastreabilidade e disponibilidade.

### Observação local

Embrapa é a principal referência de observação meteorológica local do portal quando disponível.

O projeto possui:

- parser server-side;
- endpoint meteorológico próprio;
- rota pública da estação;
- histórico/snapshots;
- estado explícito de leitura atualizada, atrasada ou indisponível;
- coleta centralizada por cron;
- comparação da previsão com observação real para arquivo de precisão;
- espelhamento automático no Historical Data Layer;
- extremos diários canônicos de temperatura, umidade, ponto de orvalho e vento, com horário do extremo preservado como metadado.

### CPPMet / UFPel

O texto meteorológico do CPPMet/UFPel é integrado como contexto editorial/local, com atribuição e fallback seguro.

### SIMAGRO RS

Documentação: `docs/SIMAGRO_RS_HAR_REVIEW.md` e `docs/HAR_PUBLIC_ENRICHMENT_2026-08-21.md`.

O HAR analisado do SIMAGRO RS não revelou endpoint estruturado de séries numéricas para Pelotas, mas confirmou três produtos gráficos públicos:

- meteograma WRF;
- meteograma GFS;
- agrometeograma GFS.

Desde 21/08/2026 esses produtos são exibidos em `/meteograma-pelotas` como **visualização complementar de modelagem**.

Regras permanentes desta camada:

- somente o produto selecionado é renderizado no viewer;
- os PNGs permanecem identificados como produtos do SIMAGRO RS;
- o Tempo Pelotas não usa OCR, leitura de pixels ou inferência visual para transformar o gráfico em temperatura, chuva, vento, pressão, umidade ou qualquer outro valor numérico;
- os dados horários estruturados da página continuam independentes;
- indisponibilidade do PNG não torna o meteograma principal indisponível;
- um futuro endpoint estruturado do SIMAGRO deverá entrar como integração separada, com proveniência, timeout, fallback e testes próprios.

### INMET

O projeto usa INMET para:

- alertas oficiais aplicáveis a Pelotas;
- produtos/fontes meteorológicas oficiais complementares;
- mapa/registros de geadas;
- satélite oficial complementar onde o fluxo específico utiliza essa fonte;
- arquivo histórico horário da estação A887 — Capão do Leão (Pelotas), importado dos arquivos anuais oficiais e mantido separado das leituras correntes de outras fontes.

O arquivo horário A887 possui cobertura confirmada desde **18/07/2019 17:00 UTC**; o arquivo anual de 2018 não contém a estação. O backfill versionado cobre 2019–2026 conforme os arquivos oficiais disponíveis, preservando ausências como ausência e não como zero.

O parser CAP/RSS preserva, quando fornecidos pela fonte, evento, headline, descrição, instruções, severidade, horário de publicação, início, término, áreas, municípios e códigos municipais. A rota `/alertas` mantém a leitura prioritária enxuta e oferece uma camada progressiva em que o visitante pode expandir cada publicação para conferir horários e a abrangência territorial completa recebida do INMET.

Avisos oficiais são mantidos semanticamente separados de previsão e monitoramento informal.

## 7. REDEMET / DECEA

Documentação de referência: `docs/REDEMET_OPERATIONS.md`.

A integração é server-side e usa `REDEMET_API_KEY` exclusivamente no runtime do servidor.

### Radar

Estado operacional consolidado em 18/08/2026:

- estação preferencial: Santiago (`sg`);
- estação alternativa: Canguçu (`cn`) quando voltar a fornecer imagem válida;
- produto prioritário: `maxcappi`;
- produtos alternativos podem ser consultados quando necessário;
- a chamada de produto recebe múltiplas estações e a seleção é feita depois da resposta;
- um quadro só é aceito para o portal se os bounds cobrem Pelotas;
- Canguçu com `path: null` não pode ser confundido com uma imagem válida de outra estação;
- respostas indisponíveis usam cache curto para nova tentativa rápida;
- último quadro válido pode ser usado por janela controlada para oscilações temporárias;
- a rota pública calcula quantidade de quadros com horário utilizável, janela temporal coberta e cadência mediana observada a partir dos timestamps da própria sequência.

A cadência mostrada é uma leitura derivada da sequência disponível naquela consulta; não é tratada como SLA ou frequência garantida pela REDEMET. Timestamps futuros/incompatíveis são excluídos desses cálculos pelo mesmo contrato temporal usado no restante da página.

HARs da REDEMET e evidência independente do SIGMA mostraram Canguçu sem imagem recente enquanto Santiago estava operacional no período analisado.

### Satélite

Produtos suportados:

- realçada;
- infravermelho;
- visível.

A camada mantém timeline, timestamp, bounds e atribuição de origem. A página pública também calcula janela e cadência observada dos quadros com horário utilizável, sem reinterpretar esses valores como compromisso de frequência da fonte. O produto visível usa apenas quadros com iluminação solar útil e mostra estado noturno explícito quando não há VIS adequado.

### STSC / trovoadas

O contrato atual usa o endpoint `produtos/stsc/0` observado no portal oficial, interpretando `data[]` com timestamps e `pontos` de latitude/longitude.

O Tempo Pelotas filtra ocorrências em uma área regional de até 450 km de Pelotas. STSC é apresentado como monitoramento de atividade elétrica, nunca como alerta meteorológico oficial.

A página pública usa as coordenadas já recebidas para calcular distância aproximada em linha reta até um ponto de referência de Pelotas e distribuir as ocorrências do quadro válido mais recente em três faixas: até 50 km, 50–150 km e 150–450 km. Essa distância serve apenas para localização contextual; não mede intensidade, não projeta trajetória e não substitui orientação ou aviso oficial.

Eventos STSC e avisos INMET também possuem arquivo estruturado próprio para preservar ocorrências ao longo do tempo sem misturá-las com séries numéricas de observação.

### Proxy e segurança

- hosts da API são allowlisted;
- hosts de imagens são allowlisted;
- somente HTTPS é aceito;
- a chave nunca é retornada ao navegador;
- imagens externas passam por proxy controlado;
- logs e erros não devem imprimir URL autenticada, header ou secret.

## 8. Hidrologia

O domínio hidrológico é um dos subsistemas centrais do portal.

### Laranjal / Lagoa dos Patos

O projeto mantém:

- medição do nível no Laranjal;
- timestamp da leitura;
- tendência recente;
- semântica centralizada de estados de nível;
- página dedicada;
- widget público;
- embed reutilizável;
- estados de disponibilidade/atraso.

### Rede regional

A situação hidrológica também agrega estações e referências da Lagoa dos Patos e região, incluindo conteúdo para:

- FURG/CCMAR;
- São Lourenço do Sul;
- Arambaré;
- São José do Norte;
- Itapuã;
- Guaíba em Porto Alegre;
- demais fontes regionais normalizadas pelos módulos de hidrologia.

A Home agrupa Laranjal com Rio Grande e São José do Norte no trecho sul/estuário e mantém as referências do Guaíba/centro-norte em coluna própria, sem afirmar fluxo hidrodinâmico determinístico entre réguas distintas.

A página `/situacao-hidrologica-pelotas` deve funcionar mesmo quando uma ou mais fontes externas estiverem indisponíveis.

O Historical Data Layer captura níveis ambientais a cada 5 minutos e executa backfill diário da janela ainda exposta pelas fontes, com deduplicação por estação/variável/timestamp e registro de execução.

### Rede Hidrometeorológica da Defesa Civil RS — implementação técnica preparada

Documentação especializada: `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`.

A API GraphQL e os contratos de consulta/histórico/nowcasting estão identificados, e o adapter server-side, função de cache, mapa MapLibre e seção da rota `/situacao-hidrologica-pelotas` já foram integrados ao código atual.

A ativação permanece deliberadamente desligada por `DEFESA_CIVIL_HYDRO_ENABLED=false`. Nesse estado, o adapter retorna `disabled` **sem consultar a API externa** e o componente não é renderizado. Portanto, a rede ainda não é uma fonte ativa exibida no runtime público.

Conforme `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`, dados oficiais adequados à disseminação pública são destinados à camada pública do portal; a flag da Defesa Civil é um gate técnico de validação, não um paywall Free/PRO.

A regra de seleção permanece:

- para meteorologia, interessa a rede regional ao sul de Porto Alegre e no entorno da Lagoa dos Patos quando houver sensores válidos e leitura recente;
- para hidrologia, entram somente estações ligadas fisicamente ao Guaíba/Lagoa dos Patos, afluentes relevantes da Bacia do Camaquã, sistema Mirim–São Gonçalo, orla da Lagoa e estuário de Rio Grande;
- proximidade geográfica isolada não transforma uma estação em contexto hidrológico;
- as cores dos produtos de chuva da rede não devem ser interpretadas como limiares de alerta;
- níveis absolutos de réguas distintas não devem ser comparados por simples subtração.

Antes de ligar `DEFESA_CIVIL_HYDRO_ENABLED=true`, ainda é necessário validar uma resposta real no runtime, inventariar códigos `DCRS-xxxxx`, bacias e capacidades, confirmar timezone quando o timestamp vier sem offset e confirmar unidade/referência vertical de `rio_nivel` por estação. A documentação pública da API deve continuar sendo consultada para condições específicas de uso, retenção ou redistribuição quando aplicáveis.

### Registro histórico da enchente de 2024

A rota pública e indexável `/enchente-2024-pelotas-laranjal` funciona como registro histórico permanente da enchente de 2024 em Pelotas e no Laranjal. A página é organizada como linha do tempo e adiciona uma segunda camada visual indicando em que trecho do sistema hidrológico estava o problema: Centro/Norte do RS → rios da Bacia do Guaíba → Guaíba → Lagoa dos Patos → Pelotas/Laranjal e Canal São Gonçalo → estuário de Rio Grande → retorno/reconstrução.

Os valores históricos preservam a referência das fontes e réguas utilizadas à época. Valores absolutos de estações diferentes não devem ser comparados diretamente quando datum, referência altimétrica ou método de medição forem distintos.

## 9. Radar, satélite, trovoadas e MapLibre

`src/production/components/weather-map.tsx` e componentes relacionados implementam o mapa regional.

Características atuais:

- MapLibre carregado client-side;
- marcador de Pelotas;
- marcador da estação operacional de radar;
- camada raster de radar;
- camada raster de satélite;
- pontos de trovoada;
- timeline/reprodução de quadros;
- opacidade e legenda;
- comparação contextual com previsão por hora;
- janela temporal e cadência observada derivadas apenas de timestamps utilizáveis da sequência;
- distância aproximada da atividade STSC até Pelotas, com faixas regionais derivadas das coordenadas da própria REDEMET;
- proteção contra SSR/hidratação;
- layout responsivo e controles de mapa.

Na Home, o monitoramento é apresentado como uma **central Civic Tech / Scientific autocontida**. A tendência semanal encerra a leitura de previsão imediatamente antes do radar. A central usa barra plana de camadas para Radar, Satélite e Trovoadas, mapa como protagonista, timeline técnica clara separada visualmente da imagem, fonte/estado de disponibilidade visíveis e um guia editorial de interpretação. A rota `/radar-e-satelite-pelotas` continua sendo o aprofundamento público do tema e concentra as leituras derivadas adicionais sem transformar monitoramento em alerta ou previsão.

## 10. Câmeras

A rota `/cameras-ao-vivo-pelotas` possui integração de vídeo com YouTube e regras para distinguir live, replay e contingência.

O código ativo de câmera está em `src/lib/cameras/*.server.ts` e componentes associados.

A disponibilidade de uma transmissão é externa ao portal; a interface deve sinalizar claramente quando uma live não está disponível em vez de apresentar vídeo gravado como transmissão atual.

## 11. Histórico, Historical Data Layer, snapshots e precisão

O projeto mantém quatro conceitos separados e complementares.

### Histórico climático público

- página pública de 30 dias;
- séries de temperatura máxima/mínima, chuva e vento/rajadas;
- combinação de fonte histórica externa com arquivo próprio quando aplicável;
- estados vazios e fallback editorial;
- metadados de período e origem.

### Historical Data Layer canônico

Documentação: `docs/HISTORICAL_DATA_INVENTORY.md`.

O arquivo próprio usa:

- `historical_data_sources` para governança de fonte;
- `historical_stations` para identidade de estação/grid;
- `historical_measurements` para séries canônicas;
- `historical_collection_runs` para auditoria dos coletores;
- classes explícitas `observation`, `forecast`, `reanalysis` e `derived`;
- RLS e acesso administrativo, sem exposição direta ampla ao browser;
- `paid_access_allowed=false` enquanto uma fonte não tiver revisão documental específica para uso pago/exportável.

Já estão ativos:

- observações Embrapa espelhadas automaticamente;
- extremos diários Embrapa como um ponto canônico por dia local, preservando o horário informado do extremo como metadado;
- níveis do Laranjal, rede da Lagoa dos Patos, Cais Mauá e Gasômetro em coleta ambiental;
- coleta ambiental a cada 5 minutos e backfill diário da janela oferecida pelas fontes;
- `weather_forecast_runs` e `weather_forecast_hourly_points` para forecast runs ricos separados do Open-Meteo e do MET Norway;
- `historical_events` para eventos estruturados como STSC e avisos INMET, sem misturar eventos com séries numéricas;
- arquivo horário compacto da estação INMET A887, com cobertura confirmada desde 18/07/2019 e backfill até o arquivo anual de 2026 disponível no momento da importação.

O primeiro run rico Open-Meteo foi validado em produção em 22/08/2026 com 168 pontos horários e a repetição da captura no mesmo ciclo manteve um único run completo. O primeiro snapshot rico MET Norway também foi validado separadamente, preservando apenas precipitação realmente horária quando `next_1_hours` existe. `captured_at` representa a captura do Tempo Pelotas, não um horário de emissão oficial do modelo quando a fonte não o informa.

### Snapshots meteorológicos

- captura periódica de estado meteorológico;
- persistência no Supabase;
- upsert/idempotência;
- rota protegida de cron;
- uso operacional/editorial próprio, separado do arquivo de forecast run.

### Precisão de previsão

- `weather_forecast_predictions` preserva o arquivo diário usado na avaliação;
- `weather_forecast_verifications` compara posteriormente previsão com observação Embrapa;
- o arquivo rico de run não substitui nem destrói essas tabelas;
- contratos automatizados evitam degradação silenciosa;
- painel/uso editorial de métricas conforme implementado no produto.

## 12. Weather AI / Gemini

Documentação: `docs/weather-ai-snapshots.md`.

A IA meteorológica não é chamada a cada acesso de usuário. O modelo atual utiliza geração persistida e controlada.

Características:

- `GEMINI_API_KEY` somente server-side;
- modelo configurável por `GEMINI_MODEL`;
- flag `GEMINI_WEATHER_ENABLED`;
- teto mensal de chamadas reais;
- fingerprint material antes de chamar IA;
- reaproveitamento de texto compatível quando possível;
- fallback determinístico quando IA, banco ou configuração não estiverem disponíveis;
- snapshot persistido;
- execução via workflow GitHub Actions com OIDC.

Agenda atual do workflow `Weather AI snapshots`:

- 23:00;
- 05:00;
- 11:00;
- 17:00.

Horários em `America/Sao_Paulo` conforme comentário operacional do workflow.

## 13. Supabase, banco e persistência

O projeto utiliza Supabase externo, separado entre uso público/browser e uso administrativo server-side.

Princípios:

- clientes browser e server separados;
- chave administrativa nunca enviada ao cliente;
- RLS como camada de isolamento;
- migrations versionadas em `supabase/migrations/`;
- migrations estruturais são aplicadas e validadas diretamente no Supabase externo, independentemente do deploy do Lovable;
- schema/objetos privados quando necessário;
- snapshots e dados operacionais persistidos no servidor;
- privilégios mínimos para fluxos públicos;
- validação de advisors e políticas conforme documentação de segurança.

Estruturas recentes implantadas incluem `account_access`, reparação segura da fundação da conta, Historical Data Layer, extremos diários Embrapa, forecast runs ricos Open-Meteo/MET Norway, arquivo de eventos e histórico horário INMET A887.

Estado atual: banco, migrations e endurecimento de RLS estão implantados. O ciclo completo com **duas contas descartáveis** ainda deve ser validado em navegador real para confirmar login, isolamento, consentimento, exportação e exclusão ponta a ponta.

## 14. Autenticação, conta, entitlement e LGPD

Documentação: `docs/auth-account.md` e `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md`.

O login Google atual usa:

`Google Identity Services -> Google ID Token -> Supabase signInWithIdToken() -> sessão Supabase`.

Isso evita que o fluxo principal do botão Google navegue pelo host técnico `*.supabase.co/auth/v1/callback`. O arquivo `src/lib/auth/google-identity.ts` carrega GIS e cria nonce via Web Crypto; `GoogleLoginCard` troca o ID Token pela sessão Supabase. A variável pública necessária `VITE_GOOGLE_CLIENT_ID` está configurada em `.env.production`. O Client Secret do Google não pertence ao browser nem ao repositório.

Rotas principais:

- `/entrar` — compatibilidade/redirecionamento para a conta;
- `/conta` — identidade, preferências, privacidade e plano;
- `/painel` — shell autenticado comum a Free e PRO;
- `/auth/callback` — compatibilidade/fluxos legados que ainda necessitem troca server-side;
- `/auth/signout`.

APIs de direitos do titular:

- `/api/account/export`;
- `/api/account/delete`.

Recursos existentes:

- sessão por cookies SSR;
- login Google por ID Token com nonce;
- `next` limitado a caminhos internos normalizados;
- logout local por POST da mesma origem;
- conta autenticada;
- consentimentos versionados;
- exportação dos dados;
- exclusão de conta/dados com fluxo protegido;
- página `/privacidade-e-dados`;
- `account_access` com `free|pro`, status, origem e validade;
- entitlements centralizados em `src/lib/auth/account-access.ts`;
- Free com shell/painel, favoritos/preferências e limite arquitetural de 60 dias para históricos definidos como Free;
- PRO estrutural com histórico completo, comparações, exportação e recursos avançados quando a fonte/política permitir;
- RPC `ensure_current_user_account_foundation()` para reparar perfil/preferências/acesso ausentes sem conceder PRO por fallback.

Pendência principal: concluir o E2E real com duas contas descartáveis e registrar evidência operacional de login, isolamento, consentimentos, exportação, logout e exclusão.

## 15. APIs internas e endpoints funcionais

### Conta

- `/api/account/export`;
- `/api/account/delete`.

### Crons

- `/api/cron/embrapa`;
- `/api/cron/forecast-accuracy`;
- `/api/cron/push-daily`;
- `/api/cron/weather-snapshot`;
- `/api/cron/data-status`.

### REDEMET

- `/api/redemet/radar`;
- `/api/redemet/satellite`;
- `/api/redemet/storms`;
- `/api/redemet/image`.

### Meteorologia

- `/api/weather/embrapa`;
- `/api/weather/hourly-precipitation`.

### INMET

- `/api/inmet/geadas`.

### Web Push

- `/api/push/config`;
- `/api/push/subscription`;
- `/api/push/broadcast`.

Os endpoints de push existem no código, mas a ativação pública do PWA/Web Push permanece suspensa.

### Widgets

- `/api/widgets/nivel-laranjal`.

### Embeds

- `/embed/nivel-laranjal`;
- `/embed/status-tempo-agora`.

## 16. SEO, GEO e dados estruturados

O portal possui camada técnica de SEO centralizada.

Estado atual:

- host canônico `https://tempopelotas.com.br`;
- canonicals por rota;
- redirecionamento/consolidação de variantes de host;
- sitemap construído a partir de `PUBLIC_ROUTES`;
- `robots.txt`;
- Open Graph;
- Twitter Cards;
- imagem social raster 1200×630;
- Schema.org centralizado;
- `WebSite`, `WebPage`, `BreadcrumbList` e schemas editoriais por página;
- dados estruturados específicos somente onde o conteúdo os sustenta;
- JSON Feed;
- `pelotas.json` como contrato público de dados/transparência;
- páginas regionais com metadados geográficos próprios;
- conteúdo editorial, FAQs e links internos por intenção;
- alias técnicos e feeds fora da indexação quando apropriado.

Baseline de Search Console: `docs/SEO_GSC_BASELINE_2026-08-16.md`.

## 17. PWA e Web Push

Documentação: `docs/web-push.md`.

O código de PWA/Web Push foi desenvolvido e preservado, incluindo:

- service worker;
- manifesto;
- subscription/unsubscribe;
- VAPID;
- envio paginado;
- leases/limpeza de endpoints;
- APIs de configuração e broadcast.

**Estado atual: ativação pública suspensa.**

Motivo operacional: reativação deve ocorrer somente em implantação controlada e teste real em Chrome normal, anônimo, mobile e perfis com extensões, sem regressão de rolagem ou mutações globais de `body`.

## 18. Segurança e secrets

Fonte de configuração: `.env.example`.

Regras permanentes:

- nenhum secret real é versionado;
- arquivos `.env` privados são ignorados pelo Git;
- variáveis server-only não usam prefixo `VITE_`;
- `VITE_GOOGLE_CLIENT_ID` é identificador público do cliente Web Google e não deve ser confundido com Client Secret;
- Google Client Secret não é necessário no navegador e não deve ser enviado ao chat/repo para este fluxo;
- REDEMET, Gemini, Supabase administrativo, cron e VAPID privado ficam somente no servidor;
- `.env.example` contém nomes e defaults seguros, nunca valores de produção;
- logs e relatórios devem ser sanitizados;
- HARs são tratados como confidenciais e não entram no repo;
- proxy de imagem externa usa allowlist e validação;
- endpoints sensíveis validam autenticação/segredo/identidade conforme seu domínio.

Grupos de configuração existentes no template:

- Supabase público e server-side;
- Google Identity Services (`VITE_GOOGLE_CLIENT_ID`);
- cron;
- VAPID/Web Push;
- Gemini/Weather AI;
- REDEMET;
- Defesa Civil RS (`DEFESA_CIVIL_HYDRO_ENABLED`, exclusivamente server-side);
- URL canônica do site.

## 19. GitHub Actions e observabilidade

Existem **seis workflows ativos** em `.github/workflows/`.

### `quality.yml` — Qualidade

Dispara em push na `main`, branches `agent/**`, pull request para `main` e manualmente.

Valida:

- template de ambiente;
- contratos rápidos;
- contrato Weather AI;
- árvore de rotas;
- build de produção;
- rotas públicas;
- TypeScript;
- ESLint incremental.

### `cutover-smoke.yml` — Smoke test de cutover

Valida o domínio público em mudanças relevantes e manualmente.

Executa:

- `scripts/cutover-smoke.mjs`;
- `scripts/seo-production-smoke.mjs`;
- relatório de artefato com retenção de 30 dias.

### `data-status-monitor.yml` — Status das fontes

Executa a cada 10 minutos e manualmente. Usa GitHub OIDC com audience própria para chamar `/api/cron/data-status`, persistindo o estado das fontes sem secret estático no workflow. Em pushes relevantes, aguarda a publicação da rota antes de falhar por 404/503 transitório.

### `runtime-smoke.yml` — Runtime de produção

Executa às 06:00 e 18:00 em horário de Brasília e também em pushes que alteram REDEMET/hidrologia relevantes.

Valida:

- publicação da página de radar;
- REDEMET configurada;
- radar/satélite/STSC;
- proxy de imagem;
- ausência de marcadores sensíveis;
- home hidrológica;
- página de situação hidrológica;
- Guaíba e estações regionais.

### `visual-parity.yml` — Auditoria visual de paridade

Protege regressões visuais e de acessibilidade em áreas editoriais relevantes, incluindo navegação, footer e comportamento mobile.

### `weather-ai-snapshots.yml` — Weather AI snapshots

Executa quatro vezes ao dia e manualmente, com GitHub OIDC e endpoint protegido de geração persistida.

## 20. Testes e contratos

A suíte de contratos cobre, entre outros domínios:

- níveis de água;
- Historical Data Layer, coletores ambientais e extremos Embrapa;
- forecast runs ricos Open-Meteo/MET Norway, separação run/pontos horários e RLS;
- arquivo de eventos estruturados e histórico horário INMET A887;
- Web Push;
- segurança de banco;
- conta/autenticação/entitlements;
- centralização Embrapa;
- precisão de previsão;
- resiliência Open-Meteo;
- profundidade horária Open-Meteo/MET Norway, recuperação rica no navegador e camadas públicas de volume de chuva por hora/direção prevista do vento;
- runtime/Lovable;
- rolagem/PWA;
- integridade meteorológica;
- fontes INMET;
- reconciliação de temperatura;
- REDEMET e contratos HAR;
- adapter e feature flag da Defesa Civil RS, preservação de dados ausentes, separação de observação x alerta/risco e renderização segura do mapa;
- enriquecimento público derivado dos HARs, incluindo SIMAGRO visual-only, profundidade temporal/atividade elétrica REDEMET e abrangência territorial detalhada do INMET;
- coerência editorial da Home;
- coesão visual entre Home e páginas internas/dedicadas;
- páginas Hoje/Amanhã/7 dias/Chuva/Vento;
- radar/satélite;
- inteligência atmosférica;
- meteograma;
- clima;
- histórico;
- registro histórico da enchente de 2024;
- estação Embrapa;
- câmeras;
- geadas;
- hidrologia;
- páginas regionais;
- SEO e acessibilidade;
- integrações Guaíba/SACE;
- bootstrap/árvore de rotas.

A regra atual de lint é incremental para impedir nova dívida sem misturar uma limpeza histórica global com mudanças funcionais.

## 21. Deploy, Lovable e disciplina de Git

O projeto é conectado ao Lovable. Commits enviados à branch conectada sincronizam para o editor.

A interface pública usa a Home como fonte de verdade visual: `HomeEditorialHeader`, footer editorial com faixa de utilidade pública, rail de 1440 px no desktop e superfícies brancas de borda discreta/radius suave são compartilhados pelas páginas públicas, preservando componentes e conteúdo específicos de cada rota.

Regras:

- GitHub `main` é a fonte de código/versionamento;
- Lovable é usado para publicação do app e não deve provisionar banco paralelo;
- migrations e Edge Functions do Supabase externo são implantadas diretamente no Supabase quando o código correspondente muda;
- não reescrever histórico publicado com force-push/rebase destrutivo;
- manter commits pequenos e coerentes;
- preservar a `main` em estado buildável;
- verificar `Qualidade` após mudanças funcionais;
- usar smoke/runtime para validar integrações externas e domínio público;
- evitar mensagens desnecessárias ao agente do Lovable quando GitHub/Supabase resolvem o trabalho sem consumo de créditos.

Runbooks:

- `CUTOVER_LOVABLE.md`;
- `docs/PRODUCTION_CUTOVER.md`;
- `docs/RUNTIME_READINESS.md`.

## 22. Pesquisa CPTEC / INPE / SIGMA

Documentação: `docs/CPTEC_SIGMA_RESEARCH.md`.

**Não é dependência de produção.**

A pesquisa de agosto de 2026 identificou tecnicamente:

- radar Canguçu CAPPI 3 km, código SIGMA 4962;
- radar Santiago CAPPI 3 km, código 4965;
- PPI de vento Santiago, código 8323;
- GLM, código 2305;
- Hidroestimador, incluindo 6353/6354;
- FORTRACC +30/+60/+90/+120 min, códigos 6891–6894;
- produtos GOES-19;
- WMS/MapServer do SIGMA em EPSG:3857.

Os HARs indicaram Canguçu desatualizado e Santiago operacional no período analisado, corroborando a decisão do radar REDEMET.

A integração pública com CPTEC/SIGMA foi deliberadamente adiada para revisão em novembro/dezembro de 2026. Até lá:

- não consumir os produtos no runtime público;
- não criar dependência de WMS SIGMA;
- não versionar os HARs;
- manter a pesquisa apenas como backlog técnico.

## 23. Documentos especializados

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Matriz histórica de migração, paridade e critérios de aceite |
| `MIGRATION.md` | Estratégia e histórico da migração |
| `docs/REDEMET_OPERATIONS.md` | Fonte operacional da integração REDEMET |
| `docs/HAR_PUBLIC_ENRICHMENT_2026-08-21.md` | Revisão sanitizada dos HARs recentes, oportunidades de conteúdo público, decisões de uso e fontes deliberadamente não ativadas |
| `docs/SIMAGRO_RS_HAR_REVIEW.md` | Contrato da camada visual complementar WRF/GFS do SIMAGRO RS, sem uso numérico dos PNGs |
| `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` | Implementação técnica preparada da Rede Hidrometeorológica da Defesa Civil RS; ativação pública depende das validações técnicas documentadas |
| `docs/CPTEC_SIGMA_RESEARCH.md` | Pesquisa futura CPTEC/SIGMA, sem integração produtiva |
| `docs/RUNTIME_READINESS.md` | Preflight e requisitos do runtime |
| `docs/PRODUCTION_CUTOVER.md` | Runbook de corte/produção |
| `CUTOVER_LOVABLE.md` | Operação de publicação pelo Lovable |
| `docs/SEO_GSC_BASELINE_2026-08-16.md` | Baseline Search Console e SEO |
| `docs/weather-ai-snapshots.md` | Arquitetura Weather AI persistida |
| `docs/weather-snapshots.md` | Snapshots meteorológicos |
| `docs/web-push.md` | Arquitetura Web Push/PWA |
| `docs/auth-account.md` | Conta, autenticação, entitlement e direitos do titular |
| `docs/auth-production-validation-2026-07-29.md` | Evidências e validações de auth |
| `docs/open-meteo-production-resilience-2026-07-29.md` | Resiliência Open-Meteo |
| `WEATHER_PAGE_IDENTITY.md` | Identidade e consistência das páginas meteorológicas |
| `docs/EXACT_PRODUCTION_CSS_STACK.md` | Stack CSS de produção |
| `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` | Arquitetura da conta, autenticação, Free/PRO e entitlements |
| `docs/HISTORICAL_DATA_INVENTORY.md` | Inventário de históricos, fontes, variáveis, coletores e oportunidades de backfill |
| `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md` | Plano aprovado de aplicação Público / Free / PRO / REVIEW e governança de acesso |

## 24. Pendências reais atuais

Estas são pendências de produto/operação, não funcionalidades inexistentes disfarçadas de prontas:

1. executar E2E de autenticação com duas contas descartáveis, incluindo isolamento RLS, consentimentos, exportação, logout e exclusão;
2. desenhar rollups horários/diários/mensais e APIs históricas server-side antes de servir janelas longas do arquivo aos usuários;
3. continuar backfills observacionais seguros e oportunidades de longo prazo, incluindo Embrapa/UFPel e ANA/RHN, somente com semântica, unidade, timezone, proveniência e governança validadas;
4. auditar cobertura/lacunas e saúde dos coletores históricos já ativos, incluindo INMET A887, eventos, Open-Meteo, MET Norway, Embrapa e hidrologia;
5. reativar PWA/Web Push somente após validação controlada de navegador e rolagem;
6. executar auditoria final WCAG 2.2 AA, Core Web Vitals e responsividade ampla;
7. formalizar rollback de aplicação, banco, DNS e caches;
8. continuar monitorando a disponibilidade das fontes externas, principalmente radar REDEMET, produtos gráficos do SIMAGRO RS e hidrologia regional;
9. retomar avaliação CPTEC/SIGMA em novembro/dezembro de 2026, sem assumir previamente autorização ou integração;
10. validar resposta real da Rede Hidrometeorológica da Defesa Civil RS, inventário DCRS, bacias/capacidades, timezone e unidade/referência dos níveis e somente então habilitar `DEFESA_CIVIL_HYDRO_ENABLED=true`;
11. manter a limpeza de dívida histórica de lint/formatação separada de mudanças funcionais.

## 25. Regra de manutenção deste arquivo

Atualizar `PROJECT_CURRENT_STATE.md` no mesmo conjunto de mudanças sempre que ocorrer qualquer uma das situações abaixo:

- criação, remoção ou renomeação de página pública;
- nova cidade/região;
- ativação, suspensão ou retirada de funcionalidade;
- nova fonte meteorológica/hidrológica;
- alteração de fonte primária ou fallback;
- nova integração externa;
- mudança de API pública/interna relevante;
- novo cron/workflow;
- mudança de arquitetura de banco/auth;
- alteração importante de SEO/indexação;
- nova variável de ambiente estrutural;
- mudança de estado de PWA/Web Push;
- mudança de estratégia de deploy/runtime;
- conclusão ou criação de uma pendência estrutural importante.

O objetivo é que uma pessoa possa abrir este arquivo meses depois e responder rapidamente: **o que o Tempo Pelotas faz hoje, de onde vêm os dados, como opera e o que ainda não está concluído?**

## 26. Direção de produto aprovada — Tempo Pelotas público, Free e PRO

A evolução estrutural do projeto transforma a área autenticada em uma camada de produto Free/PRO, mantendo o portal público útil, aberto e editorialmente simples.

A regra central é:

> **O Tempo Pelotas público informa. A conta Free organiza e acompanha. O Tempo Pelotas PRO analisa, compara e aprofunda.**

O PRO não deve cobrar pelo simples acesso a uma imagem de satélite, radar, aviso oficial ou dado que já faz sentido permanecer público. O valor comercial deve vir da profundidade, organização, histórico, cruzamento entre fontes, personalização, alertas avançados, dados derivados e interpretação assistida por IA.

### 26.1. Papel do portal público

O portal público deve responder rapidamente às perguntas mais comuns:

- como está o tempo agora;
- vai chover e em qual janela;
- qual é a previsão resumida para as próximas horas e dias;
- existe alerta oficial;
- como está o nível da Lagoa e a situação das águas;
- onde consultar radar, satélite e câmeras;
- quais são as principais medições locais.

O front público deve continuar funcional sem autenticação, sem assinatura e sem chamada de IA no caminho crítico. A direção visual deve privilegiar informação simples, leitura editorial, identidade local e boa hierarquia, evitando transformar a Home em um dashboard técnico.

### 26.2. Papel da conta Free

A conta Free é o primeiro degrau autenticado e já possui contrato de entitlements. Ela deve receber progressivamente:

- shell `/painel`;
- preferências;
- favoritos/locais acompanhados quando implementados;
- histórico de até 60 dias nos datasets definidos como Free;
- utilidades pessoais que não exijam assinatura.

Esse limite de 60 dias não transforma dado oficial já público em paywall.

### 26.3. Papel do PRO

O PRO será a camada de inteligência meteorológica e hidrológica para usuários que precisam acompanhar Pelotas e a região em maior profundidade.

O produto pago deve concentrar, progressivamente:

- previsão horária expandida;
- comparação entre fontes e modelos;
- séries temporais e históricos ampliados;
- acumulados de chuva;
- evolução de temperatura, pressão, umidade, vento e rajadas;
- comparação entre estações;
- evolução hidrológica regional;
- mais camadas em mapas, radar e satélite quando as fontes e permissões permitirem;
- linhas do tempo e contexto temporal mais detalhado;
- filtros por período e variável;
- favoritos e locais de interesse;
- dashboards configuráveis;
- alertas personalizados;
- exportação de dados e relatórios quando a origem permitir;
- indicadores e dados derivados do próprio Tempo Pelotas;
- análises automáticas com IA;
- comparação interpretativa de cenários;
- resumo do que mudou desde a última atualização;
- consulta orientada aos dados em linguagem natural em etapa posterior.

A primeira versão comercial deve preferir **um único plano PRO**. Não criar múltiplos tiers antes de existir evidência real de uso que justifique segmentação.

## 27. Limite permanente para IA no produto

A IA é uma camada opcional de interpretação e nunca uma dependência para acesso aos dados meteorológicos e hidrológicos.

### 27.1. Front público

Regra permanente:

- não criar novos recursos públicos que chamem IA por acesso de página;
- não expor chave, SDK ou chamada de modelo no navegador;
- preferir regras determinísticas, templates, cálculos, reconciliação de fontes e snapshots persistidos;
- manter fallback determinístico sempre disponível;
- manter alertas oficiais independentes de IA;
- não permitir que IA altere, substitua ou produza um aviso oficial.

A exceção existente é o Weather AI atual, que já opera como snapshot editorial server-side, fora do carregamento da página, com quatro oportunidades diárias, fingerprint, reaproveitamento e teto mensal. Esse mecanismo pode permanecer enquanto for útil, mas não deve servir como justificativa para espalhar IA pelo front público.

### 27.2. PRO

No PRO, IA passa a ser parte legítima da proposta de valor, desde que continue controlada por orçamento e rastreabilidade.

Toda utilidade de IA do PRO deve obrigatoriamente possuir:

- identificador de recurso;
- finalidade clara;
- limite diário próprio;
- eventual limite mensal financeiro;
- modelo configurável;
- cache e TTL;
- fingerprint dos dados utilizados quando aplicável;
- fallback não-IA ou estado explícito de indisponibilidade;
- log de execução;
- custo estimado;
- motivo da execução;
- política de exceção;
- kill switch.

A regra deve ser **limite por utilidade**, e não um único contador genérico para toda a plataforma.

Exemplos de utilidades futuras:

- `pro_weather_summary` — resumo refinado do cenário atual;
- `pro_model_comparison` — comparação entre modelos/fontes;
- `pro_change_detection` — o que mudou desde a análise anterior;
- `pro_risk_interpretation` — interpretação de risco nas próximas horas sem substituir alertas oficiais;
- `pro_hydrology_summary` — síntese da evolução das águas;
- `pro_ask_data` — consulta explícita do assinante aos dados.

Análises compartilhadas devem ser pré-geradas e reutilizadas por todos os assinantes enquanto os dados de origem forem compatíveis. Não gerar a mesma interpretação para cada pageview.

Consultas realmente personalizadas, como `pro_ask_data`, devem consumir cota diária por usuário e existir somente após ação explícita do assinante.

Exceções acima da cota normal só podem ocorrer por regra registrada, por exemplo evento severo, necessidade operacional ou acionamento administrativo. Toda exceção deve ficar auditável.

## 28. Leitura do estado atual para chegada do PRO

A base técnica atual reduz bastante o trabalho necessário para o produto pago. A fundação de identidade/entitlement já existe; cobrança ainda não.

### 28.1. O que já pode ser reaproveitado

- Google Identity Services integrado ao Supabase Auth por ID Token;
- sessão SSR por cookies;
- rota amigável `/conta`;
- shell autenticado `/painel`;
- `account_access` com `free|pro` e resolução centralizada de entitlements;
- RLS e padrões de isolamento já existentes;
- perfil do usuário;
- preferências e consentimentos versionados;
- exportação e exclusão de conta;
- Historical Data Layer canônico;
- observação Embrapa centralizada e extremos diários;
- arquivo de precisão de previsão;
- forecast runs ricos Open-Meteo/MET Norway;
- coleta histórica hidrológica;
- arquivo estruturado de eventos;
- histórico horário INMET A887 desde 2019;
- mapa MapLibre e camadas meteorológicas existentes;
- radar, satélite e STSC;
- hidrologia regional;
- Recharts;
- rotinas server-side e crons;
- Weather AI persistido e seu padrão de orçamento;
- contratos automatizados e workflows de qualidade;
- Lovable para sincronização/publicação do código conectado à `main`.

### 28.2. O que ainda não existe

Ainda não existe uma camada comercial completa de assinatura:

- produto/preço comercial PRO definido no provedor;
- provedor de cobrança escolhido e integrado;
- checkout;
- customer portal de cobrança;
- webhooks de pagamento;
- tabelas de customer/subscription/eventos financeiros;
- estado de pagamento normalizado;
- ativação automática do `account_access.tier='pro'` por billing;
- analytics de conversão/receita;
- política comercial final de preço/cancelamento;
- autorização comercial concluída para cada fonte candidata a diferencial pago.

O entitlement estrutural **já existe** em `account_access` e `src/lib/auth/account-access.ts`; ele não deve ser recriado em arquitetura paralela. Billing futuro deverá apenas alimentar/conceder a camada de acesso de forma server-side e auditável.

O `package.json` atual também não contém SDK específico de cobrança. A escolha do provedor deve ser feita antes da fase de checkout, sem acoplar o modelo de dados central a um fornecedor específico.

## 29. Arquitetura de infraestrutura para o PRO

### 29.1. GitHub

O repositório operacional permanece `agenciamobi/mobitempopelotas`, branch `main`.

A implementação é feita diretamente na `main`, sem PR, conforme decisão operacional atual. Isso aumenta a importância de:

- commits pequenos;
- feature flags;
- migrations compatíveis com versões anteriores;
- CI antes de ativar recurso;
- não misturar alteração estrutural de banco, cobrança e grande refino visual no mesmo commit;
- nunca depender de force-push para correção.

### 29.2. Lovable

Lovable é o ambiente conectado de deploy, preview e sincronização do projeto.

**Lovable não gerencia o Supabase deste projeto.**

O código pode ser publicado pelo fluxo conectado ao Lovable, mas o banco de dados não deve ser considerado aplicado, migrado ou validado apenas porque uma alteração chegou ao deploy da aplicação.

### 29.3. Supabase

O Tempo Pelotas usa **Supabase externo**.

O repositório mantém as migrations como fonte versionada da evolução do schema, mas aplicar uma migration ao ambiente oficial é uma etapa independente do deploy do Lovable.

Regra:

1. criar migration retrocompatível no GitHub;
2. revisar RLS, grants, funções e impactos de LGPD;
3. aplicar no Supabase externo oficial;
4. regenerar tipos quando necessário;
5. validar o schema aplicado e executar uma captura/teste controlado quando aplicável;
6. somente depois habilitar no runtime a feature que depende daquela migration.

O Supabase externo está acessível pelas ferramentas operacionais desta sessão e as migrations históricas recentes foram aplicadas e validadas diretamente nele. Não declarar implantação de banco apenas por commit; exigir sempre evidência do ambiente oficial.

## 30. Modelo de dados alvo do PRO

A camada de entitlement base já existe em `account_access`. A chegada de cobrança deve acrescentar domínio financeiro sem duplicar identidade/acesso.

### 30.1. Cobrança e entitlement

Estrutura futura recomendada para billing:

- `products` — produto lógico, inicialmente `tempo_pelotas_pro`;
- `plans` — preço/ciclo e configuração comercial;
- `billing_customers` — vínculo entre usuário e identificador do provedor;
- `subscriptions` — estado normalizado da assinatura;
- `subscription_events` — eventos recebidos do provedor, com idempotência.

`account_access` continua sendo a fonte simples dos direitos efetivos da conta no estágio atual. Billing futuro deve sincronizar essa camada no servidor; o browser nunca promove a própria conta.

Estados mínimos a normalizar no billing, independentemente do provedor escolhido:

- `incomplete`;
- `active`;
- `past_due`;
- `canceled`;
- `expired`.

Se existir trial, grace period ou cancelamento ao fim do ciclo, a regra deve ser explícita e testada.

### 30.2. Preferências PRO

Estrutura recomendada:

- `saved_locations` — locais/estações favoritos quando a funcionalidade existir;
- `dashboard_preferences` — organização e filtros do painel;
- `alert_rules` — regras personalizadas de chuva, vento, nível ou outros indicadores;
- `report_preferences` — configuração de relatórios quando implementados.

### 30.3. IA PRO

Estrutura recomendada:

- `ai_feature_policies` — limites, modelo, TTL, flag e política por utilidade;
- `ai_daily_usage` — contador diário por utilidade e escopo;
- `ai_usage_events` — log individual de tentativa/execução;
- `ai_artifacts` — análises persistidas e reutilizáveis;
- `ai_user_queries` — apenas se `Pergunte aos dados` for lançado, com retenção mínima e política própria.

O mecanismo existente de `weather_ai_snapshots`, `weather_ai_monthly_usage` e `weather_ai_calls` deve ser preservado durante a transição. A unificação só deve ocorrer quando o novo gerenciador de orçamento estiver coberto por testes e sem risco de aumentar chamadas públicas.

## 31. Entitlement e segurança de acesso

O acesso avançado precisa ser protegido no servidor. Esconder componente React não é controle de acesso.

O contrato atual já centraliza Free/PRO em `resolveAccountAccess()` e seus `AccountEntitlements`. A evolução server-side deve consumir esse contrato em guards/helpers de recurso, sem espalhar `if (plan === 'pro')` pelos componentes.

Regras:

- usuário não autenticado não acessa dados privados;
- usuário autenticado Free pode acessar `/conta`, `/painel` e recursos liberados pelo seu entitlement;
- usuário PRO ativo acessa somente recursos cuja fonte/política também permita exposição;
- ausência, suspensão ou expiração nunca concede PRO por fallback;
- estado do front nunca é fonte de verdade;
- resposta autenticada usa `private, no-store` e `Vary` apropriado;
- nenhuma rota premium entra no sitemap;
- endpoints premium precisam de rate limit quando houver custo ou risco de abuso;
- RLS continua sendo defesa adicional, não substituto do guard da aplicação.

## 32. Cobrança — arquitetura antes de escolher provedor

O provedor de cobrança ainda deve ser definido. O núcleo do produto deve ser provider-agnostic.

Criar uma camada de adaptação com operações conceituais:

- criar checkout;
- consultar customer;
- abrir portal de cobrança;
- validar assinatura do webhook;
- normalizar evento;
- sincronizar assinatura;
- cancelar/agendar cancelamento.

Requisitos obrigatórios:

- webhook com validação criptográfica;
- idempotência por ID de evento;
- processamento seguro contra replay;
- log sanitizado;
- atualização de entitlement somente no servidor;
- reconciliação periódica opcional para detectar divergência entre banco local e provedor;
- nenhum secret de cobrança no cliente.

O fluxo de ativação alvo é:

`checkout confirmado -> webhook válido -> subscription normalizada -> account_access/entitlement PRO ativo -> acesso aos módulos PRO`.

Não liberar PRO apenas pelo retorno do navegador após o checkout.

## 33. Arquitetura de rotas recomendada

Separar claramente marketing, conta e produto autenticado.

### Pública e indexável

- `/pro` — apresentação do produto, quando houver oferta comercial definida;

### Autenticada, noindex

- `/conta` — identidade, plano, privacidade e sessão;
- `/painel` — shell comum a Free e PRO;
- `/painel/tempo` — previsão detalhada e séries;
- `/painel/mapas` — camadas avançadas quando disponíveis;
- `/painel/modelos` — comparação de fontes/modelos;
- `/painel/aguas` — hidrologia detalhada;
- `/painel/historico` — séries e comparação temporal;
- `/painel/analises` — análises automáticas/IA;
- `/painel/alertas` — regras personalizadas quando o canal estiver validado.

Não é obrigatório lançar todas as subrotas na primeira versão. O shell deve permitir crescimento sem transformar `/conta` no dashboard técnico.

## 34. Escopo recomendado para o primeiro produto autenticado

Antes do billing, o primeiro valor real deve aparecer para usuário Free; o PRO é a extensão de profundidade.

### Base autenticada recomendada

1. shell `/painel` com estado de conta e fontes;
2. preferências/favoritos quando prontos;
3. histórico Free de até 60 dias nos datasets aprovados;
4. data freshness e proveniência visíveis;
5. gráficos determinísticos e estados de indisponibilidade.

### MVP comercial PRO recomendado

1. histórico além da janela Free quando a fonte permitir;
2. comparação temporal e entre estações/variáveis;
3. previsão/forecast archive aprofundado;
4. hidrologia detalhada com evolução e comparação;
5. mapa/camadas adicionais com uso/licença confirmados;
6. comparação de fontes/modelos estruturados;
7. exportação quando permitida;
8. bloco `O que mudou`;
9. resumo inteligente PRO compartilhado e persistido;
10. tela de assinatura/estado de pagamento na conta.

### Pode entrar após o primeiro lançamento

- `Pergunte aos dados`;
- relatórios PDF recorrentes;
- exportações amplas;
- alertas push avançados;
- e-mail transacional/alertas por e-mail;
- mais locais favoritos;
- novos níveis de assinatura;
- API comercial para terceiros.

## 35. Diferença de produto entre público, Free e PRO

| Domínio | Público | Free autenticado | PRO |
| --- | --- | --- | --- |
| Agora | leitura simples | preferências/painel pessoal | leitura refinada + séries/contexto |
| Próximas horas | resumo | recursos pessoais definidos como Free | horizonte maior, filtros e gráficos |
| Próximos dias | tendência simples | acompanhamento pessoal | comparação, evolução e divergências |
| Radar/satélite | visualização base | base pública + preferências futuras | mais contexto, arquivo/timeline conforme permissões |
| Alertas oficiais | sempre públicos | sempre públicos | públicos + contexto/personalização, sem substituir fonte oficial |
| Lagoa/águas | nível e tendência principal | histórico Free quando aprovado | histórico longo, comparação, filtros e análise |
| Histórico | visão pública existente | até 60 dias nos datasets Free | histórico completo permitido e comparação |
| Modelos/fontes | fonte editorial consolidada + SIMAGRO visual-only quando aplicável | acompanhamento básico | comparação explícita e divergências entre fontes estruturadas aprovadas |
| IA | somente mecanismo público já existente e controlado | sem depender de IA | análises refinadas, quotas por utilidade e recursos personalizados |
| Exportação | direitos LGPD da conta | direitos LGPD | dados/relatórios do produto quando permitido |
| Personalização | nenhuma obrigatória | preferências/favoritos | dashboard, alertas e configurações avançadas |

## 36. Governança das fontes antes da monetização

O PRO não pode ser construído partindo do pressuposto de que toda informação publicamente acessível pode ser redistribuída comercialmente sem restrição.

Antes de uma fonte ganhar uso novo dentro do produto pago, registrar:

- instituição/fonte;
- produto ou endpoint;
- formato;
- acesso autenticado ou público;
- permissão de uso público;
- permissão de uso comercial;
- regras de redistribuição;
- regras de cache/armazenamento;
- possibilidade de gerar dados derivados;
- atribuição obrigatória;
- limites de uso/rate limit;
- contato ou documento de referência;
- data da última revisão;
- decisão: `PUBLIC`, `PRO_ALLOWED`, `DERIVED_ONLY`, `VIEW_ONLY`, `BLOCKED`, `REVIEW`.

Princípios:

- não cobrar pela simples ocultação de um produto oficial que já é adequado ao portal aberto;
- cobrar pela experiência, processamento, organização, histórico, comparação e interpretação desenvolvidos pelo Tempo Pelotas;
- não extrair números por OCR de imagens para transformá-los em feed operacional sem endpoint estruturado e validação;
- preservar atribuição visível;
- `historical_data_sources.paid_access_allowed` permanece `false` até revisão específica;
- `open-meteo-forecast` está em `pending_review` e não está liberado automaticamente para PRO/exportação apesar de o arquivo interno já estar ativo;
- a camada pública atual do SIMAGRO RS é `VIEW_ONLY`;
- manter CPTEC/SIGMA fora do runtime até a revisão institucional já planejada;
- revisar qualquer nova camada REDEMET, INMET, ANA, SIMAGRO ou outra fonte antes de torná-la diferencial comercial.

## 37. Design e UX do produto autenticado

A área pública e o painel devem compartilhar identidade, mas não densidade.

### Público

Direção:

- editorial;
- data journalism;
- identidade local;
- informação simples;
- poucas bordas e pouco ruído;
- fotografia regional quando fizer sentido;
- sem aparência de SaaS técnico na Home.

### Painel Free/PRO

Direção:

- weather intelligence platform;
- maior densidade informacional;
- gráficos e comparação;
- controles e filtros claros;
- superfícies modulares;
- navegação persistente do painel;
- estados de atualização/fonte sempre visíveis;
- módulos e profundidade liberados por entitlement;
- sem ornamentação que prejudique leitura técnica.

O PRO deve parecer mais poderoso que o Free por capacidade e profundidade, não apenas mais cheio.

## 38. Alertas, PWA e notificações no PRO

O código de Web Push existe, mas permanece suspenso para ativação pública enquanto a validação real de navegadores não for concluída.

Para o produto autenticado:

- não usar Web Push como bloqueador do primeiro lançamento;
- primeiro validar novamente service worker, inscrição, unsubscribe, permissões e rolagem;
- depois vincular alertas personalizados a `alert_rules`;
- deduplicar eventos;
- aplicar cooldown;
- registrar entrega e falha;
- não transformar interpretação de IA em alerta oficial;
- sempre priorizar dados/avisos oficiais quando o assunto for evento severo.

## 39. LGPD, conta e cobrança no cenário PRO

A chegada da assinatura amplia o escopo dos direitos do titular e da política de privacidade.

Antes de produção comercial:

- exportação da conta deve incluir os novos dados pessoais que façam sentido exportar;
- exclusão deve remover preferências e artefatos pessoais conforme a política definida;
- registros fiscais/financeiros que precisem de retenção legal não devem ser apagados cegamente por cascade;
- a política deve explicar quais dados de cobrança ficam no provedor e quais identificadores ficam no Tempo Pelotas;
- prompts/consultas pessoais à IA devem ter retenção mínima;
- logs de IA não devem registrar secrets nem dados desnecessários;
- regras de alertas/localizações devem ser tratadas como dados pessoais do usuário;
- consentimentos de marketing continuam separados de mensagens transacionais necessárias à assinatura.

## 40. Observabilidade de produto e custo

O PRO precisa nascer mensurável.

Métricas mínimas:

- visita à futura página `/pro`;
- clique para assinar;
- checkout iniciado;
- checkout concluído;
- assinatura ativa;
- cancelamento;
- falha/past due;
- conversão visitante -> assinatura;
- MRR/receita recorrente conforme o provedor;
- churn;
- assinantes ativos;
- usuários Free/PRO ativos por período;
- uso por módulo;
- custo de IA por utilidade;
- custo de IA por assinante;
- cache hit de análises compartilhadas;
- chamadas evitadas por fingerprint;
- erros por fonte externa;
- tempo de resposta dos módulos;
- falhas de entitlement/webhook;
- saúde e gaps dos coletores históricos.

Não registrar conteúdo pessoal de forma desnecessária apenas para analytics.

## 41. Contratos e testes antes do lançamento comercial

Contratos mínimos:

- usuário anônimo não acessa `/painel`;
- usuário Free recebe somente seus entitlements;
- tier/status/validade inválidos não concedem PRO;
- assinatura ativa futura concede PRO somente após confirmação server-side;
- assinatura cancelada futura expira conforme regra comercial;
- webhook duplicado não duplica evento nem entitlement;
- webhook inválido é recusado;
- retorno de checkout sem webhook válido não libera acesso;
- RLS impede leitura de dados privados de outro usuário;
- rota autenticada é `noindex`;
- futura `/pro` pública permanece indexável quando criada;
- quota diária de IA bloqueia chamada excedente;
- cache/fingerprint evita nova chamada quando aplicável;
- falha de IA não torna o painel meteorológico indisponível;
- front público continua sem chamada direta de IA;
- nenhum secret de cobrança, Gemini ou Supabase administrativo aparece no bundle cliente;
- exclusão/exportação tratam as novas tabelas de forma coerente;
- build, typecheck, lint incremental e árvore de rotas continuam verdes.

E2E real obrigatório antes do lançamento:

1. conta A Free;
2. conta B descartável para isolamento cruzado;
3. login/logout em navegador real e mobile;
4. preferências/consentimentos;
5. exportação;
6. exclusão;
7. depois, quando billing existir, checkout sandbox, webhook, ativação e cancelamento PRO.

## 42. Feature flags para implantação segura na `main`

Como o trabalho é feito diretamente na `main`, recursos comerciais estruturais devem nascer desativados até o ambiente estar pronto.

Flags recomendadas quando a camada correspondente existir:

- `PRO_ENABLED`;
- `PRO_BILLING_ENABLED`;
- `PRO_AI_ENABLED`;
- `PRO_ALERTS_ENABLED`;
- `PRO_MODEL_COMPARISON_ENABLED`.

Regras:

- flags estruturais devem ser avaliadas server-side quando protegem acesso/custo;
- não usar flag cliente como segurança;
- página pública `/pro` pode ser publicada antes do checkout somente se deixar claro o estado comercial;
- billing não deve ser habilitado antes de schema, webhook e E2E estarem confirmados.

A integração da Defesa Civil usa uma flag operacional separada, `DEFESA_CIVIL_HYDRO_ENABLED`, que protege ativação técnica da fonte e não representa entitlement Free/PRO.

## 43. Roadmap de implementação até produção

### Fase 0 — decisão e documentação

Estado: **consolidada**.

Entregas concluídas:

- público x Free x PRO documentados;
- regra de IA pública congelada;
- escopo inicial de produto autenticado registrado;
- infraestrutura correta registrada: Lovable para deploy e Supabase externo separado;
- `PROJECT_CURRENT_STATE.md` mantido como fonte de direção.

### Fase 1 — fundação da conta

Estado: **estruturalmente implementada; E2E pendente**.

Já existe:

- `/conta`;
- `/painel` autenticado/noindex;
- Google Identity Services + ID Token;
- Web Client ID público configurado no build de produção;
- `account_access` Free/PRO;
- entitlements centralizados;
- preferências/consentimentos;
- exportação/exclusão/logout;
- reparação segura da fundação da conta.

Critério restante: executar E2E com duas contas descartáveis.

### Fase 2 — inventário e governança das fontes

Estado: **em andamento**.

Entregas já iniciadas:

- `docs/HISTORICAL_DATA_INVENTORY.md`;
- classes observation/forecast/reanalysis/derived;
- governança `paid_access_allowed` e `retention_policy_status`;
- separação Público/Free/PRO/REVIEW;
- implementação técnica da Defesa Civil RS preparada e protegida por flag até validar estações/semântica.

Próximos focos: Embrapa/UFPel, ANA/RHN, Defesa Civil RS e revisão de fontes candidatas a ferramentas pagas/exportáveis.

### Fase 3 — patrimônio histórico e APIs internas

Estado: **em andamento em paralelo**.

Já implantado:

- Historical Data Layer canônico;
- coleta Embrapa + extremos;
- hidrologia a cada 5 minutos + backfill diário;
- forecast run rico Open-Meteo;
- forecast run rico MET Norway;
- eventos estruturados STSC/INMET;
- histórico horário INMET A887 desde 2019;
- RLS e fontes com uso pago bloqueado por padrão.

Próximos passos:

- auditoria de cobertura/gaps dos arquivos atuais;
- backfills observacionais adicionais aprovados;
- rollups horários/diários/mensais;
- APIs históricas server-side com entitlement e política por dataset.

### Fase 4 — primeiro painel Free útil

Entregas:

- favoritos/locais quando definidos;
- histórico de até 60 dias para datasets Free;
- freshness/proveniência;
- gráficos determinísticos;
- estados vazios/erros;
- mobile e acessibilidade.

Critério de saída: existe valor autenticado real antes de pedir pagamento.

### Fase 5 — escolher e integrar cobrança

Entregas:

- escolher provedor e preço;
- implementar adapter;
- migrations de customer/subscription/eventos sem duplicar `account_access`;
- checkout server-side;
- webhook validado e idempotente;
- sincronização de assinatura -> entitlement;
- estado da assinatura em `/conta`;
- sandbox completo.

### Fase 6 — profundidade PRO sem IA

Entregas:

- histórico longo autorizado;
- comparação entre fontes/modelos;
- comparações entre períodos/estações/variáveis;
- exportação permitida;
- mapas/camadas aprovadas;
- comparativos hidrológicos;
- recursos avançados protegidos por entitlement.

Critério de saída: PRO já possui valor real com IA desligada.

### Fase 7 — camada de IA PRO

Entregas:

- gateway único de IA server-side;
- políticas por utilidade;
- quotas diárias;
- orçamento mensal;
- artefatos persistidos;
- fingerprint;
- cache compartilhado;
- logs e custo estimado;
- kill switch;
- primeira análise PRO: resumo refinado + `O que mudou`.

### Fase 8 — hardening comercial e operacional

Entregas:

- termos/privacidade atualizados;
- política de cancelamento/reembolso;
- export/delete revisados;
- rate limits;
- observabilidade de cobrança;
- dashboards de erro/custo;
- backup/rollback de banco documentado;
- smoke de rotas autenticadas/PRO;
- Core Web Vitals e WCAG;
- testes de navegador e mobile;
- revisão de secrets;
- revisão final das fontes usadas no plano pago.

### Fase 9 — lançamento controlado

Sequência:

1. publicar código com flags seguras;
2. confirmar migrations do Supabase externo;
3. confirmar cobrança em modo produção;
4. fazer assinatura real controlada;
5. verificar webhook e entitlement;
6. acessar o painel como assinante real;
7. testar cancelamento/portal;
8. ativar billing/PRO gradualmente;
9. acompanhar erros, custo e conversão;
10. ampliar divulgação apenas depois da estabilidade operacional.

## 44. Critérios de GO LIVE do Tempo Pelotas PRO

O PRO só pode ser considerado comercialmente em produção quando todos os itens críticos abaixo estiverem confirmados:

- autenticação E2E real concluída;
- Supabase externo com migrations aplicadas e RLS validada;
- cobrança de produção configurada;
- webhook assinado e idempotente;
- assinatura ativa gera entitlement sem ação manual;
- usuário Free não consegue contornar o guard;
- cancelamento funciona conforme regra comercial;
- `/painel` é noindex;
- dados públicos continuam disponíveis sem login;
- portal público funciona com IA desligada;
- PRO funciona meteorologicamente com IA desligada;
- quotas de IA e teto financeiro funcionam quando IA PRO for habilitada;
- nenhuma chamada de IA ocorre por simples pageview público;
- nenhuma fonte usada no MVP pago permanece com autorização de uso indefinida;
- política de privacidade e conta cobrem cobrança e novos dados;
- exportação/exclusão foram revisadas;
- secrets não aparecem no cliente/logs;
- smoke de produção passa;
- CI aplicável está verde;
- responsividade e acessibilidade foram testadas;
- rollback de aplicação e banco está documentado.

## 45. Prioridade imediata

A ordem operacional atual é:

1. manter a Home pública estável e evitar complexidade sem necessidade;
2. concluir E2E da conta com duas contas descartáveis;
3. auditar e consolidar o patrimônio histórico já coletado, incluindo cobertura/gaps;
4. definir rollups e APIs históricas server-side;
5. validar inventário/semântica da Defesa Civil RS antes de ativar a nova fonte;
6. construir valor real no painel Free, começando pelos históricos/datasets liberados;
7. concluir a matriz de governança para o que poderá entrar no PRO;
8. somente então escolher cobrança/preço e ligar billing ao `account_access` existente;
9. construir profundidade PRO determinística;
10. adicionar IA PRO depois que dados, entitlement e orçamento estiverem sólidos;
11. executar hardening e lançamento controlado.

Até a integração real de billing, nenhuma tela deve sugerir que o PRO está disponível para compra em produção.

Este arquivo também deve ser atualizado quando ocorrer:

- mudança de escopo público x Free x PRO;
- criação de plano/preço;
- escolha ou troca de provedor de cobrança;
- mudança de entitlement;
- nova feature premium;
- nova utilidade de IA;
- alteração de quota/custo estrutural;
- nova fonte usada como diferencial comercial;
- mudança de política de cancelamento;
- ativação de uma feature flag estrutural;
- passagem de uma fase do roadmap para concluída.

## 46. Política consolidada de acesso — Público, Free e PRO

Documento especializado e fonte detalhada desta decisão:

- `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

Regras consolidadas:

- tudo que já está público continua público, salvo motivo técnico, institucional ou jurídico documentado;
- dados oficiais/governamentais adequados à disseminação pública permanecem públicos e não devem ser transformados em paywall apenas para monetização;
- o usuário Free autenticado recebe valor pela conta: painel pessoal, favoritos, preferências, locais/estações acompanhadas e recursos/datasets definidos como Free;
- histórico de até 60 dias é um limite de entitlement para determinados recursos Free, **não** uma regra automática para dados oficiais já públicos;
- o PRO deve priorizar o Historical Data Layer próprio, históricos longos autorizados, indicadores derivados, comparações, análises, ferramentas avançadas, exportações permitidas e futuros recursos desenvolvidos pelo Tempo Pelotas;
- fonte ou dataset cuja retenção, redistribuição, exportação ou uso comercial permaneça incerto fica em `REVIEW`/interno e não pode ser usado como diferencial PRO até revisão documentada;
- `/conta` permanece a área de identidade, privacidade, sessão e plano;
- `/painel` é o **shell autenticado comum a Free e PRO**, com módulos e profundidade liberados por entitlement;
- esconder um componente no React nunca substitui autorização server-side;
- a coleta histórica continua em paralelo e não espera billing ou lançamento comercial.

### 46.1. Estado da aplicação desta política

A implementação **já iniciou**.

Concluído/ativo:

1. fundação de conta e `account_access` Free/PRO;
2. entitlements centralizados;
3. `/painel` autenticado/noindex;
4. política Público/Free/PRO/REVIEW documentada;
5. Historical Data Layer canônico;
6. coleta histórica Embrapa e hidrologia;
7. extremos diários Embrapa;
8. forecast run rico Open-Meteo;
9. forecast run rico MET Norway;
10. arquivo de eventos estruturados;
11. histórico horário INMET A887 desde 2019;
12. integração técnica da Defesa Civil RS preparada e desligada por flag até validação.

Em andamento/próximo:

1. E2E real do login GIS com duas contas;
2. auditoria de cobertura/gaps do patrimônio histórico já coletado;
3. backfills observacionais adicionais seguros;
4. rollups e APIs históricas server-side;
5. validação técnica/inventário da Defesa Civil RS;
6. primeiro painel Free com histórico de até 60 dias nos datasets aprovados;
7. governança das fontes candidatas ao PRO;
8. billing somente depois de o produto autenticado demonstrar valor;
9. IA e ferramentas avançadas depois que a camada determinística estiver sólida.

Documentos que devem ser consultados em conjunto antes de ampliar esta etapa:

- `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md`;
- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`;
- `docs/OFFICIAL_DATA_SOURCE_POLICY.md`.
