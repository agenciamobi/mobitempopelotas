# SEO + Search Console — baseline de 16/08/2026

Este documento registra a fotografia usada na rodada de auditoria SEO de 16 de agosto de 2026. O objetivo é preservar uma linha de base verificável para comparar indexação, crescimento orgânico e consolidação de URLs depois das próximas recapturas do Google.

## Escopo da auditoria

Fontes analisadas:

- branch `main` do repositório `agenciamobi/mobitempopelotas`, partindo do commit `421655bceecdcfb2f49a07d0c5af972366fa2c43`;
- export `tempopelotas.com.br-Performance-on-Search-2026-08-16.zip`;
- quatro exports `tempopelotas.com.br-Coverage-Drilldown-2026-08-16*.zip`;
- HAR `search.google.com tempopelotas(1).har`;
- captura da tela de Sitemaps do Google Search Console enviada na mesma rodada.

A propriedade observada no HAR é a propriedade de domínio `sc-domain:tempopelotas.com.br`, portanto cobre as variantes de host do domínio.

## Linha de base de desempenho

O export cobre os últimos três meses, mas os dados disponíveis começam em 20/07/2026.

### Evolução por período

| Período | Cliques | Impressões | CTR |
| --- | ---: | ---: | ---: |
| 20/07 a 31/07 | 30 | 476 | 6,30% |
| 01/08 a 14/08 | 42 | 1.062 | 3,95% |

As impressões cresceram mais rapidamente que os cliques. Isso é compatível com uma fase inicial de expansão de cobertura de consultas: o Google passa a testar o domínio para mais intenções antes de posições e CTR estabilizarem. O indicador deve ser acompanhado por consulta e página, e não interpretado isoladamente como perda de qualidade.

### Dispositivos

| Dispositivo | Cliques | Impressões | CTR | Posição média do export |
| --- | ---: | ---: | ---: | ---: |
| Mobile | 57 | 1.066 | 5,35% | 12,12 |
| Desktop | 15 | 461 | 3,25% | 37,35 |
| Tablet | 0 | 11 | 0% | 20,73 |

Mobile representa aproximadamente 69% das impressões e 79% dos cliques do export. Core Web Vitals, leitura imediata, navegação e estabilidade visual em telas pequenas permanecem prioridade operacional.

## Principal ativo orgânico encontrado

A frente hidrológica é, nesta baseline, o ativo orgânico mais forte do portal.

Somando as variantes canônica e `www` presentes no export:

| Intenção/página | Cliques | Impressões |
| --- | ---: | ---: |
| Nível da Lagoa dos Patos no Laranjal | 37 | 515 |
| Situação hidrológica / situação das águas | 32 | 317 |

A URL canônica `/nivel-da-lagoa-dos-patos-laranjal` isoladamente registrou 31 cliques, 287 impressões, CTR de 10,80% e posição média de 5,59.

A URL canônica `/situacao-hidrologica-pelotas` registrou 11 cliques, 137 impressões, CTR de 8,03% e posição média de 6,13. A variante `www` ainda carregava parte importante dos sinais históricos.

Consultas visíveis no export reforçam a mesma intenção, incluindo variações de `nível da lagoa dos patos`, `nível da lagoa dos patos hoje`, `nivel lagoa dos patos pelotas` e `nivel da lagoa dos patos em tempo real`.

### Decisão estratégica

Não diluir essa autoridade em páginas redundantes. A arquitetura deve manter:

- `/nivel-da-lagoa-dos-patos-laranjal` como resposta local e operacional da Estação Laranjal;
- `/situacao-hidrologica-pelotas` como visão regional e explicativa, relacionando Laranjal, Lagoa dos Patos, Guaíba e SACE;
- links internos recíprocos e contexto de chuva, vento, alertas e metodologia;
- linguagem cuidadosa para não transformar uma leitura de estação em afirmação automática de inundação ou segurança.

## Arquitetura de intenção em Pelotas

A separação recomendada fica explícita:

- `/`: **agora** — condição atual e porta de entrada do portal;
- `/tempo-hoje-pelotas`: **hoje / por hora** — detalhamento operacional do dia;
- `/tempo-amanha-pelotas`: **amanhã**;
- `/previsao-7-dias-pelotas`: **tendência semanal**;
- `/chuva-em-pelotas`: **probabilidade e volume de precipitação**;
- `/vento-em-pelotas`: **vento e rajadas**;
- `/clima-em-pelotas`: **climatologia e comportamento ao longo do ano**;
- `/historico-climatico-pelotas`: **recorte observado/estimado recente de 30 dias**, sem se apresentar como normal climatológica.

