# Tempo Pelotas — direção definitiva da homepage

Última atualização: 18/08/2026  
Branch operacional: `main`

## 1. Definição

A homepage do Tempo Pelotas deve ser tratada como um **portal meteorológico editorial orientado a dados**, e não como dashboard, landing page SaaS, vitrine retail ou site institucional genérico.

A linguagem visual combina:

- **Data Journalism** — hierarquia, leitura rápida, números claros, contexto e fonte;
- **Civic Tech** — utilidade pública, transparência, acessibilidade e estados confiáveis;
- **Local Identity** — fotografia, território, fontes e referências reais de Pelotas e da Zona Sul;
- **Local First** — a prioridade editorial é determinada pela utilidade para Pelotas, não pela quantidade de dados disponível.

Princípios permanentes:

> **Information First.** O dado vem antes do componente.
>
> **Source Visible.** Fonte, horário e natureza do dado devem ser compreensíveis.
>
> **Progressive Depth.** A Home resume; páginas públicas aprofundam; o PRO compara, cruza e interpreta.
>
> **Cards somente quando representarem uma unidade real de informação ou interação.**

## 2. Papel da homepage pública

A Home deve permitir que uma pessoa responda rapidamente:

1. como está o tempo agora;
2. se vai chover e em qual janela;
3. se existe alerta oficial;
4. como está a Lagoa dos Patos no Laranjal;
5. onde encontrar radar, satélite, medições e detalhes.

A Home não deve tentar exibir toda a capacidade técnica do sistema.

Arquitetura de profundidade:

- **Home:** resposta rápida e contexto;
- **página temática pública:** aprofundamento do assunto;
- **Tempo Pelotas PRO:** comparação, histórico ampliado, personalização, análise e inteligência.

## 3. Ordem definitiva da Home

### 3.1. Header editorial

Header compacto, plano e discreto. A navegação não deve parecer cápsula de produto SaaS.

Conta e futuro acesso ao PRO podem existir sem transformar o header em peça comercial.

### 3.2. Hero — Agora em Pelotas

Direção: **Magazine / Broadcast**.

Prioridades:

- fotografia real de Pelotas ou câmera do Laranjal quando realmente ao vivo;
- temperatura atual dominante;
- condição atual;
- horário da medição;
- fonte da observação;
- mínima/máxima;
- chance de chuva;
- vento;
- poucas próximas horas como apoio.

Umidade, pressão e demais detalhes não precisam competir na primeira dobra; permanecem em páginas e seções apropriadas.

### 3.3. Alerta oficial

Só ganha grande prioridade quando houver aviso oficial aplicável a Pelotas.

Não preencher o topo da página com caixas genéricas de normalidade ou orientações permanentes. Conteúdo preventivo continua disponível na rota de alertas.

Alertas oficiais nunca dependem de IA.

### 3.4. Índice da página

Navegação editorial simples por âncoras:

`Previsão · Radar e satélite · Medições locais · Situação das águas · Mais informações`

Sem numeração visual, sem card, sem descrição longa.

### 3.5. Próximas horas + tendência

Direção: **Data Journalism**.

Mostrar:

- linha temporal das próximas horas;
- temperatura;
- chance de chuva;
- rajadas relevantes;
- maior chance de chuva com destaque tipográfico;
- tendência dos próximos dias logo abaixo.

Evitar card individual como unidade básica de cada hora ou dia.

Astronomia permanece como informação secundária integrada ao bloco.

### 3.6. Previsão oficial do INMET

Direção: **Data Journalism Premium**.

Preservar:

- um período principal em maior destaque;
- próximos períodos organizados em sequência;
- síntese oficial;
- temperatura, umidade e vento;
- distinção clara entre previsão oficial e medição observada;
- fonte e estação de referência.

Visual:

- superfície contínua;
- tipografia forte;
- linhas finas somente quando organizarem a leitura;
- pouca ou nenhuma sombra;
- cyan usado como sinal editorial;
- métricas alinhadas tipograficamente;
- sem pill/card decorativo desnecessário.

### 3.7. Radar e satélite

Direção: **Civic Tech / Scientific**.

