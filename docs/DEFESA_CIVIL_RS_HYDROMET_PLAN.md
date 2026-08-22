# Defesa Civil RS — integração hidrometeorológica

Última consolidação: 22/08/2026  
Estado: **integração pública ativa / inventário dinâmico por capacidades implementado**  
Runtime público: **ativo por padrão; `DEFESA_CIVIL_HYDRO_ENABLED=false` funciona como kill switch server-side**

## 1. Objetivo

Usar a Rede de Monitoramento Hidrometeorológico da Defesa Civil do Rio Grande do Sul como fonte oficial regional complementar do Tempo Pelotas em dois eixos:

1. **meteorologia regional** — chuva, temperatura, vento, rajadas, pressão, umidade, sensação térmica e radiação quando esses sensores existirem e estiverem atualizados;
2. **hidrologia regional** — nível e chuva em estações cuja posição e bacia ajudem a compreender o sistema Guaíba → Lagoa dos Patos → estuário de Rio Grande e o sistema Lagoa Mirim → Canal São Gonçalo.

A integração não substitui silenciosamente a Estação Laranjal, Embrapa, SACE ou outra fonte já consolidada. Observação, previsão e alerta oficial permanecem semanticamente separados.

## 2. Política de acesso e produto

A leitura oficial básica da Defesa Civil RS é tratada pelo Tempo Pelotas como **informação pública do portal**, com fonte e créditos explícitos.

Regra de produto:

- não criar paywall Free/PRO para esconder a leitura oficial básica;
- o Tempo Pelotas público informa e dissemina;
- Free agrega conta, preferências, favoritos e ferramentas gratuitas;
- PRO agrega profundidade, histórico autorizado, comparações, análises, personalização, indicadores e ferramentas próprias;
- o valor comercial deve ser construído sobre a experiência e as ferramentas do Tempo Pelotas, não sobre bloquear a visualização de um dado oficial;
- exportação em massa, retenção longa, API comercial ou redistribuição específica continuam sujeitos à governança do dataset e à documentação aplicável;
- a integração não deve ser apresentada como parceria, homologação ou chancela institucional.

Essa política segue `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

## 3. Créditos institucionais

A interface pública preserva de forma visível:

- **Rede de Monitoramento Hidrometeorológico da Defesa Civil RS**;
- **Defesa Civil do Estado do Rio Grande do Sul**;
- **Casa Militar do Estado do Rio Grande do Sul**;
- indicação de que os dados são disponibilizados pela Defesa Civil RS através da MKS, conforme a documentação oficial da API;
- links para o mapa oficial e para a documentação oficial.

O texto institucional do Tempo Pelotas explica que o portal organiza e ajuda a disseminar informações oficiais de órgãos públicos e fontes confiáveis, preservando estação, horário, unidade e origem.

## 4. Evidência técnica validada

Endpoint GraphQL oficial:

`https://redehidrometeorologica.defesacivil.rs.gov.br/graphql`

Contratos documentados:

- `Historic` — consulta histórica por estação/período;
- `Tags_data` — consulta filtrada de estações/leituras;
- `Nowcasting` / `nowcasting_unique` — atualização em tempo real via Subscription.

Parâmetros institucionais:

- `system: Qualle_Hidrometeorologia`;
- `client/clients: casa-militar-defesa-civil-rs`;
- códigos de estação no padrão `DCRS-xxxxx`.

O runtime atual usa `tags_data`, `clients: ["casa-militar-defesa-civil-rs"]` e filtro de localização para a UF `43` — Rio Grande do Sul.

## 5. Implementação atual

Arquivos principais:

- `src/lib/hydrology/defesa-civil-rs.server.ts`;
- `src/lib/hydrology/defesa-civil-rs.functions.ts`;
- `src/components/hydrology/DefesaCivilHydroNetwork.tsx`;
- `src/components/hydrology/DefesaCivilHydroNetwork.css`;
- `src/components/hydrology/DefesaCivilHydroInventory.css`;
- `src/components/hydrology/DefesaCivilHydroMap.tsx`;
- `src/components/hydrology/DefesaCivilHydroMap.module.css`;
- `src/routes/situacao-hidrologica-pelotas.tsx`;
- `src/routes/api/defesa-civil/stations.ts`;
- `tests/hydrology-overview-page.test.ts`;
- `tests/defesa-civil-inventory.test.ts`.

Fluxo:

`API GraphQL oficial → adapter server-side → Zod → normalização → capacidades → classificação → recorte regional → cache server-side → interface/API sanitizada`

O navegador não chama a GraphQL institucional diretamente.

## 6. Ativação e kill switch

A integração pública fica habilitada por padrão.

Variável exclusivamente server-side:

`DEFESA_CIVIL_HYDRO_ENABLED=true`

Comportamento:

- variável ausente: integração pública habilitada;
- `true`: integração pública habilitada;
- `false`: kill switch operacional; a consulta externa não ocorre e o componente não é exibido;
- nunca criar `VITE_DEFESA_CIVIL_*`.

A flag existe para contingência operacional e não para monetização.

## 7. Resiliência

