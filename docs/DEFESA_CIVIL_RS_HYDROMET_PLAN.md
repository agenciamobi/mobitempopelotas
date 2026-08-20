# Defesa Civil RS — plano de integração hidrometeorológica

Última consolidação: 20/08/2026  
Estado: **pesquisa técnica / inventário de estações pendente**  
Runtime público: **não integrado ainda**

## 1. Objetivo

Usar a Rede de Monitoramento Hidrometeorológico da Defesa Civil do Rio Grande do Sul como nova fonte institucional regional para ampliar o Tempo Pelotas em dois eixos distintos:

1. **meteorologia regional** — aproveitar estações com chuva, temperatura, vento, rajadas, pressão, umidade, sensação térmica e radiação na região de interesse;
2. **hidrologia conectada ao sistema de Pelotas** — usar somente estações de nível e chuva cuja posição hidrológica ajude a entender água que entra, circula ou sai do sistema Guaíba → Lagoa dos Patos → estuário de Rio Grande, além de Lagoa Mirim → Canal São Gonçalo.

A seleção hidrológica não será feita apenas por proximidade geográfica. Uma estação só entra como contexto hidrológico quando sua bacia, rio ou posição de orla tiver relação física relevante com o sistema acompanhado.

## 2. Evidência técnica já validada

A documentação pública da Defesa Civil RS informa uma API GraphQL operacional em:

`https://redehidrometeorologica.defesacivil.rs.gov.br/graphql`

O material analisado em 20/08/2026 confirma que o frontend oficial utiliza o mesmo domínio e trabalha com três contratos principais:

- `Historic` — consulta histórica por estação, período e intervalo;
- `Tags_data` — consulta filtrada por estação/localização;
- `Nowcasting` / `nowcasting_unique` — atualização em tempo real por Subscription WebSocket.

Parâmetros institucionais observados/documentados:

- `system: Qualle_Hidrometeorologia`;
- `client/clients: casa-militar-defesa-civil-rs`;
- códigos de estação no padrão `DCRS-xxxxx`.

O HAR analisado capturou navegação real, entre outras, para as estações `DCRS-00125` e `DCRS-00088`. Esse arquivo não preservou payload suficiente para associar com segurança esses dois códigos às respectivas cidades. A associação código → estação → município só será versionada depois de obter o inventário completo da rede.

## 3. Campos úteis da API

A estrutura publicada e o bundle capturado mostram suporte aos seguintes grupos de dados por estação, conforme os sensores disponíveis:

### Identidade e geografia

- código;
- nome geral/local;
- timestamp;
- latitude;
- longitude;
- bacia;
- região;
- altitude.

### Hidrologia

- nome do rio;
- nível do rio, em metros;
- tendência do nível;
- área de drenagem;
- flag indicando se a estação possui nível de rio.

### Precipitação

- acumulados de chuva em múltiplas janelas;
- janelas documentadas incluem 5 min, 10 min, 15 min, 30 min, 1 h, 3 h, 6 h, 12 h, 24 h e até 168 h, dependendo da consulta/campo disponível;
- unidade: milímetros.

### Meteorologia

- temperatura;
- máxima/mínima/média quando disponível;
- umidade relativa;
- pressão atmosférica e tendência;
- sensação térmica;
- radiação solar;
- velocidade média do vento;
- velocidade máxima/rajada;
- direção do vento.

### Capacidade e qualidade

O payload possui flags/campos que permitem identificar se a estação dispõe de:

- chuva acumulada;
- nível do rio;
- pressão atmosférica;
- umidade;
- vento;
- outros sensores do contrato.

A integração não deve exibir um campo como indisponível por erro quando a própria estação não possui aquele sensor.

## 4. Bacias prioritárias para o Tempo Pelotas

O mapa oficial lista, entre outras, as bacias abaixo. Para a expansão ao sul, a primeira fase deve priorizar:

1. **Lago Guaíba** — contexto de entrada de água no sistema da Lagoa dos Patos;
2. **Camaquã** — contribuição fluvial relevante para a Lagoa dos Patos;
3. **Litoral Médio** — estações costeiras e da margem leste/nordeste úteis principalmente para meteorologia e, quando houver conexão hídrica demonstrável, para hidrologia;
4. **Mirim São Gonçalo** — prioridade direta para Pelotas por conectar Lagoa Mirim e Canal São Gonçalo.

O inventário final deve ser baseado no campo `position.bacia` da API e na conectividade real dos cursos d'água, não em categorias criadas manualmente pelo frontend.

## 5. Regra de cobertura geográfica

### Meteorologia

Para meteorologia, interessa praticamente todo o corredor mostrado no mapa oficial ao sul de Porto Alegre e no entorno da Lagoa dos Patos, desde que a estação possua sensores meteorológicos válidos e leitura recente.