Nesta rodada, o H1 da Home foi alterado de `Tempo em Pelotas hoje` para `Tempo agora em Pelotas`. A mudança reduz a sobreposição semântica com a página dedicada a hoje e mantém o CTA da Home conduzindo ao aprofundamento por hora.
## Cobertura e indexação observadas

Os exports de cobertura trouxeram os seguintes exemplos:

- `/conta`: excluída por `noindex` — comportamento esperado;
- `https://tempopelotas.com.br/`: registrada historicamente como página com redirecionamento, último rastreio em 21/07/2026;
- variantes `www` das páginas hidrológicas: rastreadas e ainda não indexadas/consolidadas;
- `/brand/tempo-pelotas-header`: rastreada como URL técnica;
- variante `www` do alias de marca: classificada como soft 404.

O código atual já implementa redirecionamento permanente de `www`, HTTP e hosts técnicos para `https://tempopelotas.com.br`, preservando caminho e query string. Portanto, a frente principal para `www` é consolidação por recrawl, não reconstrução da canonicalização.

### Correções desta rodada

1. a área `/conta` passou a apontar diretamente para `/brand/tempo-pelotas-header.svg`, evitando gerar novas requisições ao alias sem extensão;
2. o alias legado `/brand/tempo-pelotas-header` continua respondendo `308`, mas agora envia `X-Robots-Tag: noindex, nofollow`;
3. o feed JSON público passou a enviar `X-Robots-Tag: noindex, nofollow`, permanecendo acessível para consumidores técnicos;
4. o sitemap deixou de emitir o redundante `X-Robots-Tag: index, follow`;
5. testes passaram a proteger esses contratos.

## Sitemap

A captura do Search Console em 16/08/2026 mostrava o sitemap processado com **42 páginas encontradas**.

O registro atual de `PUBLIC_ROUTES` gera **43 URLs únicas**: páginas editoriais/operacionais, diretório regional, blog, 23 cidades regionais além de Pelotas, metodologia e privacidade.

A diferença de uma URL não é tratada como erro nesta rodada. O blog foi adicionado recentemente e o Search Console pode refletir uma leitura anterior do sitemap. Revalidar depois de nova leitura do Google antes de qualquer intervenção.

### `priority` e `changefreq`

O sitemap ainda contém `priority` e `changefreq` porque fazem parte do contrato atual do projeto. A documentação atual do Google informa que esses valores não são usados pelo Google Search. Não há benefício em abrir um refactor apenas para removê-los.

`lastmod` não será inventado. Se for adicionado no futuro, deve representar alteração significativa e confiável do conteúdo da URL, não simplesmente o horário em que o sitemap foi solicitado.

Referência oficial: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

## Bug real corrigido: geo metadata das páginas regionais

`createPageHead()` aplicava `geo.placename=Pelotas`, latitude e longitude de Pelotas a todas as páginas que o utilizavam. As páginas `/tempo-em/{cidade-rs}` chamavam esse helper sem sobrescrever os dados geográficos.

Consequência: uma página de Bagé, Rio Grande, Jaguarão ou outra cidade podia ter title/canonical corretos e JSON-LD local correto, mas meta tags geográficas apontando para Pelotas.

A correção desta rodada torna o contexto geográfico configurável no helper e faz a rota regional informar `city.name`, `city.latitude` e `city.longitude`. As páginas de Pelotas continuam usando Pelotas como padrão.

## Páginas regionais programáticas

A base regional é tecnicamente melhor que um conjunto de páginas de troca automática de nome:

- registro curado de municípios, código IBGE, coordenadas, grupo e descritor;
- consulta de previsão por coordenadas reais;
- consulta de avisos do INMET por município;
- links entre cidades da mesma região;
- Pelotas consolidada na Home, sem duplicata `/tempo-em/pelotas-rs`;
- URLs indexáveis no sitemap.

Mesmo assim, a próxima evolução deve aumentar conteúdo local realmente distinto nas cidades com demanda comprovada. Não criar dezenas de blocos genéricos. Priorizar cidades que começarem a receber impressões e enriquecer com contexto geográfico/meteorológico factual e sustentável.

## Dados estruturados, AEO e GEO em 2026

### Speakable

O helper editorial incluía `SpeakableSpecification` em todas as páginas. A documentação do Google ainda trata Speakable como recurso beta voltado a conteúdo de notícias em inglês/Google Assistant e não como mecanismo genérico para páginas meteorológicas em português do Brasil.

O markup foi removido nesta rodada.

