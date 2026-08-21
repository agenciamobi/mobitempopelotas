# SIMAGRO RS — revisão do HAR

Revisão do arquivo `simagro.rs.gov.br.har` recebido em 18/08/2026 para avaliar uso no Tempo Pelotas.

## Estado atual

Desde 21/08/2026, os produtos gráficos públicos identificados no HAR são exibidos em `/meteograma-pelotas` como **camada visual complementar de modelagem**.

O SIMAGRO RS **não é fonte numérica do agregador meteorológico**. A integração pública atual limita-se a apresentar os PNGs oficiais, um produto por vez, com atribuição e aviso de proveniência.

## O que o HAR expôs

O tráfego do SIMAGRO RS capturado não apresentou endpoint JSON/API com séries numéricas. Os produtos meteorológicos úteis apareceram como imagens PNG públicas de meteogramas para Pelotas:

- `https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_wrf_4914.png`
- `https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_gfs_4914.png`
- `https://simagro.rs.gov.br/data/produtos/latest/meteogramas/agrometeograma_gfs_4914.png`

Os três produtos têm 800 × 900 px e representam saídas de modelos WRF/GFS para Pelotas.

## Política de integração

Essas imagens servem como **fonte visual/modelagem complementar**, mas não devem ser usadas como feed numérico operacional do portal.

Não extrair valores dos PNGs por OCR ou leitura de pixels para preencher temperatura, chuva, vento, pressão, umidade ou qualquer outro dado exibido no Tempo Pelotas.

A implementação pública segue estas regras:

- apenas o produto selecionado pelo visitante é renderizado no viewer;
- falha do PNG externo não derruba o meteograma estruturado;
- o usuário pode abrir o portal oficial do SIMAGRO RS;
- a data, ciclo e legenda válidos devem ser conferidos no próprio produto gráfico;
- nenhum número do PNG é incorporado ao dataset do Tempo Pelotas.

A hierarquia atual permanece:

1. observação atual: Embrapa Clima Temperado;
2. previsão municipal e alertas oficiais: INMET;
3. detalhamento horário: provedor meteorológico estruturado configurado no agregador;
4. contexto regional: CPPMet/UFPel;
5. SIMAGRO RS: produto gráfico complementar de modelos.

Se futuramente for identificado endpoint oficial estruturado do SIMAGRO RS, ele deve ser integrado separadamente, com proveniência, timeout, fallback, testes de contrato e identificação clara de que se trata de modelagem/previsão, não observação.

A revisão ampla dos HARs e decisões de enriquecimento público está registrada em `docs/HAR_PUBLIC_ENRICHMENT_2026-08-21.md`.
