# Pesquisa CPTEC / INPE — SIGMA

Última consolidação: 18/08/2026.

## Status

**Pesquisa técnica somente. Não integrar ao runtime público do Tempo Pelotas neste momento.**

A retomada foi deliberadamente adiada para novembro/dezembro de 2026, quando será possível rever autorização, condições institucionais e disponibilidade de uso dos produtos.

Os HARs usados nesta pesquisa são materiais privados de diagnóstico e **não devem ser versionados**. Este documento registra apenas contratos, IDs públicos de produto, timestamps observados e conclusões técnicas sanitizadas. Não contém cookies, chaves, tokens ou headers privados.

## Por que esta pesquisa foi preservada

Os HARs do SIGMA/CPTEC ajudaram a validar independentemente o estado dos radares do DECEA e revelaram produtos que podem ser úteis futuramente para o Tempo Pelotas. Mesmo sem integração produtiva agora, a engenharia reversa não precisa ser refeita quando o tema for retomado.

## Arquitetura observada no SIGMA

O frontend do SIGMA usa três etapas relevantes:

1. catálogo de produtos e subprodutos;
2. consulta do arquivo mais recente/histórico por código de subproduto, incluindo chamadas no formato `/logs/{codigo}/{quantidade}` e `/listaSubprod?...`;
3. renderização geográfica por WMS/MapServer em `maps.cptec.inpe.br`, usando `SERVICE=WMS`, `REQUEST=GetMap`, PNG transparente e `CRS=EPSG:3857`.

Os metadados de produto observados incluem `filePath`, `fileDate`, `fileTime`, `description` e uma URL do repositório de imagens do CPTEC.

Não implementar esses contratos no portal público sem nova avaliação de autorização e termos de uso.

## Radares observados

### Canguçu / RS

- Código SIGMA: `4962`.
- Produto: CAPPI 3 km.
- Descrição observada: radar de Canguçu / RS — CAPPI (3 km).
- No HAR capturado em 18/08/2026, o arquivo mais recente recuperado era de **08/08/2026 00:10**.

Essa evidência é coerente com a REDEMET no mesmo período, que devolvia Canguçu cadastrado porém com `path` e timestamp nulos. Portanto a ausência de Canguçu no Tempo Pelotas não era apenas um problema de parsing local.

### Santiago / RS

- Código SIGMA: `4965`.
- Produto: CAPPI 3 km.
- No HAR capturado em 18/08/2026, havia arquivo atualizado em **18/08/2026 01:20**.
- A REDEMET também mostrava Santiago operacional no mesmo período.

O SIGMA foi usado somente como evidência independente de disponibilidade. A produção atual continua usando REDEMET/DECEA, conforme `docs/REDEMET_OPERATIONS.md`.

### Vento de Santiago

- Código observado: `8323`.
- Produto: PPI de vento do radar de Santiago.
- Quadro observado em 18/08/2026 01:10.

Este produto é candidato de pesquisa futura, não fonte atual do portal.

## Satélite GOES-19

Produtos ativos identificados no catálogo:

| Código | Produto |
| ---: | --- |
| 1102 | Visível |
| 1113 | Infravermelho |
| 1222 | Realçada |
| 1221 | VIS + IR |

O HAR confirmou que o SIGMA obtém o arquivo mais recente do repositório CPTEC e o transforma em tiles WMS 256×256 para o mapa.

A REDEMET já fornece as camadas de satélite necessárias ao Tempo Pelotas; portanto não há justificativa operacional para duplicar essa dependência agora.

## Descargas elétricas GLM

- Código: `2305`.
- Produto: acumulado de 5 minutos / densidade de grupos GLM.
- Quadro observado em 18/08/2026 01:15.
- Renderização observada por WMS em EPSG:3857.

Uso potencial futuro: complementar o STSC da REDEMET com uma segunda visão oficial de atividade elétrica. Não integrar antes da revisão institucional.

## Precipitação por satélite — Hidroestimador

Produtos identificados:

- `6353` — estimativa instantânea; no HAR havia quadro em 18/08/2026 01:10;
- `6354` — acumulado 24 horas, listado como produto ativo no catálogo;
- `8289` — acumulado 48 horas, aparecia como inativo no catálogo analisado.

Uso potencial futuro: apoio visual à página de chuva e comparação com radar/observações. Não usar como substituto automático de medição pluviométrica local.

## FORTRACC / nowcasting convectivo

Produtos observados no HAR:

| Código | Horizonte |
| ---: | --- |
| 6891 | previsão +30 min |
| 6892 | previsão +60 min |
| 6893 | previsão +90 min |
| 6894 | previsão +120 min |

Os quatro produtos observados pertenciam ao ciclo de 18/08/2026 01:10.

Potencial futuro: contexto de deslocamento de sistemas convectivos em curto prazo. Deve ser apresentado como produto específico do CPTEC/INPE, com timestamp e metodologia próprios, nunca como previsão determinística do Tempo Pelotas.

## Outros produtos observados

Também apareceram no material de pesquisa:

- classificação de nuvens;
- produto de nevoeiro;
- composições RGB GOES-19, incluindo microfísica, cor natural, massa de ar, poeira, cinzas, tipo/fase de nuvem e tempestade convectiva.

Esses produtos ficam fora do backlog prioritário enquanto REDEMET, Embrapa e INMET cobrirem as necessidades centrais do portal.

## Estratégia quando a pesquisa for retomada

Antes de qualquer integração em novembro/dezembro de 2026:

1. confirmar por escrito as condições de uso e reprodução dos produtos no portal;
2. revalidar se os endpoints e códigos continuam ativos;
3. gerar novos HARs sem versionar credenciais/cookies;
4. conferir timestamps e latência de Canguçu e Santiago;
5. decidir se a integração deve consumir metadados, arquivos diretos ou WMS;
6. criar allowlist explícita de hosts CPTEC/INPE;
7. manter todo acesso server-side quando houver qualquer credencial;
8. adicionar cache, timeout, estado de indisponibilidade e testes de contrato;
9. atribuir claramente CPTEC/INPE e o produto utilizado na interface;
10. fazer implantação isolada, sem substituir a REDEMET antes de validação comparativa.

## Prioridade futura sugerida

Se houver autorização, a ordem de valor para o Tempo Pelotas seria:

1. CAPPI Canguçu/Santiago como redundância e verificação de frescor;
2. GLM de 5 minutos para atividade elétrica;
3. Hidroestimador instantâneo/24 h para contexto de precipitação;
4. FORTRACC 30–120 min para nowcasting convectivo;
5. PPI de vento de Santiago;
6. produtos especializados de nuvem/nevoeiro/RGB.

## Regra atual

Até a retomada formal desta pesquisa:

- nenhum endpoint CPTEC/SIGMA deve ser dependência do build ou runtime;
- nenhum raster/WMS do CPTEC deve aparecer no portal público;
- nenhum HAR deve ser incluído no Git;
- nenhuma conclusão desta pesquisa deve alterar a atribuição das fontes atuais;
- os dados SIGMA podem ser usados apenas como referência histórica para entender o comportamento observado em agosto de 2026.

Fonte operacional atual: `docs/REDEMET_OPERATIONS.md`.
