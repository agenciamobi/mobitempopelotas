# Tempo Pelotas — direção definitiva da homepage

Última atualização: 19/08/2026  
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

### 3.5. Próximas horas

Direção: **Data Journalism**.

Mostrar:

- linha temporal das próximas horas;
- temperatura;
- chance de chuva;
- rajadas relevantes;
- maior chance de chuva com destaque tipográfico.

Evitar card individual como unidade básica de cada hora.

Astronomia permanece como informação secundária integrada ao capítulo.

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

### 3.7. Tendência da semana

Direção: **Data Journalism**.

A tendência dos próximos dias é um capítulo próprio, separado da linha horária e posicionado **imediatamente antes de Radar e satélite**. Essa ordem fecha a leitura de previsão antes de a página entrar no monitoramento visual observado.

Mostrar:

- próximos dias em sequência;
- condição predominante;
- síntese curta e determinística;
- chance de chuva;
- máxima e mínima;
- destaque tipográfico para o dia com maior chance de chuva quando fizer sentido.

A grade deve usar hairlines e espaço, não card promocional por dia. Em tablet/mobile pode haver rolagem horizontal porque cada dia constitui uma unidade real de leitura.

### 3.8. Radar e satélite

Direção: **Civic Tech / Scientific**.

Mapa e imagem são protagonistas. A Home mantém os controles essenciais e a rota `/radar-e-satelite-pelotas` aprofunda interpretação, comparação e contexto.

Composição aprovada para a Home:

- abertura editorial com finalidade do monitoramento;
- metadados de fonte, radar de referência e foco territorial;
- controle segmentado plano para `Radar · Satélite · Trovoadas`;
- subtipos de satélite organizados como segunda linha técnica quando aplicável;
- mapa amplo como superfície principal;
- timeline/reprodução visualmente separada da imagem, sem grande painel escuro flutuante;
- opacidade, horário e legenda mantidos como controles técnicos;
- fonte e estado de disponibilidade compreensíveis sem glassmorphism;
- guia curto `Como interpretar` abaixo do mapa, distinguindo radar, satélite e trovoadas;
- orientação explícita de que monitoramento visual não substitui avisos oficiais.

A central não deve sugerir que a sequência observada é projeção futura. Camadas avançadas e análise mais densa permanecem para páginas dedicadas e, futuramente, PRO.

### 3.9. Medição local — Embrapa

Direção: **Civic Tech editorial**.

Responder principalmente: **o que está sendo realmente medido em Pelotas agora?**

Prioridade:

- temperatura observada;
- umidade;
- vento;
- chuva do dia;
- horário e fonte.

Outras métricas permanecem na página dedicada da estação.

### 3.10. Lagoa dos Patos

Direção: **Civic Tech local**.

Laranjal é a referência principal da Home:

- nível atual;
- subindo / baixando / estável;
- mudança em 6 horas;
- mudança em 24 horas;
- última leitura.

A rede regional deve aparecer de forma resumida na Home. A visão densa/completa pertence a `/situacao-hidrologica-pelotas`.

### 3.11. Tempo Pelotas PRO

Reservar posição natural na arquitetura, mas manter desligado até o produto estar pronto.

Quando ativado, o bloco deve explicar valor, não bloquear informação pública:

- comparação de modelos;
- históricos ampliados;
- alertas personalizados;
- análises e interpretação;
- camadas adicionais.

### 3.12. Explore o Tempo Pelotas

Diretório editorial de conteúdo, não conjunto de cards promocionais.

Categorias principais:

- Previsão;
- Chuva e vento;
- Monitoramento;
- Águas e fontes.

Usar divisores, headings e links internos para distribuir tráfego às páginas públicas detalhadas.

### 3.13. Entenda os dados

Fechamento editorial explicando de forma simples a diferença entre:

- observação;
- previsão;
- aviso oficial;
- radar e satélite.

Deve apontar para metodologia e transparência das fontes.

### 3.14. Footer

Editorial e funcional. Não repetir toda a Home.

## 4. Sistema visual

### 4.1. Canvas

- fundo neutro levemente quente/frio conforme contraste necessário;
- superfícies brancas apenas quando a estrutura pedir;
- grandes seções separadas por espaço, tipografia ou hairlines;
- sombras excepcionais;
- gradientes concentrados no Hero quando necessários para legibilidade da fotografia.

