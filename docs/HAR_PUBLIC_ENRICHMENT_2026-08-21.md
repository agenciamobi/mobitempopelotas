# HARs recentes — oportunidades de enriquecimento público

Revisão sanitizada concluída em 21/08/2026 a partir dos HARs e contratos técnicos coletados nos dias anteriores.

Este documento registra **conclusões técnicas**, não os HARs brutos. Nenhum cookie, token, chave, header autenticado ou URL com credencial deve ser versionado.

## Objetivo

Identificar informações que as fontes já disponibilizam e separar três grupos:

1. dados que podem enriquecer imediatamente páginas públicas sem criar interpretação indevida;
2. capacidades que já estão bem aproveitadas no produto;
3. integrações que devem continuar em pesquisa até validação institucional, semântica ou operacional.

## Implementado nesta rodada

### SIMAGRO RS — meteogramas WRF/GFS

O HAR do SIMAGRO confirmou três produtos PNG públicos para Pelotas:

- meteograma WRF;
- meteograma GFS;
- agrometeograma GFS.

A rota `/meteograma-pelotas` passa a exibir esses três produtos como **camada visual complementar de modelagem**.

Regras mantidas:

- somente um produto é carregado por vez no viewer;
- a imagem continua hospedada e identificada como produto do SIMAGRO RS;
- o Tempo Pelotas não usa OCR, leitura de pixels ou qualquer extração automática para transformar o PNG em valor numérico;
- os dados horários estruturados do portal continuam independentes;
- falha do produto externo não derruba o meteograma principal.

### REDEMET / DECEA — informação derivada da sequência já recebida

A API já entrega timestamps dos quadros de radar, satélite e STSC e coordenadas das ocorrências de trovoada. A página `/radar-e-satelite-pelotas` passa a derivar, sem nova chamada externa:

- quantidade de quadros com horário utilizável;
- janela temporal coberta pela sequência;
- cadência mediana observada entre quadros;
- distância aproximada da ocorrência STSC mais próxima até a referência de Pelotas;
- distribuição das ocorrências em 0–50 km, 50–150 km e 150–450 km.

Limites editoriais:

- timestamps futuros ou incompatíveis são excluídos desses cálculos pelo mesmo contrato temporal usado no restante da página;
- cadência observada não é tratada como SLA da fonte;
- distância é calculada em linha reta e não representa intensidade, risco ou trajetória da tempestade;
- STSC continua sendo monitoramento de atividade elétrica e não um alerta meteorológico.

### INMET — abrangência completa dos avisos CAP/RSS

O parser estabilizado do INMET já preserva campos que antes apareciam apenas de forma resumida na interface:

- horário de publicação (`sentAt`);
- início e término;
- descrição;
- instrução;
- severidade;
- áreas oficiais;
- municípios identificados;
- códigos municipais para validação interna;
- URL oficial.

A rota `/alertas` passa a oferecer um bloco progressivo de **abrangência oficial detalhada**, sem duplicar a leitura prioritária do aviso. O usuário pode expandir cada publicação e consultar os horários e a lista territorial completa recebida da fonte.

## Capacidades já bem aproveitadas — sem nova camada nesta rodada

### Embrapa Clima Temperado

A página pública já expõe:

- temperatura, umidade, pressão, ponto de orvalho, vento e direção;
- nascer e pôr do sol quando informados;
- chuva diária, mensal e anual;
- evapotranspiração diária, mensal e anual;
- extremos de temperatura, umidade, ponto de orvalho e vento;
- horário da medição, horário da consulta, atraso e proveniência;
- quais campos da observação local foram efetivamente usados no resumo atual.

Não foi criada uma segunda camada redundante.

### REDEMET — produtos de radar alternativos

Os HARs confirmaram produtos como `maxcappi`, `10km`, `07km`, `05km` e `03km`. O runtime já os utiliza na lógica resiliente de produto/estação quando necessário. A página identifica o produto ativo e a origem; não foi criado um seletor público de altitude porque esses produtos hoje cumprem papel operacional de fallback e não há benefício suficiente para transformar fallback técnico em navegação principal.

## Capacidades observadas, mas deliberadamente não ativadas

### CPTEC / SIGMA

A pesquisa identificou, entre outros:

- radar CAPPI;
- PPI de vento;
- GLM de atividade elétrica com produtos frequentes;
- Hidroestimador de precipitação;
- FORTRACC com projeções de curto prazo;
- produtos especializados de satélite, nuvens e nevoeiro.

**Decisão mantida:** não integrar o SIGMA ao runtime público antes da revisão institucional prevista para novembro/dezembro de 2026. Consulte `docs/CPTEC_SIGMA_RESEARCH.md`.

### Rede Hidrometeorológica da Defesa Civil RS

Os contratos GraphQL e os bundles públicos indicam potencial para:

- nível e tendência de rios;
- precipitação em várias janelas acumuladas;
- temperatura, umidade, pressão e tendência;
- vento médio, rajada e direção;
- radiação solar;
- nowcasting;
- capacidades por estação.

**Decisão mantida:** não publicar como fonte ativa antes de concluir inventário das estações, relação hidrológica por bacia e revisão das condições de uso. Consulte `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`.

### ANA / RHN / SNIRH

A pesquisa já identificou contratos com identidade da estação, bacia/sub-bacia, parâmetro, último dado, horário e estado operacional, além do acesso autorizado em processo de implantação.

**Decisão mantida:** não transformar capturas autenticadas em leitura pública até validar parâmetro, unidade, referência vertical/cota, timezone, atraso e permissões. Consulte `docs/ANA_RHN_INTEGRATION.md`.

### REDEMET — mensagens aeronáuticas e WMS

Os HARs mostraram capacidades adicionais como SIGMET, AIRMET, GAMET e produtos WMS. Elas não foram ativadas nesta rodada porque exigem uma camada de interpretação aeronáutica própria e não devem ser reapresentadas como alerta meteorológico municipal sem contrato semântico específico.

## Próximas oportunidades seguras

Ordem recomendada para futuras rodadas:

1. validar disponibilidade real dos produtos SIMAGRO em produção e, se necessário, criar proxy/caching controlado sem extrair dados do gráfico;
2. melhorar a apresentação do produto radar ativo quando houver troca operacional de estação/produto;
3. quando a governança da Defesa Civil RS estiver concluída, selecionar estações por bacia/capacidade em vez de proximidade simples;
4. concluir a validação ANA/RHN e usar a fonte inicialmente como contexto/checagem independente, não como substituição silenciosa da referência local;
5. revisar CPTEC/SIGMA na janela institucional já definida.

## Regra permanente

Mais dados só entram no portal quando a página consegue responder claramente:

- de onde veio;
- se é observação, previsão, modelagem, monitoramento ou alerta;
- qual é o horário relevante;
- qual é a área/estação de referência;
- qual é a unidade e, quando necessário, o datum/referência;
- quais limitações impedem uma interpretação mais forte.

A existência de um endpoint ou campo em um HAR não é, sozinha, autorização editorial para publicá-lo.