O catálogo deve considerar estações representativas de áreas como:

- Porto Alegre;
- Viamão / Itapuã;
- Tapes;
- Arambaré;
- Camaquã;
- Cristal;
- São Lourenço do Sul;
- Turuçu;
- Canguçu;
- Pelotas;
- Capão do Leão;
- Morro Redondo;
- São José do Norte;
- Rio Grande;
- Mostardas e outras estações do Litoral Médio relevantes ao cenário regional.

A lista acima é **território de interesse**, não afirma que exista uma estação DCRS em cada município.

### Hidrologia

Para hidrologia, filtrar somente:

- estações do Guaíba que ajudam a acompanhar a água que entra na Lagoa;
- estações em rios/afluentes da Bacia do Camaquã que desembocam na Lagoa dos Patos;
- estações de orla ou cursos d'água diretamente relacionados à Lagoa dos Patos;
- estações da bacia Mirim São Gonçalo que drenam para a Lagoa Mirim ou Canal São Gonçalo;
- pontos do estuário e saída em Rio Grande quando o sensor e a referência forem adequados.

Não incluir como contexto hidrológico uma estação apenas porque fica próxima de Pelotas ou da Lagoa se a drenagem seguir para outro sistema.

## 6. Arquitetura proposta

### 6.1. Conector server-side

Criar um módulo dedicado, por exemplo:

- `src/lib/defesa-civil-rs/defesa-civil-rs.server.ts`;
- `src/lib/defesa-civil-rs/defesa-civil-rs.functions.ts`;
- `src/lib/defesa-civil-rs/defesa-civil-rs.types.ts`;
- `src/lib/defesa-civil-rs/station-catalog.ts`.

O navegador não deve consultar diretamente a GraphQL institucional.

### 6.2. Estratégia inicial de coleta

Primeira versão recomendada:

1. usar consulta HTTP GraphQL server-side para inventário/estado das estações;
2. normalizar somente os campos necessários;
3. cache curto com revalidação;
4. persistir snapshots selecionados quando houver necessidade de histórico próprio;
5. usar `Historic` para séries específicas, com cache e limites de período;
6. deixar Subscription WebSocket como etapa posterior.

Motivo: o runtime atual do portal deve continuar funcionando de forma previsível mesmo se a hospedagem não garantir uma conexão WebSocket server-side longa e permanente. O WebSocket pode ser incorporado depois de validado no ambiente de produção.

### 6.3. Modelo normalizado

Estrutura conceitual:

```ts
type DefesaCivilRsStation = {
  code: string;
  name: string;
  localName: string | null;
  municipality: string | null;
  basin: string | null;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  riverName: string | null;
  drainageArea: number | null;
  capabilities: {
    rainfall: boolean;
    riverLevel: boolean;
    temperature: boolean;
    wind: boolean;
    pressure: boolean;
    humidity: boolean;
  };
};
```

A observação deve ficar separada do cadastro da estação para evitar misturar metadado relativamente estável com leitura em tempo real.

## 7. Onde os dados serão usados

### Home `/`

A Home continua simples. Não transformar a primeira página em painel de dezenas de estações.

Usos permitidos:

- poucas referências regionais selecionadas na seção de águas;
- contexto regional de chuva/vento quando trouxer informação realmente útil;
- link para a visão completa.

A estação Laranjal continua como referência local principal do bloco de nível. A Defesa Civil RS entra como contexto, não como substituição silenciosa.

### `/situacao-hidrologica-pelotas`

Será a principal página para a expansão hidrológica.

Organização prevista:

1. **Entrada pelo Guaíba** — pontos de Porto Alegre/Viamão relevantes;
2. **Bacia do Camaquã** — rios que contribuem para a Lagoa dos Patos;
3. **Lagoa dos Patos / margens** — estações de orla e afluentes relevantes;
4. **Mirim São Gonçalo** — Lagoa Mirim, Canal São Gonçalo e afluentes;
5. **Estuário / Rio Grande** — leitura da saída do sistema quando disponível.

Para cada ponto, priorizar:

- horário;
- tendência;
- nível com sua unidade/referência;
- chuva recente quando útil;
- fonte;
- estado de atualização.

Nunca comparar níveis absolutos de réguas distintas por simples subtração.

### `/nivel-da-lagoa-dos-patos-laranjal`

- manter o dado local do Laranjal como protagonista;
- adicionar apenas contexto regional relevante;
- não trocar automaticamente a origem da leitura principal;
- não importar cota/limiar de outra régua para o Laranjal.

### `/chuva-em-pelotas`

Possível uso:

- acumulado regional em estações reais;
- 1 h, 3 h, 6 h, 12 h, 24 h e 7 dias quando disponíveis;
- comparação espacial simples entre Pelotas, Serra dos Tapes/Canguçu, Camaquã e margens da Lagoa.