A política de canvas aberto é parte da arquitetura, não apenas um refinamento cosmético: Hero, avisos oficiais, mapa e controles interativos podem justificar contenção; previsão, tendência, medição local, águas, diretório e metodologia devem preferir página aberta, grid, espaço e hairlines.

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

Ordem de refinamento por domínio:

1. composição e hierarquia da Home;
2. Header e Hero;
3. próximas horas;
4. INMET;
5. tendência semanal;
6. radar/satélite;
7. Embrapa;
8. águas;
9. Explore e ponto futuro do PRO;
10. fechamento/footer;
11. consolidação de CSS;
12. auditoria de responsividade, acessibilidade, contratos e produção.

Não criar nova sequência de arquivos `v81`, `v82`, `v83` etc. Refinamentos devem fortalecer arquivos estáveis por domínio ou estilos localizados em componentes quando isso reduzir acoplamento.

A Home atual usa namespaces locais `tp-home-*` e um `home-editorial-shell.css` mínimo apenas para comportamento transversal. Arquivos históricos de composição não devem voltar à entrada global quando o domínio já possui fonte local de verdade.

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

Estado desta direção na `main` em 19/08/2026:

- **Composição principal:** aplicada. A narrativa meteorológica pública está organizada em alerta, índice, próximas horas, INMET, tendência semanal, radar/satélite, observação local, águas e aprofundamentos.
- **Header editorial:** aplicado em namespace próprio, com navegação plana, estado ativo por linha e ações discretas.
- **Hero Magazine / Broadcast:** aplicado em namespace próprio. Fotografia/câmera mantém protagonismo e os fatos prioritários ficam limitados a mínima/máxima, chuva e vento.
- **Índice da página:** aplicado como sumário editorial por âncoras, sem numeração, cards ou tab bar de produto.
- **Próximas horas:** isoladas em `home-forecast-editorial.tsx/css`, com timeline, astronomia e dois sinais principais em canvas aberto.
- **INMET:** aplicado em linguagem Data Journalism Premium no componente `tp-home-inmet`, com síntese principal, próximos períodos, hairlines e fonte explícita.
- **Tendência semanal:** separada da previsão horária em `home-forecast-trend.tsx/css` e posicionada imediatamente antes do radar, com grade editorial de quatro dias e destaque tipográfico de chuva.
- **Radar e satélite:** convertido em central Civic Tech / Scientific. O mapa segue como interação contida, mas a Home agora apresenta abertura editorial, metadados, controle segmentado plano, timeline técnica clara separada da imagem, fonte/estado legíveis e guia de interpretação.
- **Embrapa:** aplicada com leitura pública resumida para temperatura, umidade, vento e chuva do dia; a seção externa usa canvas aberto.
- **Lagoa dos Patos:** aplicada com Laranjal como referência principal, rede regional resumida e composição externa aberta.
- **Explore:** convertido para diretório editorial de conteúdo e retirado da lógica de card promocional.
- **Entenda os dados:** convertido para fechamento editorial aberto, sem superfície institucional pesada.
- **Footer:** isolado em namespace próprio e aplicado como fechamento editorial compacto, preservando navegação, transparência, fontes e acesso aos avisos.
- **Cascata da Home:** componentes públicos principais possuem fontes locais `tp-home-*`; `home-editorial-shell.css` permanece como shell mínimo transversal. As antigas camadas de override da Home foram retiradas da entrada global conforme seus domínios foram isolados.
- **PRO:** posição conceitual reservada, ainda sem bloco público ativo.
- **Contratos da Home:** ampliados para proteger a ordem `próximas horas → INMET → tendência → radar`, os namespaces locais, o radar científico, a ausência de overrides `!important` nos capítulos novos e a composição responsiva.

Pendências antes de encerrar a reformulação:

1. conferir visualmente o novo radar em desktop/tablet/mobile no deploy, principalmente alturas do mapa, barra de satélite, timeline e controles MapLibre;
2. continuar auditando apenas CSS compartilhado que ainda possa interferir em internals do mapa, sem reintroduzir camadas globais da Home;
3. validar contratos, build, typecheck, lint e rotas em ambiente com execução disponível;
4. executar auditoria final WCAG 2.2 AA, Core Web Vitals e responsividade ampla antes de considerar a Home concluída.