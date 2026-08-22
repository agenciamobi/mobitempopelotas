# Defesa Civil RS — inventário regional de estações

Data do checkpoint: 22/08/2026  
Fonte: Rede de Monitoramento Hidrometeorológico da Defesa Civil RS  
Recorte do Tempo Pelotas: até 320 km de Pelotas, limitado a 36 estações por proximidade  
Estado: **mecanismo de inventário implantado; fotografia nominal sanitizada pendente de consulta real validada**

## Objetivo

Registrar uma fotografia auditável das estações `DCRS-xxxxx` efetivamente retornadas para o recorte regional do Tempo Pelotas, sem hardcode, sem inferir sensores pelo nome da estação e sem versionar payload bruto da API.

## O que já está implantado

O adapter server-side preserva, quando a resposta fornece:

- código, nome, bacia, região, coordenadas e horário;
- distância aproximada até Pelotas calculada pelo portal;
- indicadores de capacidade recebidos em `filter.relacao`;
- nível e nome do rio;
- tendência textual do nível;
- área de drenagem como valor interno ainda sem unidade pública afirmada;
- acumulados de chuva de 1 h, 3 h, 6 h, 12 h, 24 h, 48 h, 72 h, 96 h, 120 h, 144 h e 168 h;
- temperatura, sensação térmica, umidade, pressão, radiação e vento quando disponíveis.

Cada estação é classificada dinamicamente como:

- `HYDROLOGY`;
- `METEOROLOGY`;
- `BOTH`;
- `UNKNOWN`.

A classificação descreve capacidade de dados. Não representa alerta, risco, estado operacional nem relevância hidrológica automática para Pelotas.

## Endpoint sanitizado para validação

O Tempo Pelotas possui a rota server-side:

`/api/defesa-civil/stations`

Ela retorna apenas o inventário regional normalizado necessário à transparência e às ferramentas do portal, com cache curto e `noindex`.

Não expõe:

- cookies;
- tokens;
- headers internos;
- secrets;
- payload GraphQL bruto;
- credenciais;
- logs de infraestrutura.

## Fotografia nominal

A lista nominal **não foi preenchida neste checkpoint porque uma resposta real do novo endpoint ainda não foi capturada e validada por esta sessão após a publicação**.

Isso é deliberado: não serão inventados códigos, nomes, capacidades, bacias ou sensores para completar a documentação.

Quando a consulta real for confirmada, registrar nesta seção para cada estação:

| Código | Estação | Bacia | Região | Distância de Pelotas | Classificação | Capacidades observadas |
| --- | --- | --- | --- | ---: | --- | --- |
| _pendente de captura real_ | — | — | — | — | — | — |

## Critério para preencher a tabela

A tabela só pode ser atualizada a partir da resposta real sanitizada do runtime. Antes de registrar:

1. confirmar que a API respondeu sem erro GraphQL;
2. confirmar que os campos adicionais solicitados continuam aceitos pelo schema efetivamente servido;
3. descartar coordenadas inválidas e timestamps futuros incompatíveis conforme o adapter;
4. usar a classificação calculada pelo próprio adapter;
5. não inferir conexão hidrológica apenas por proximidade;
6. não copiar payload integral nem metadados desnecessários para o repositório.

## Governança

A leitura oficial básica permanece pública e recebe créditos à Defesa Civil RS, Casa Militar do Estado do Rio Grande do Sul e MKS conforme a documentação da fonte.

O valor comercial do Tempo Pelotas deve ser construído em organização, histórico autorizado, comparações, indicadores, personalização, análises e demais ferramentas próprias — não em esconder a leitura oficial básica atrás de paywall.