O adapter possui:

- timeout por tentativa;
- retry para falhas transitórias;
- validação de schema com Zod;
- coordenadas validadas;
- valores ausentes preservados como `null`, nunca convertidos em zero;
- timestamps futuros incompatíveis rejeitados antes de calcular recência;
- cache saudável mais longo e cache de falha curto;
- erro da Defesa Civil isolado das demais fontes da página;
- nenhum secret necessário no contrato público atualmente utilizado.

Configuração atual:

- resposta saudável: `max-age=120` + `stale-while-revalidate=300`;
- indisponibilidade: cache curto de 20 s;
- kill switch: cache de 300 s;
- timeout: 8 s por tentativa;
- uma repetição para falhas transitórias.

## 8. Campos normalizados

### Identidade e geografia

- código;
- nome;
- timestamp;
- latitude;
- longitude;
- bacia;
- região;
- altitude;
- distância geográfica até Pelotas.

### Capacidades informadas pela rede

O adapter preserva os indicadores de `filter.relacao` quando a API os fornece:

- `tem_chuva_acumulada`;
- `tem_nivel_do_rio`;
- `tem_pressao_atmosferica`;
- `tem_umidade`;
- `tem_vento`.

A presença real de uma variável recebida é usada somente como fallback técnico quando o indicador correspondente não estiver disponível. O nome da estação nunca é usado para deduzir capacidade.

### Classificação dinâmica

Cada estação regional é classificada automaticamente como:

- `HYDROLOGY` — capacidade de nível de rio sem conjunto meteorológico identificado;
- `METEOROLOGY` — capacidades meteorológicas sem nível de rio;
- `BOTH` — capacidades hidrológicas e meteorológicas;
- `UNKNOWN` — a resposta não permite identificar nenhum dos dois grupos.

Essa classificação descreve **capacidade de dados**, não risco, prioridade, estado operacional ou importância hidrológica para Pelotas.

### Hidrologia

- nome do rio;
- nível do rio em metros quando fornecido;
- `rio_nivel_tendencia` preservado como texto/dado da fonte, sem conversão para alerta;
- `rio_area_drenagem` preservado internamente quando fornecido.

A área de drenagem não recebe unidade na interface enquanto a semântica/unidade não estiver validada de forma suficiente para o campo específico.

### Precipitação

- 1 h;
- 3 h;
- 6 h;
- 12 h;
- 24 h;
- 48 h;
- 72 h;
- 96 h;
- 120 h;
- 144 h;
- 168 h.

### Meteorologia

- temperatura em °C;
- sensação térmica em °C;
- umidade em %;
- pressão atmosférica em hPa;
- radiação solar em kWh/m² quando o contrato da fonte sustenta essa interpretação;
- vento médio em km/h;
- vento máximo/rajada em km/h;
- direção do vento.

Ausência continua sendo ausência (`null`), nunca zero sintético.

## 9. Recorte regional

O adapter usa raio de até **320 km de Pelotas** e limita o payload da interface a até 36 estações, ordenadas por proximidade.

Esse raio é um recorte de descoberta e apresentação. **Proximidade geográfica não significa conexão hidrológica.**

Para meteorologia, o recorte regional pode ser útil por proximidade e disponibilidade dos sensores.

Para hidrologia, a seleção editorial deve priorizar estações com relação física demonstrável a:

- Lago Guaíba e entrada na Lagoa dos Patos;
- Bacia do Camaquã;
- margens e afluentes da Lagoa dos Patos;
- sistema Mirim–São Gonçalo;
- estuário e saída em Rio Grande quando a referência do sensor for adequada.

Nunca comparar níveis absolutos de réguas distintas por simples subtração.

## 10. Inventário regional dinâmico

`DefesaCivilHydroData` agora inclui um resumo calculado do recorte regional com contagens de:

- `HYDROLOGY`;
- `METEOROLOGY`;
- `BOTH`;
- `UNKNOWN`.

A interface mostra esse resumo de forma compacta e cada cartão de estação informa sua classificação e os grupos de sensores/campos reconhecidos.

O inventário é derivado da resposta atual da API; não existe lista nominal hardcoded para fabricar uma topologia estática da rede.

Uma fotografia nominal sanitizada pode ser registrada em `docs/DEFESA_CIVIL_RS_STATION_INVENTORY_2026-08-22.md` somente a partir de uma execução real do runtime. Se a API estiver indisponível no momento da validação, a documentação deve registrar a indisponibilidade em vez de inventar estações.

## 11. API sanitizada do Tempo Pelotas

Rota pública técnica:

`/api/defesa-civil/stations`

Finalidade:

- expor o inventário regional já normalizado pelo Tempo Pelotas;
- permitir inspeção operacional e futuras ferramentas públicas sem fazer o navegador depender diretamente da GraphQL institucional;
- preservar fonte, horário, classificação e capacidades.

A resposta contém somente campos necessários à consulta pública, como identidade da estação, posição, recência, capacidades, classificação e variáveis normalizadas. Não expõe payload bruto, cookies, tokens, headers internos ou credenciais.

