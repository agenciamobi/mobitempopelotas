# Defesa Civil RS — integração hidrometeorológica

Última consolidação: 22/08/2026  
Estado: **integração pública ativa / inventário e governança avançada em evolução**  
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

A interface pública deve preservar de forma visível:

- **Rede de Monitoramento Hidrometeorológico da Defesa Civil RS**;
- **Defesa Civil do Estado do Rio Grande do Sul**;
- **Casa Militar do Estado do Rio Grande do Sul**;
- indicação de que os dados são disponibilizados pela Defesa Civil RS através da MKS, conforme a documentação oficial da API;
- links para o mapa oficial e para a documentação oficial.

O texto institucional do Tempo Pelotas pode explicar que o portal organiza e ajuda a disseminar informações oficiais de órgãos públicos e fontes confiáveis, preservando estação, horário, unidade e origem.

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
- `src/components/hydrology/DefesaCivilHydroMap.tsx`;
- `src/components/hydrology/DefesaCivilHydroMap.module.css`;
- `src/routes/situacao-hidrologica-pelotas.tsx`;
- `tests/hydrology-overview-page.test.ts`.

Fluxo:

`API GraphQL oficial → adapter server-side → Zod → normalização → recorte regional → cache server-side → /situacao-hidrologica-pelotas`

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

### Hidrologia

- nome do rio;
- nível do rio em metros quando fornecido.

### Precipitação

- 1 h;
- 3 h;
- 6 h;
- 12 h;
- 24 h;
- 168 h.

### Meteorologia

- temperatura em °C;
- sensação térmica em °C;
- umidade em %;
- pressão atmosférica em hPa;
- radiação solar em kWh/m²;
- vento médio em km/h;
- vento máximo/rajada em km/h;
- direção do vento.

As unidades acima seguem a documentação oficial consultada em 22/08/2026.

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

## 10. Semântica pública

A área pública de `/situacao-hidrologica-pelotas` apresenta:

- nome e código da estação;
- bacia quando informada;
- horário da observação;
- idade calculada da leitura;
- nível, chuva e variáveis meteorológicas disponíveis;
- mapa regional MapLibre;
- links para mapa e documentação oficiais;
- atribuição explícita à Defesa Civil RS / Casa Militar / MKS conforme documentação da fonte.

A recência calculada pelo Tempo Pelotas (`recent`, `delayed`, `old`, `unknown`) informa apenas a idade da observação.

Ela **não representa**:

- estado operacional oficial;
- nível de atenção;
- alerta;
- inundação;
- previsão de cheia.

A integração continua sendo uma camada de observação.

## 11. Timestamp e referência vertical

O adapter preserva timestamps com timezone quando fornecidos.

Quando a API enviar data/hora sem offset, a implementação atual interpreta como horário local do Rio Grande do Sul (`UTC-03:00`). Timestamps que fiquem mais de cinco minutos no futuro em relação à consulta são descartados como não confiáveis para cálculo de recência.

A referência vertical de `rio_nivel` continua pertencendo a cada estação/régua.

Regras permanentes:

- não criar limiares próprios sem contrato técnico específico;
- não transferir cotas de uma régua para outra;
- não afirmar equivalência entre níveis absolutos de estações diferentes;
- preservar unidade, horário, estação e fonte.

## 12. Histórico e ferramentas futuras

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

## 13. Governança

A documentação oficial da API informa que, para produções públicas ou comerciais, as condições de uso devem ser consultadas com a equipe responsável.

A decisão operacional atual é:

- a leitura oficial básica integrada ao portal é pública e recebe atribuição integral;
- não esconder esse dado em Free/PRO;
- não assumir que o fato de a fonte ser governamental libera automaticamente qualquer forma de armazenamento, exportação, redistribuição em massa ou revenda;
- manter essas modalidades avançadas sob revisão por dataset;
- preservar créditos e links oficiais em toda exposição pública.

Isso permite cumprir a estratégia de disseminação pública sem fazer do dado bruto o produto comercial.

## 14. Segurança

- não versionar HAR bruto;
- não versionar cookies, tokens, headers ou secrets;
- consulta externa somente server-side;
- validar schema e coordenadas;
- não registrar payload integral em logs;
- não expor stack trace ou erro GraphQL bruto ao visitante;
- não transformar ausência de dado em zero;
- popup do mapa usa texto seguro (`setText`), não HTML arbitrário;
- falha da fonte permanece isolada.

## 15. Próximas etapas

Com o runtime público ativo, a sequência de melhoria é:

1. observar o contrato real em produção e o comportamento de disponibilidade;
2. gerar inventário sanitizado de códigos `DCRS-xxxxx`, nomes, coordenadas, bacias e capacidades;
3. classificar cada estação como `METEOROLOGY`, `HYDROLOGY`, `BOTH` ou `OUT_OF_SCOPE`;
4. refinar o conjunto hidrológico para estações com relação física defensável ao sistema acompanhado;
5. incorporar a saúde da fonte a `/status-dos-dados` e aos smokes de runtime;
6. avaliar `Historic` separadamente antes de qualquer backfill/arquivo permanente;
7. revisar governança antes de habilitar exportações ou uso comercial específico do dataset.
