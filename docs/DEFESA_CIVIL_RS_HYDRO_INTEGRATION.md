# Defesa Civil RS — Rede de Monitoramento Hidrometeorológico

Última consolidação: 20/08/2026.

Este documento registra a integração técnica do Tempo Pelotas com a API pública GraphQL da Rede de Monitoramento Hidrometeorológico da Defesa Civil do Estado do Rio Grande do Sul.

## Estado atual

- A Defesa Civil RS publica documentação pública da API GraphQL em `https://sistemas.defesacivil.rs.gov.br/api-redehidrometeorologica`.
- O endpoint documentado é `https://redehidrometeorologica.defesacivil.rs.gov.br/graphql`.
- A documentação descreve dados de chuva, nível de rios, temperatura, vento, pressão atmosférica, radiação solar, umidade e sensação térmica.
- O adapter server-side e a área visual do Tempo Pelotas estão implementados.
- A publicação das leituras permanece protegida pela variável server-only `DEFESA_CIVIL_HYDRO_ENABLED`.
- O default seguro é `false`.
- A documentação oficial orienta consultar a equipe responsável sobre as condições de uso antes de utilizar os dados em produções públicas ou comerciais. Por esse motivo, o recurso não deve ser habilitado em produção até a validação institucional dessa condição.

## Objetivo no Tempo Pelotas

A Rede da Defesa Civil complementa o domínio de hidrologia já existente, sem substituir silenciosamente nenhuma fonte atual.

Uso pretendido:

- apresentar estações próximas de Pelotas e da Zona Sul;
- preservar código, posição, bacia e horário de cada estação;
- exibir nível, chuva e variáveis meteorológicas quando entregues pela estação;
- mostrar a idade da observação sem converter isso em situação de risco;
- permitir leitura geográfica por mapa;
- manter links claros para o mapa oficial e para a documentação da API.

A integração não deve:

- transformar leitura observada em alerta oficial;
- inferir cheia, inundação, atenção ou normalidade quando a API não fornecer uma classificação oficial aplicável;
- comparar níveis absolutos de estações diferentes como se compartilhassem a mesma referência vertical;
- substituir a Estação Laranjal ou qualquer outra fonte operacional sem validação específica;
- sugerir parceria, homologação ou endosso institucional ao Tempo Pelotas.

## Arquitetura

Fluxo atual:

`API GraphQL Defesa Civil RS → adapter server-side → normalização → recorte regional → createServerFn/cache → página de situação hidrológica`

Arquivos principais:

- `src/lib/hydrology/defesa-civil-rs.server.ts`;
- `src/lib/hydrology/defesa-civil-rs.functions.ts`;
- `src/components/hydrology/DefesaCivilHydroNetwork.tsx`;
- `src/components/hydrology/DefesaCivilHydroMap.tsx`;
- `src/routes/situacao-hidrologica-pelotas.tsx`.

O navegador nunca consulta diretamente o endpoint GraphQL. A consulta é feita exclusivamente pelo runtime do servidor do Tempo Pelotas.

## Contrato utilizado

O adapter foi construído a partir do exemplo público `tags_data` da documentação oficial. A consulta solicita estações no Rio Grande do Sul usando:

- client: `casa-militar-defesa-civil-rs`;
- filtro de localização para UF `43`;
- campos documentados em `qualle_meteorologia`.

Campos normalizados quando disponíveis:

- `codigo`;
- `name`;
- `timestamp`;
- latitude, longitude, altitude, bacia e região;
- nível do rio e nome do rio;
- chuva acumulada em 1 h, 3 h, 6 h, 12 h, 24 h e 168 h;
- temperatura;
- sensação térmica;
- umidade;
- pressão atmosférica;
- radiação solar;
- vento médio, máximo e direção.

O schema é validado com Zod e aceita valores numéricos transmitidos como número ou string. Respostas fora do contrato esperado resultam em estado `unavailable`, sem dados inventados.

## Recorte regional

O adapter calcula a distância geográfica entre cada estação retornada e Pelotas.