Mapa e imagem são protagonistas. A Home deve manter controles essenciais; análise e camadas avançadas ficam para páginas dedicadas e, futuramente, PRO.

Sempre exibir fonte, horário e estado de disponibilidade.

### 3.8. Medição local — Embrapa

Direção: **Civic Tech editorial**.

Responder principalmente: **o que está sendo realmente medido em Pelotas agora?**

Prioridade:

- temperatura observada;
- umidade;
- vento;
- chuva do dia;
- horário e fonte.

Outras métricas permanecem na página dedicada da estação.

### 3.9. Lagoa dos Patos

Direção: **Civic Tech local**.

Laranjal é a referência principal da Home:

- nível atual;
- subindo / baixando / estável;
- mudança em 6 horas;
- mudança em 24 horas;
- última leitura.

A rede regional deve aparecer de forma resumida na Home. A visão densa/completa pertence a `/situacao-hidrologica-pelotas`.

### 3.10. Tempo Pelotas PRO

Reservar posição natural na arquitetura, mas manter desligado até o produto estar pronto.

Quando ativado, o bloco deve explicar valor, não bloquear informação pública:

- comparação de modelos;
- históricos ampliados;
- alertas personalizados;
- análises e interpretação;
- camadas adicionais.

### 3.11. Explore o Tempo Pelotas

Diretório editorial de conteúdo, não conjunto de cards promocionais.

Categorias principais:

- Previsão;
- Chuva e vento;
- Monitoramento;
- Águas e fontes.

Usar divisores, headings e links internos para distribuir tráfego às páginas públicas detalhadas.

### 3.12. Entenda os dados

Fechamento editorial explicando de forma simples a diferença entre:

- observação;
- previsão;
- aviso oficial;
- radar e satélite.

Deve apontar para metodologia e transparência das fontes.

### 3.13. Footer

Editorial e funcional. Não repetir toda a Home.

## 4. Sistema visual

### 4.1. Canvas

- fundo neutro levemente quente/frio conforme contraste necessário;
- superfícies brancas apenas quando a estrutura pedir;
- grandes seções separadas por espaço, tipografia ou hairlines;
- sombras excepcionais;
- gradientes concentrados no Hero quando necessários para legibilidade da fotografia.

A política de canvas aberto é parte da arquitetura, não apenas um refinamento cosmético: Hero, avisos oficiais, mapa e controles interativos podem justificar contenção; previsão, medição local, águas, diretório e metodologia devem preferir página aberta, grid, espaço e hairlines.

### 4.2. Cor

- navy: texto e estrutura institucional;
- cyan: assinatura e sinal editorial;
- azul: chuva/água quando semanticamente útil;
- amarelo/laranja/vermelho: somente estados de atenção, risco ou alerta.

Cor nunca deve ser a única forma de comunicar estado.

### 4.3. Tipografia

Manter a base sans-serif atual. A aparência editorial deve vir de:

- escala;
- peso;
- grid;
- espaço;
- alinhamento;
- regras finas;
- composição.

Não adicionar nova família tipográfica nesta etapa.

### 4.4. Grid

Desktop:

- base de 12 colunas;
- áreas amplas entre aproximadamente 1240 e 1360 px;
- texto editorial em largura menor;
- Hero/mapa podem usar área mais larga.

Mobile é uma composição própria, não desktop comprimido.

## 5. IA

Nenhum novo elemento da Home deve depender de chamada de IA por pageview.

Weather AI existente pode permanecer como snapshot controlado server-side, mas:

- previsão;
- observação;
- alerta;
- hidrologia;
- radar;
- satélite

devem continuar funcionando de forma determinística sem modelo generativo.

## 6. Performance e acessibilidade

Requisitos:

- Hero tratado como candidato principal a LCP;
- fotografia otimizada;
- mapa podendo ser carregado progressivamente;
- câmera ao vivo sem bloquear a primeira dobra;
- nenhuma nova família de fontes nesta rodada;
- WCAG 2.2 AA;
- foco visível;
- navegação por teclado;
- headings e landmarks corretos;
- estados não dependentes somente de cor;
- `prefers-reduced-motion` quando aplicável;
- nenhum overflow horizontal global.

