# Defesa Civil RS — plano de integração hidrometeorológica

Última consolidação: 22/08/2026  
Estado: **implementação técnica preparada / ativação pública pendente de validação técnica**  
Runtime público: **integrado ao código, oculto por `DEFESA_CIVIL_HYDRO_ENABLED=false`**

## 1. Objetivo

Usar a Rede de Monitoramento Hidrometeorológico da Defesa Civil do Rio Grande do Sul como fonte oficial regional complementar do Tempo Pelotas em dois eixos distintos:

1. **meteorologia regional** — estações com chuva, temperatura, vento, rajadas, pressão, umidade, sensação térmica e radiação quando esses sensores existirem e estiverem atualizados;
2. **hidrologia regional** — nível e chuva em estações cuja posição e bacia ajudem a entender o sistema Guaíba → Lagoa dos Patos → estuário de Rio Grande e o sistema Lagoa Mirim → Canal São Gonçalo.

A integração não substitui silenciosamente a Estação Laranjal, Embrapa, SACE ou outra fonte já consolidada. Observação, previsão e alerta oficial permanecem semanticamente separados.

## 2. Política de acesso

A decisão de produto vigente está em `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

Para esta integração:

- leituras oficiais adequadas à disseminação pública são destinadas à **camada pública** do Tempo Pelotas;
- não criar paywall Free/PRO para esconder a leitura oficial básica;
- Free e PRO podem futuramente agregar personalização, histórico, comparação, análise e ferramentas próprias, conforme a política de cada dataset;
- exportação em massa, retenção longa ou uso como diferencial comercial continuam sujeitos à governança específica da fonte/dataset;
- atribuição à Defesa Civil RS permanece explícita;
- a integração não deve ser apresentada como parceria, homologação ou chancela institucional.

A feature flag atual é uma proteção **técnica**, não uma regra de monetização: ela permanece desligada até validar inventário, timezone, unidade e referência dos níveis.

## 3. Evidência técnica validada

A documentação pública da Defesa Civil RS informa a API GraphQL:

`https://redehidrometeorologica.defesacivil.rs.gov.br/graphql`

Contratos identificados:

- `Historic` — consulta histórica por estação/período;
- `Tags_data` — consulta filtrada de estações/leituras;
- `Nowcasting` / `nowcasting_unique` — atualização em tempo real via Subscription.

Parâmetros institucionais observados/documentados:

- `system: Qualle_Hidrometeorologia`;
- `client/clients: casa-militar-defesa-civil-rs`;
- códigos de estação no padrão `DCRS-xxxxx`.

O código preparado usa `tags_data`, `clients: ["casa-militar-defesa-civil-rs"]` e filtro de localização para a UF `43` (Rio Grande do Sul).

## 4. Implementação atual no repositório

Arquivos ativos:

- `src/lib/hydrology/defesa-civil-rs.server.ts`;
- `src/lib/hydrology/defesa-civil-rs.functions.ts`;
- `src/components/hydrology/DefesaCivilHydroNetwork.tsx`;
- `src/components/hydrology/DefesaCivilHydroNetwork.css`;
- `src/components/hydrology/DefesaCivilHydroMap.tsx`;
- `src/components/hydrology/DefesaCivilHydroMap.module.css`;
- `src/routes/situacao-hidrologica-pelotas.tsx`;
- `tests/hydrology-overview-page.test.ts`.

Fluxo preparado:

`API GraphQL oficial → adapter server-side → Zod → normalização → recorte regional → cache server-side → /situacao-hidrologica-pelotas`

O navegador não chama a GraphQL institucional diretamente.

### 4.1. Feature flag

Variável server-only:

`DEFESA_CIVIL_HYDRO_ENABLED=false`

Regras:

- ausente ou `false`: o adapter retorna `disabled` sem consultar a API e o componente não renderiza;
- `true`: o runtime pode consultar a API e exibir o bloco público;
- nunca criar `VITE_DEFESA_CIVIL_*`;
- a ativação só deve ocorrer depois da validação técnica descrita neste documento.

### 4.2. Resiliência

O adapter preparado possui:

- timeout por tentativa;
- retry apenas para falhas transitórias;
- validação de schema;
- valores ausentes preservados como `null`, nunca convertidos em zero;
- cache saudável mais longo e cache de falha curto;
- erro da Defesa Civil isolado das demais fontes da página;
- nenhum secret necessário no contrato público atualmente utilizado.

## 5. Campos normalizados na primeira versão

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
- nível do rio quando fornecido.

### Precipitação

- 1 h;
- 3 h;
- 6 h;
- 12 h;
- 24 h;
- 168 h.

### Meteorologia

- temperatura;
- sensação térmica;
- umidade;
- pressão atmosférica;
- radiação solar;
- vento médio;
- vento máximo/rajada;
- direção do vento.

Um campo ausente na estação não é tratado como erro nem como valor zero.

## 6. Recorte regional inicial

O adapter técnico usa raio de até **320 km de Pelotas** e limita o payload da interface a até 36 estações, ordenadas por proximidade.

Esse raio é apenas um recorte de descoberta/apresentação. **Proximidade não significa conexão hidrológica.**

