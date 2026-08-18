# SIMAGRO RS — revisão do HAR

Revisão do arquivo `simagro.rs.gov.br.har` recebido em 18/08/2026 para avaliar uso no Tempo Pelotas.

## O que o HAR expôs

O tráfego do SIMAGRO RS capturado não apresentou endpoint JSON/API com séries numéricas. Os produtos meteorológicos úteis apareceram como imagens PNG públicas de meteogramas para Pelotas:

- `https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_wrf_4914.png`
- `https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_gfs_4914.png`
- `https://simagro.rs.gov.br/data/produtos/latest/meteogramas/agrometeograma_gfs_4914.png`

Os três produtos têm 800 × 900 px e representam saídas de modelos WRF/GFS para Pelotas.

## Política de integração

Essas imagens podem servir como **fonte visual/modelagem complementar**, mas não devem ser usadas como feed numérico operacional do portal.

Não extrair valores dos PNGs por OCR ou leitura de pixels para preencher temperatura, chuva, vento, pressão, umidade ou qualquer outro dado exibido no Tempo Pelotas.

A hierarquia atual permanece:

1. observação atual: Embrapa Clima Temperado;
2. previsão municipal e alertas oficiais: INMET;
3. detalhamento horário: provedor meteorológico estruturado configurado no agregador;
4. contexto regional: CPPMet/UFPel;
5. SIMAGRO RS: produto complementar de modelos, enquanto não houver endpoint estruturado validado.

Se futuramente for identificado endpoint oficial estruturado do SIMAGRO RS, ele deve ser integrado com proveniência, timeout, fallback, testes de contrato e identificação clara de que se trata de modelagem/previsão, não observação.