## 7. Estratégia de implementação

A implementação deve ocorrer diretamente na `main`, em commits pequenos e coerentes.

Ordem:

1. composição e hierarquia da Home;
2. Hero;
3. previsão;
4. INMET;
5. radar/satélite;
6. Embrapa;
7. águas;
8. Explore e ponto futuro do PRO;
9. fechamento/footer;
10. consolidação de CSS;
11. auditoria de responsividade, acessibilidade, contratos e produção.

Não criar nova sequência de arquivos `v81`, `v82`, `v83` etc. Refinamentos devem fortalecer arquivos estáveis por domínio ou estilos localizados em componentes quando isso reduzir acoplamento.

A camada `home-editorial-layout.css` é uma fonte estável de composição estrutural, não uma nova sequência versionada: ela fixa a política de canvas aberto e deve substituir gradualmente overrides históricos equivalentes durante a consolidação.

## 8. Critério de aceite

A reformulação estará concluída quando a Home permitir responder em poucos segundos:

- Como está agora?
- Vai chover?
- Existe alerta?
- Como está a Lagoa?
- Onde vejo mais detalhes?

E quando visualmente o produto não parecer um dashboard genérico, uma landing SaaS ou um template meteorológico reutilizado.

A identidade desejada é:

> **um portal de informação meteorológica criado em Pelotas, para Pelotas, com fontes sérias, leitura clara e linguagem própria.**

## 9. Status de implementação

Estado desta direção na `main` em 18/08/2026:

- **Composição principal:** aplicada. INMET passou a entrar depois da previsão pública e o banner preventivo permanente da Defesa Civil saiu da sequência principal da Home.
- **Header editorial:** aplicado com navegação plana, estado ativo por linha e ações discretas.
- **Hero Magazine / Broadcast:** aplicado. Fotografia recuperou protagonismo e os fatos prioritários ficaram limitados a mínima/máxima, chuva e vento.
- **Índice da página:** aplicado como navegação editorial sem numeração e sem cards.
- **Previsão:** aplicada na camada estável `home-editorial-forecast.css`, com capítulo aberto, timeline e tendência semanal orientadas por tipografia, espaço e hairlines.
- **INMET:** aplicado em linguagem Data Journalism Premium, com superfície contínua, síntese principal, hairlines e próximos períodos em sequência.
- **Radar e satélite:** aplicado em linguagem Civic Tech / Scientific, com mapa dominante e controles visualmente mais funcionais que promocionais. O mapa permanece uma unidade contida porque é uma interação real.
- **Embrapa:** aplicada com leitura pública resumida para temperatura, umidade, vento e chuva do dia; a seção externa passou a usar canvas aberto.
- **Lagoa dos Patos:** aplicada com Laranjal como referência principal, rede regional resumida a três pontos e composição externa aberta.
- **Explore:** convertido para diretório editorial de conteúdo e retirado da lógica de card promocional.
- **Entenda os dados:** convertido para fechamento editorial aberto, sem superfície institucional pesada.
- **Footer:** aplicado como fechamento editorial mais compacto, preservando navegação, transparência, fontes e acesso aos avisos sem aparência de landing page.
- **Canvas editorial aberto:** formalizado em `home-editorial-layout.css`, carregado depois de `home-editorial-forecast.css` nas duas entradas de estilos.
- **PRO:** posição conceitual reservada, ainda sem bloco público ativo.
- **Contratos da Home:** ampliados para proteger a ordem INMET, os fatos essenciais do Hero, o índice sem numeração, a ausência do banner preventivo permanente, os estilos editoriais estáveis e a política de canvas aberto.

Pendências antes de encerrar a reformulação:

1. consolidar e remover resíduos de CSS histórico que já foram substituídos pelas fontes estáveis, sem criar nova série versionada;
2. revisar visualmente mobile/tablet nas larguras críticas e corrigir apenas problemas observados;
3. validar contratos, build, typecheck, lint e rotas em ambiente com execução disponível;
4. conferir o resultado visual sincronizado no deploy antes de considerar a Home concluída.