Referência oficial: https://developers.google.com/search/docs/appearance/structured-data/speakable

### FAQPage

As páginas possuem FAQs visíveis úteis ao usuário. Elas devem permanecer como conteúdo editorial quando ajudam a esclarecer interpretação de chuva, nível, estação, alertas e climatologia.

O Google descontinuou a exibição do rich result de FAQ em 2026. Portanto, `FAQPage` não deve ser tratado como alavanca de rich result do Google. O schema pode permanecer por semântica enquanto refletir exatamente perguntas e respostas visíveis, mas não justifica conteúdo artificial.

Referência de atualizações: https://developers.google.com/search/updates

### AI Overviews / AI Mode

A orientação oficial atual não exige um arquivo, schema ou técnica paralela de “GEO” para aparecer nas experiências de IA do Google. A prioridade continua sendo SEO técnico válido, conteúdo útil e diferenciado, rastreabilidade, links internos, experiência de página e structured data coerente com o conteúdo visível.

Referência oficial: https://developers.google.com/search/docs/appearance/ai-features
### `llms.txt`

Não adicionar `llms.txt` como ação de SEO para Google. A documentação de atualizações do Google esclareceu em 2026 que o arquivo não influencia a visibilidade ou o ranking no Google Search. Só deve existir no futuro se houver um caso de uso próprio, independente de promessa de ranking.

## Estrutura de links internos

O portal já possui uma base forte:

- menu principal separa Agora, Hoje, Amanhã, 7 dias, Chuva e Vento;
- megamenus conectam Monitoramento, Região e Águas;
- páginas editoriais possuem blocos de links relacionados;
- páginas regionais apontam para cidades próximas e para o diretório regional;
- páginas hidrológicas se conectam a alertas, chuva, vento, metodologia e câmeras.

O foco da próxima rodada não deve ser aumentar a quantidade de links, e sim reforçar âncoras e caminhos onde Search Console mostrar demanda real.

## Backlog priorizado após esta rodada

### P0 — acompanhar, sem nova mudança estrutural imediata

- consolidação das variantes `www` nas URLs canônicas;
- recrawl do alias `/brand/tempo-pelotas-header`;
- atualização do sitemap no Search Console de 42 para o total atual quando o Google reler o arquivo;
- manutenção da autoridade hidrológica sem troca de URLs.

### P1 — alto retorno provável

- criar uma imagem social raster 1200×630 dedicada para Open Graph/Twitter; o asset social atual é SVG;
- trabalhar snippets/CTR das consultas `tempo`, `previsão`, `chuva` e `temperatura` depois que posições começarem a entrar na primeira página;
- enriquecer páginas regionais somente conforme demanda real aparecer;
- avaliar `Dataset` nas páginas em que exista um conjunto de dados realmente exposto e documentável, especialmente histórico/hidrologia. O helper `createDatasetJsonLd()` já existe, mas não está aplicado atualmente.

### P2 — expansão editorial

- criar conteúdos próprios apenas quando houver intenção que não seja bem respondida pelas páginas existentes;
- transformar o blog em camada editorial complementar sem republicar material do CPPMet/UFPel como conteúdo próprio;
- acompanhar no Search Console, quando disponível para a propriedade, os relatórios específicos das experiências de IA e comparar as páginas citadas com o desempenho clássico de Web Search.

## Métrica para a próxima comparação

Em uma nova exportação, comparar pelo menos:

1. cliques, impressões, CTR e posição das duas páginas hidrológicas;
2. proporção de impressões/cliques em host `www` versus canônico;
3. impressões da Home para intenções de `agora`;
4. impressões de `/tempo-hoje-pelotas` para `hoje`, `por hora`, `sensação térmica` e temperatura;
5. evolução de `/chuva-em-pelotas` — atualmente já recebe descoberta, mas ainda precisa converter melhor posições em cliques;
6. primeiras cidades regionais que ultrapassarem um volume mínimo de impressões suficiente para justificar enriquecimento local;
7. quantidade de páginas descobertas no sitemap e motivo das URLs não indexadas.

## Princípio operacional

O Tempo Pelotas não precisa aumentar o número de páginas por aumentar. O crescimento deve vir de três ativos combinados:

1. **dados locais e regionais úteis**;
2. **arquitetura de intenção sem duplicação**;
3. **explicação editorial confiável sobre o que é medição, previsão, alerta e interpretação**.

Essa combinação é mais defensável para Search, AI Overviews/AI Mode e para o usuário real do que páginas genéricas, schema excessivo ou otimizações sem evidência.