Antes da ativação pública definitiva, as estações precisam ser classificadas por bacia e função.

### Meteorologia

Território de interesse inclui o corredor ao sul de Porto Alegre e entorno da Lagoa dos Patos, como:

- Porto Alegre / Viamão / Itapuã;
- Tapes;
- Arambaré;
- Camaquã / Cristal;
- São Lourenço do Sul;
- Turuçu;
- Canguçu;
- Pelotas / Capão do Leão / Morro Redondo;
- São José do Norte;
- Rio Grande;
- Litoral Médio quando relevante.

A lista é território de interesse e não afirma que exista estação DCRS em cada município.

### Hidrologia

Priorizar somente estações cuja bacia/posição tenha relação física demonstrável com:

- Lago Guaíba e entrada na Lagoa dos Patos;
- Bacia do Camaquã;
- margens/afluentes da Lagoa dos Patos;
- Mirim–São Gonçalo;
- estuário/saída em Rio Grande quando a referência do sensor for adequada.

Nunca comparar níveis absolutos de réguas distintas por simples subtração.

## 7. Semântica pública

A área preparada para `/situacao-hidrologica-pelotas` apresenta:

- nome e código da estação;
- bacia quando informada;
- horário da observação;
- idade calculada da leitura;
- nível/chuva e variáveis meteorológicas disponíveis;
- mapa regional MapLibre;
- links para mapa e documentação oficiais;
- atribuição explícita à Defesa Civil RS.

A recência calculada pelo Tempo Pelotas (`recent`, `delayed`, `old`, `unknown`) informa apenas a idade da observação.

Ela **não representa**:

- estado operacional oficial;
- nível de atenção;
- alerta;
- inundação;
- previsão de cheia.

O bloco deixa explícito que as medições observadas não são transformadas automaticamente em alerta ou previsão de cheia.

## 8. Timestamp e referência vertical

O adapter preserva timestamps com timezone quando fornecidos.

Quando a API enviar data/hora sem offset, a implementação preparada interpreta provisoriamente como horário local do Rio Grande do Sul (`UTC-03:00`). Essa premissa deve ser confirmada antes da ativação pública contínua.

Também deve ser confirmada a semântica/referência vertical de `rio_nivel` por estação.

Até essa validação:

- não criar limiares próprios;
- não transferir cotas de uma régua para outra;
- não afirmar equivalência entre níveis absolutos de estações diferentes.

## 9. Cache e disponibilidade

Configuração preparada:

- resposta saudável: `max-age=120` + `stale-while-revalidate=300`;
- indisponibilidade: cache curto de 20 s;
- integração desabilitada: cache de 300 s;
- timeout: 8 s por tentativa;
- uma repetição para falhas transitórias.

A indisponibilidade da Defesa Civil não derruba a página hidrológica nem altera os dados já existentes de Laranjal, Lagoa, Guaíba e SACE.

## 10. Histórico futuro

O contrato `Historic` poderá alimentar séries específicas depois de validar:

- estação;
- unidade;
- timestamp;
- referência do nível;
- intervalo suportado;
- comportamento de lacunas/correções;
- governança de retenção e exportação.

Histórico oficial básico não deve ser transformado em paywall apenas por ser oficial. O valor Free/PRO deve vir das ferramentas, organização, histórico próprio, comparações e derivados conforme `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

## 11. Segurança

- não versionar HAR bruto;
- não versionar cookies, tokens, headers ou secrets;
- consulta externa somente server-side;
- validar schema e coordenadas;
- não registrar payload integral em logs;
- não expor stack trace ou erro GraphQL bruto ao visitante;
- não transformar ausência de dado em zero;
- popup do mapa usa texto seguro (`setText`), não HTML arbitrário;
- falha da nova fonte permanece isolada.

## 12. Critério para ativar `DEFESA_CIVIL_HYDRO_ENABLED=true`

Antes de ligar em produção pública:

1. validar uma resposta real atual de `tags_data` no runtime;
2. inventariar códigos `DCRS-xxxxx`, nomes, coordenadas e bacias retornadas;
3. identificar capacidades reais de cada estação;
4. confirmar timezone quando o timestamp vier sem offset;
5. confirmar unidade e referência vertical de `rio_nivel`;
6. confirmar que o recorte de apresentação não está incluindo estações hidrologicamente irrelevantes como se fossem contexto direto de Pelotas;
7. testar desktop/mobile e acessibilidade com dados reais;
8. validar que falha/timeout da fonte não afeta as demais fontes da página;
9. atualizar `PROJECT_CURRENT_STATE.md` com a ativação real.

## 13. Próxima etapa

Com a integração técnica estabilizada na `main`, a sequência é:

1. executar o contrato atual contra a API oficial;
2. gerar inventário sanitizado de estações e capacidades;
3. classificar cada estação como `METEOROLOGY`, `HYDROLOGY`, `BOTH` ou `OUT_OF_SCOPE`;
4. reduzir o conjunto público hidrológico para estações com relação física defensável ao sistema acompanhado;
5. ativar a feature flag somente depois das validações acima;
6. incorporar a fonte ao monitoramento de runtime/status após a ativação.