As cores usadas pelo mapa/gráfico da Defesa Civil **não devem ser convertidas em limiares de alerta**. O próprio portal oficial informa que essas cores não correspondem a limiares de alertas.

### `/vento-em-pelotas`

Possível uso:

- observações de vento em estações regionais selecionadas;
- comparação entre Pelotas, margens da Lagoa e estuário;
- contexto para explicar represamento, empilhamento ou favorecimento do escoamento da Lagoa, sem transformar correlação em previsão automática.

### `/tempo-na-regiao-sul-rs` e páginas regionais

- associar, após inventário, uma ou mais estações oficiais próximas/representativas;
- mostrar observação real somente quando o sensor existir e estiver atualizado;
- preservar claramente a fonte Defesa Civil RS;
- previsão continua separada de observação.

### `/estacao-embrapa-pelotas`

A Defesa Civil RS não substitui a Embrapa como referência meteorológica local já consolidada no portal.

Uso possível futuro:

- comparação contextual de estações;
- verificação de coerência regional;
- nenhuma fusão silenciosa entre sensores diferentes.

### `/status-dos-dados`

Adicionar a integração como serviço próprio quando o runtime estiver ativo:

- disponibilidade da API;
- quantidade de estações selecionadas com leitura recente;
- atraso máximo/mediano;
- incidentes de indisponibilidade;
- manutenção quando conhecida.

Uma estação individual offline não deve necessariamente marcar toda a API como offline.

### `/enchente-2024-pelotas-laranjal`

A API histórica poderá enriquecer a página somente se o período de 2024 existir de fato no backend e as referências das estações forem validadas. Não assumir retenção histórica retroativa sem consultar a API.

## 8. Semântica visual

Para níveis:

- subida, descida e estabilidade usam o mesmo sistema visual já adotado na Home;
- fundo suave nos pontos regionais;
- seta + texto para não depender apenas da cor;
- valores principais podem usar a versão sólida da mesma família cromática.

Para chuva:

- usar escala de intensidade/quantidade somente como visualização de acumulado;
- não chamar amarelo/laranja/vermelho de alerta sem um aviso oficial correspondente.

Avisos oficiais continuam pertencendo ao INMET/Defesa Civil quando formalmente emitidos, sempre com sua fonte e classificação próprias.

## 9. Governança e uso institucional

A documentação pública informa que a API é disponibilizada pela Defesa Civil RS em parceria com a MKS e orienta consultar as condições de uso antes de empregar os dados em produções públicas ou comerciais.

Portanto, até validação institucional específica:

- estado de governança: `REVIEW`;
- podemos pesquisar, documentar e preparar o conector;
- não apresentar a integração como parceria, homologação ou chancela;
- confirmar condições de redistribuição, cache, histórico e uso comercial antes de ativar novos diferenciais pagos;
- preservar atribuição visível à Defesa Civil RS.

## 10. Segurança

- não versionar HAR bruto;
- não versionar cookies, headers ou tokens eventualmente encontrados em diagnóstico;
- não expor detalhes desnecessários do cliente GraphQL no frontend;
- chamadas externas devem ocorrer server-side;
- aplicar timeout, cache, validação de schema e fallback;
- logs devem ser sanitizados;
- falha da nova fonte não pode derrubar a Home nem as páginas hidrológicas existentes.

## 11. Próxima sessão — inventário completo

Quando houver nova captura completa do frontend oficial:

1. extrair todos os códigos `DCRS-xxxxx` presentes no payload;
2. associar código, nome/local, coordenadas e bacia;
3. identificar capacidades reais de cada estação;
4. separar em `METEOROLOGY`, `HYDROLOGY`, `BOTH` ou `OUT_OF_SCOPE`;
5. validar município por nome/coordenada sem adivinhar;
6. produzir catálogo sanitizado no repositório;
7. selecionar o primeiro conjunto para produção.

Tabela alvo do inventário:

| Código | Local/município | Bacia | Chuva | Nível | Vento | Uso no Tempo Pelotas |
| --- | --- | --- | --- | --- | --- | --- |
| `DCRS-xxxxx` | a validar | a validar | sim/não | sim/não | sim/não | METEO / HIDRO / AMBOS / FORA |

## 12. Critério para iniciar implementação pública

Não iniciar a exposição pública da nova rede até termos:

- catálogo de estações selecionadas;
- bacias conferidas;
- unidades conferidas;
- timestamps e timezone validados;
- regra de atualização/atraso definida;
- comportamento de falha/fallback testado;
- condições de uso revisadas;
- fonte/atribuição definida;
- testes de contrato do parser;
- atualização de `PROJECT_CURRENT_STATE.md` para o estado real da integração.