A rota usa cache público curto, `nosniff` e `X-Robots-Tag: noindex, nofollow` para não virar uma página indexável concorrente ao conteúdo editorial.

## 12. Semântica pública

A área pública de `/situacao-hidrologica-pelotas` apresenta:

- nome e código da estação;
- bacia quando informada;
- horário da observação;
- idade calculada da leitura;
- classificação de capacidade da estação;
- sensores/campos identificados;
- nível, chuva e variáveis meteorológicas disponíveis;
- tendência de nível quando a própria fonte a fornecer, apresentada como dado bruto/descrição da estação;
- mapa regional MapLibre;
- links para mapa e documentação oficiais;
- atribuição explícita à Defesa Civil RS / Casa Militar / MKS conforme documentação da fonte.

A recência calculada pelo Tempo Pelotas (`recent`, `delayed`, `old`, `unknown`) informa apenas a idade da observação.

Nem a recência, nem a classificação de capacidades, nem a tendência textual são convertidas pelo Tempo Pelotas em:

- estado operacional oficial;
- nível de atenção;
- alerta;
- inundação;
- previsão de cheia.

A integração continua sendo uma camada de observação.

## 13. Timestamp e referência vertical

O adapter preserva timestamps com timezone quando fornecidos.

Quando a API enviar data/hora sem offset, a implementação atual interpreta como horário local do Rio Grande do Sul (`UTC-03:00`). Timestamps que fiquem mais de cinco minutos no futuro em relação à consulta são descartados como não confiáveis para cálculo de recência.

A referência vertical de `rio_nivel` continua pertencendo a cada estação/régua.

Regras permanentes:

- não criar limiares próprios sem contrato técnico específico;
- não transferir cotas de uma régua para outra;
- não afirmar equivalência entre níveis absolutos de estações diferentes;
- preservar unidade, horário, estação e fonte.

## 14. Histórico e ferramentas futuras

O contrato `Historic` pode ser aproveitado futuramente para séries específicas depois de validar por estação/dataset:

- unidade;
- timestamp;
- referência do nível;
- intervalo suportado;
- comportamento de lacunas e correções;
- retenção;
- redistribuição;
- exportação.

A leitura oficial básica continua pública. O valor de Free/PRO deve vir de ferramentas do Tempo Pelotas, como:

- organização e favoritos;
- comparação temporal;
- comparação entre estações/variáveis;
- histórico próprio e histórico autorizado;
- indicadores derivados;
- análises e relatórios;
- alertas personalizados;
- visualizações avançadas;
- exportações quando permitidas.

## 15. Governança

A documentação oficial da API informa que, para produções públicas ou comerciais, as condições de uso devem ser consultadas com a equipe responsável.

A decisão operacional atual é:

- a leitura oficial básica integrada ao portal é pública e recebe atribuição integral;
- não esconder esse dado em Free/PRO;
- não assumir que o fato de a fonte ser governamental libera automaticamente qualquer forma de armazenamento, exportação, redistribuição em massa ou revenda;
- manter essas modalidades avançadas sob revisão por dataset;
- preservar créditos e links oficiais em toda exposição pública.

Isso permite cumprir a estratégia de disseminação pública sem fazer do dado bruto o produto comercial.

## 16. Segurança

- não versionar HAR bruto;
- não versionar cookies, tokens, headers ou secrets;
- consulta externa somente server-side;
- validar schema e coordenadas;
- não registrar payload integral em logs;
- não expor stack trace ou erro GraphQL bruto ao visitante;
- não transformar ausência de dado em zero;
- popup do mapa usa texto seguro (`setText`), não HTML arbitrário;
- falha da fonte permanece isolada;
- endpoint sanitizado não deve se tornar proxy genérico para a GraphQL institucional.

## 17. Contratos automatizados

A suíte protege, entre outros pontos:

- ativação pública por padrão e kill switch explícito;
- preservação dos indicadores de `filter.relacao`;
- classificação determinística por capacidade;
- novos campos opcionais de hidrologia e acumulados de chuva;
- ausência mantida como `null`;
- inventário regional por classificação;
- separação entre capacidade/recência/tendência e classificação de risco;
- créditos institucionais;
- responsividade e forced colors da nova camada visual.

## 18. Próximas etapas

Com o runtime público ativo e o inventário dinâmico implementado, a sequência é:

1. publicar e consultar `/api/defesa-civil/stations` no runtime real;
2. validar que os campos adicionais solicitados existem no contrato GraphQL efetivamente servido; se algum campo não for aceito, recuar somente esse campo sem derrubar a integração básica;
3. gerar inventário nominal sanitizado de códigos `DCRS-xxxxx`, nomes, bacias, distâncias e capacidades a partir da resposta real;
4. classificar editorialmente a relevância hidrológica das estações sem confundir proximidade com conexão física;
5. incorporar a saúde da fonte a `/status-dos-dados` e aos smokes de runtime;
6. avaliar `Historic` separadamente antes de qualquer backfill/arquivo permanente;
7. revisar governança antes de habilitar exportações amplas ou uso comercial específico do dataset.