Regra inicial:

- raio: até 320 km de Pelotas;
- ordenação: estação mais próxima primeiro;
- limite de payload para a interface: 36 estações;
- lista visual: até 18 estações por carregamento.

O raio é apenas um recorte de apresentação. Ele não significa influência hidrológica direta sobre Pelotas.

## Recência

A interface calcula a idade da observação somente para transparência de atualização:

- `recent`: até 30 minutos;
- `delayed`: mais de 30 minutos e até 3 horas;
- `old`: mais de 3 horas;
- `unknown`: horário ausente ou inválido.

Essas categorias são internas do Tempo Pelotas e **não representam classificação oficial da Defesa Civil**.

## Timestamp

Quando o timestamp já contém timezone/offset, ele é preservado semanticamente e convertido para ISO.

Quando a API retornar data/hora sem offset, o adapter interpreta o valor como horário local do Rio Grande do Sul (`UTC-03:00`) para normalização. Essa premissa deve ser confirmada com a equipe técnica antes de habilitar a publicação contínua em produção.

## Cache e disponibilidade

- resposta saudável: cache público de 120 s, com `stale-while-revalidate`;
- indisponibilidade: cache de 20 s para permitir nova tentativa rápida;
- integração desabilitada: cache de 300 s;
- timeout por tentativa: 8 s;
- uma repetição é permitida para falhas transitórias, como HTTP 429 e 5xx.

A indisponibilidade da Defesa Civil não bloqueia a página hidrológica. As fontes já existentes continuam independentes.

## Feature flag

Variável:

`DEFESA_CIVIL_HYDRO_ENABLED=false`

Regras:

- server-only;
- nunca usar prefixo `VITE_`;
- `false` ou variável ausente: o server function retorna `disabled` e a área visual não é renderizada;
- `true`: o runtime consulta a API e a área pode aparecer na página hidrológica.

Ativação em produção somente após validar as condições de uso indicadas pela própria documentação pública.

## Atribuição pública

Formulação utilizada na interface quando habilitada:

> Dados originados na Rede de Monitoramento Hidrometeorológico e disponibilizados pela Defesa Civil do Estado do Rio Grande do Sul. O Tempo Pelotas atua como interface independente de consulta e não substitui os canais oficiais de alerta e orientação da Defesa Civil.

Links de atribuição:

- mapa oficial da Rede;
- documentação pública da API.

## Próximas validações antes da ativação

1. receber orientação da Defesa Civil RS sobre as condições de uso público/comercial;
2. confirmar se `tags_data` sem uma lista explícita de `station` é o contrato recomendado para descoberta das estações da UF;
3. validar resposta real do endpoint no runtime do Lovable;
4. confirmar timezone do `timestamp`;
5. confirmar semântica de `rio_nivel` e de sua referência vertical por estação;
6. confirmar eventuais limites de requisição;
7. validar quais estações da Zona Sul possuem nível, chuva e variáveis meteorológicas;
8. executar inspeção mobile/desktop e acessibilidade com dados reais;
9. somente então alterar `DEFESA_CIVIL_HYDRO_ENABLED=true` no ambiente de produção.

## Evoluções futuras

Depois da ativação e validação do contrato:

- histórico por estação via query `historic`;
- gráfico de chuva e nível por estação;
- filtros por variável, bacia e distância;
- persistência opcional de snapshots para reduzir dependência da API em picos de acesso;
- uso das estações como contexto regional em páginas de cidades, sem duplicar dados ou semânticas;
- monitoramento de contrato e freshness no runtime smoke.

## Segurança

- nenhum secret é necessário no contrato público documentado atualmente;
- mesmo assim, a integração permanece server-side para controlar cache, schema, timeout, payload e atribuição;
- não registrar payload integral em logs;
- não expor stack trace ou erro bruto GraphQL para a interface;
- não transformar erro/ausência de dado em zero;
- nunca tratar API pública como autorização implícita de redistribuição quando a documentação pede validação das condições de uso.
