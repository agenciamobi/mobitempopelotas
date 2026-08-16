# Recursos e funcionalidades — Portal Tempo Pelotas

> Inventário técnico-funcional auditado em 16/08/2026.
>
> Base de código analisada: branch `main`, commit `421655bceecdcfb2f49a07d0c5af972366fa2c43`.
>
> Domínio canônico: `https://tempopelotas.com.br`.
>
> Este documento descreve o que existe hoje no Portal Tempo Pelotas, incluindo páginas públicas, fontes de dados, integrações, APIs, widgets, automações, recursos de conta, SEO, segurança, contingências e limitações conhecidas. Ideias ainda não implementadas não são tratadas como funcionalidades atuais.

---

## 1. Como ler este documento

Para evitar confundir código existente com funcionalidade efetivamente disponível, os recursos são classificados com os seguintes estados:

- **Público ativo** — implementado na `main` e exposto ao visitante ou a consumidores públicos do portal.
- **Backend ativo** — implementado para coleta, consolidação, automação, persistência ou suporte às páginas públicas.
- **Condicional** — implementado, mas depende de credenciais, configuração externa, autenticação ou disponibilidade de terceiros.
- **Implementação presente, atualmente suspensa** — código e infraestrutura existem no repositório, porém o shell atual não ativa o recurso para o visitante.
- **Limitação conhecida** — comportamento atual que precisa ser compreendido para não atribuir ao portal uma precisão ou origem de dado que ele não possui.

A fonte de verdade para este inventário é, nesta ordem:

1. código atual da branch `main`;
2. comportamento do domínio canônico em auditoria ao vivo;
3. workflows, migrações e contratos versionados;
4. histórico do projeto apenas como apoio para localizar recursos, nunca como prova de que continuam ativos.

Arquivos em `_legacy/` não são considerados recursos ativos do produto.

---

## 2. Visão geral do Portal Tempo Pelotas

O Tempo Pelotas é um portal regional de meteorologia, monitoramento ambiental e hidrologia com foco principal em Pelotas e cobertura complementar da Zona Sul, Costa Doce, Fronteira Sul e Campanha do Rio Grande do Sul.

O sistema reúne, em uma única arquitetura:

- condições meteorológicas atuais de Pelotas com observação local;
- previsão horária e diária;
- previsão e avisos oficiais do INMET;
- contexto meteorológico do CPPMet/UFPel;
- radar, satélite e trovoadas da REDEMET/DECEA;
- mapa de ocorrência de geadas do INMET;
- meteograma técnico;
- monitoramento da Lagoa dos Patos no Laranjal;
- monitoramento regional da Lagoa dos Patos;
- nível do Guaíba e contexto SACE/SGB;
- câmeras meteorológicas ao vivo e replays;
- histórico meteorológico recente;
- páginas meteorológicas regionais;
- blog alimentado pelo RSS oficial do CPPMet/UFPel;
- dados públicos em JSON e JSON Feed;
- embeds e widget hidrológico para terceiros;
- autenticação opcional e recursos LGPD;
- infraestrutura de Web Push;
- SEO técnico, dados estruturados e canonicalização;
- automações de coleta, snapshots, verificação de previsão e notificações;
- controles de qualidade, proveniência e contingência entre fontes.

O portal não depende de IA para obter temperatura, umidade, vento, chuva, alertas, níveis hidrológicos, radar, satélite ou qualquer outro dado meteorológico/hidrológico. Existe uma camada opcional de síntese editorial por IA, tratada separadamente na seção 24.

---

## 3. Fotografia da auditoria pública de 16/08/2026

Foi executada uma auditoria automatizada diretamente contra `https://tempopelotas.com.br`.

Resultado da rodada principal:

- sitemap publicado: **42 URLs**;
- todas as 42 URLs do sitemap responderam HTTP 200;
- `/robots.txt`: HTTP 200;
- `/pelotas.json`: HTTP 200;
- `/feed`: HTTP 200;
- `/embed/nivel-laranjal`: HTTP 200;
- `/embed/status-tempo-agora`: HTTP 200;
- `/widgets/nivel-laranjal.js`: HTTP 200;
- `/api/widgets/nivel-laranjal`: HTTP 200;
- `/api/weather/embrapa`: HTTP 200;
- `/api/weather/hourly-precipitation`: HTTP 200;
- `/api/inmet/geadas?days=7&uf=RS`: HTTP 200;
- nenhuma página ou interface testada falhou nessa rodada.

Workflow de auditoria: `Official sources audit temp`, run `31927855735`.

Em uma rodada separada das fontes meteorológicas, também foram confirmados ao vivo:

- previsão municipal INMET para Pelotas: HTTP 200;
- avisos INMET por geocódigo de Pelotas: HTTP 200;
- estação de referência INMET: HTTP 200;
- monitor da Embrapa Clima Temperado: HTTP 200;
- `/pelotas.json` com estado `live`;
- proveniência de todos os campos numéricos da condição atual apontando exclusivamente para `embrapa`;
- INMET e Embrapa marcados como utilizáveis no snapshot público;
- geração da síntese naquele instante em modo `deterministic`.

Workflow: run `31926246433`.

### Divergência entre `main` e publicação observada

A `main` contém a rota `/blog` e a inclui em `PUBLIC_ROUTES`, mas o sitemap servido pelo domínio durante a auditoria tinha 42 URLs e ainda não continha `/blog`. Portanto, o inventário distingue **recurso implementado na main** de **superfície já refletida no sitemap publicado** quando houver diferença de implantação.

---

## 4. Superfície pública principal

### 4.1 Página inicial

**Rota:** `/`

A Home é a principal consolidação do portal e atualmente reúne:

- cabeçalho global;
- Hero meteorológico;
- condição atual de Pelotas;
- mínima e máxima previstas;
- chance de chuva;
- rajada máxima prevista;
- avisos oficiais do INMET com impacto visual no estado do Hero;
- contexto regional do CPPMet/UFPel;
- câmera ao vivo do Laranjal como fundo do Hero quando há transmissão válida;
- informações astronômicas;
- painel de avisos INMET;
- painel de previsão oficial INMET;
- banners de segurança quando aplicáveis;
- navegação por seções;
- painel editorial meteorológico;
- previsão por hora;
- tendência para os próximos períodos;
- atalhos para áreas especializadas do portal;
- conteúdo editorial e explicativo;
- rodapé com rastreabilidade de fontes.

Arquivo principal de composição: `src/production/ProductionHome.tsx`.

### 4.2 Navegação atual

O cabeçalho organiza o acesso a:

- Agora;
- Hoje;
- Amanhã;
- 7 dias;
- Chuva;
- Vento;
- Monitoramento;
- Região;
- Águas;
- Alertas;
- câmeras;
- conta, quando aplicável.

O menu de Monitoramento oferece acesso a radar/satélite, mapa de geadas, Embrapa, câmeras, clima, meteograma, histórico e metodologia.

O menu de Águas agrupa situação hidrológica, nível do Laranjal, avisos e metodologia.

Há navegação compacta específica para mobile.

---

## 5. Condições meteorológicas atuais de Pelotas

### Estado: Público ativo

A regra central do sistema é separar **observação** de **previsão**.

Para Pelotas, a condição numérica apresentada como medição atual utiliza exclusivamente uma leitura recente e validada da **Embrapa Clima Temperado**.

Campos observados utilizados quando disponíveis:

- temperatura;
- sensação térmica;
- umidade;
- pressão atmosférica;
- velocidade do vento;
- direção do vento;
- nascer do sol;
- pôr do sol;
- horário da observação.

A observação é considerada utilizável somente dentro dos critérios de atualidade definidos pelo sistema. A política atual limita o uso da leitura como condição presente quando ela ultrapassa a janela operacional de frescor.

Se a Embrapa não possuir leitura válida, o portal deve considerar a condição atual indisponível em vez de transformar um valor de modelo meteorológico em observação.

Arquivos centrais:

- `src/lib/weather/embrapa-central.server.ts`;
- `src/lib/weather/current-observation.ts`;
- `src/lib/weather/aggregated-weather.server.ts`;
- `src/production/adapters/home.ts`.

### Proveniência por campo

O modelo agregado registra a origem dos campos atuais. O endpoint público `/pelotas.json` expõe essa rastreabilidade em `current_provenance`.

Na auditoria de 16/08/2026, todos os campos atuais disponíveis estavam marcados como `embrapa`.

### Limitação semântica atual do Hero

A Embrapa fornece os valores observados, mas não necessariamente uma condição visual auditável como “chuva”, “sol” ou “nublado”.

O resolvedor visual atual do Hero procura, nesta ordem:

1. ícone explicitamente observado;
2. ícone da primeira hora da previsão;
3. ícone da previsão diária;
4. interpretação textual de contexto oficial.

Por isso, uma frase visual como **“Chuva agora em Pelotas”** pode ser derivada da previsão horária mesmo quando os números ao lado são medições reais da Embrapa.

Isso é uma **limitação conhecida**. Não se deve interpretar a condição visual do Hero como prova de precipitação observada na estação até que essa semântica seja corrigida. Os números de temperatura, umidade, pressão e vento continuam separados e rastreáveis à Embrapa.

Arquivo: `src/production/lib/hero-weather-presentation.ts`.

---

## 6. Atualização automática dos dados no navegador

### Estado: Público ativo

O shell global monta `WeatherMinuteRefresh`.

O componente:

- invalida os loaders aproximadamente a cada 60 segundos;
- só faz atualização periódica quando a página está visível e o navegador está online;
- verifica se uma atualização está vencida quando a janela recebe foco;
- verifica novamente ao retornar para uma aba visível;
- reage ao evento de reconexão `online`;
- evita polling desnecessário em aba oculta ou offline.

Isso permite que uma página aberta acompanhe alterações recentes sem depender exclusivamente de reload manual.

Além disso, `getWeatherIntelligence` usa cache curto no servidor/CDN, atualmente com janela de aproximadamente 45 segundos e `stale-while-revalidate` curto.

Arquivos:

- `src/components/weather/WeatherMinuteRefresh.tsx`;
- `src/routes/__root.tsx`;
- `src/lib/weather/weather-intelligence.functions.ts`.

---

## 7. Previsão meteorológica de Pelotas

### Estado: Público ativo

A previsão é tratada separadamente da observação local.

### 7.1 Fontes operacionais de previsão

O sistema agrega:

- **Open-Meteo** como fonte/modelo operacional principal em vários fluxos;
- **MET Norway** como contingência meteorológica;
- **INMET** como previsão oficial municipal complementar;
- **CPPMet/UFPel** como contexto meteorológico regional.

Open-Meteo e MET Norway são fontes de previsão/modelagem. Eles não substituem a observação da Embrapa como “medição atual” de Pelotas.

### 7.2 Contingência no navegador

A Home possui recuperação cliente-side via Open-Meteo quando a resposta server-side de previsão chega incompleta ou degradada.

Esse mecanismo pode recuperar:

- grade horária;
- temperatura prevista;
- probabilidade de precipitação;
- vento;
- rajadas;
- código meteorológico;
- previsão diária.

A recuperação não substitui a proveniência da condição observada da Embrapa.

Arquivo: `src/production/lib/open-meteo-browser-recovery.ts`.

### 7.3 Reconciliação de temperaturas diárias

O sistema possui lógica própria de reconciliação entre a grade diária operacional e os períodos oficiais do INMET, especialmente para mínimas e máximas.

Arquivo: `src/lib/weather/daily-temperature-reconciliation.ts`.

---

## 8. Página “Tempo hoje em Pelotas”

**Rota:** `/tempo-hoje-pelotas`

### Estado: Público ativo

Oferece uma visão detalhada do dia atual, com separação entre observação e previsão.

Recursos:

- condição atual quando a Embrapa está válida;
- temperatura e sensação atuais;
- previsão horária;
- mínima e máxima do dia;
- chuva prevista;
- vento e rajadas;
- contexto oficial;
- alertas;
- rastreabilidade de fontes;
- indicadores de qualidade/confiança;
- ligações com monitoramento e hidrologia.

---

## 9. Página “Tempo amanhã em Pelotas”

**Rota:** `/tempo-amanha-pelotas`

### Estado: Público ativo

Recursos:

- resumo do dia seguinte;
- mínima e máxima;
- chance/volume de precipitação;
- vento e rajadas;
- períodos/horas disponíveis;
- contexto oficial do INMET e regional quando disponível;
- alertas relevantes;
- fontes e metodologia.

---

## 10. Previsão para 7 dias

**Rota:** `/previsao-7-dias-pelotas`

### Estado: Público ativo

Recursos:

- previsão diária para uma semana;
- mínima e máxima;
- condição prevista;
- chuva;
- vento/rajadas;
- reconciliação com dados oficiais quando aplicável;
- rastreabilidade de fonte.

---

## 11. Chuva em Pelotas

**Rota:** `/chuva-em-pelotas`

### Estado: Público ativo

Página especializada em precipitação.

Recursos:

- probabilidade de chuva;
- volume previsto;
- distribuição por hora;
- leitura contextual do dia;
- integração com alertas;
- diferenciação entre chuva prevista e dados observados.

Endpoint de apoio público:

- `/api/weather/hourly-precipitation`.

Esse endpoint respondeu HTTP 200 na auditoria pública de 16/08/2026.

---

## 12. Vento em Pelotas

**Rota:** `/vento-em-pelotas`

### Estado: Público ativo

Recursos:

- vento atual medido quando disponível;
- vento previsto;
- direção;
- rajadas;
- evolução por hora;
- destaques de maior intensidade;
- contexto de segurança/alerta quando aplicável.

---

## 13. Meteograma técnico

**Rota:** `/meteograma-pelotas`

### Estado: Público ativo

O meteograma é uma visão técnica de previsão para análise de curto prazo.

Variáveis trabalhadas pelo módulo incluem:

- temperatura;
- ponto de orvalho;
- probabilidade de precipitação;
- volume de precipitação;
- nebulosidade baixa;
- nebulosidade média;
- nebulosidade alta;
- visibilidade;
- pressão atmosférica;
- vento;
- rajadas;
- CAPE/indicadores convectivos quando disponíveis.

Os valores do meteograma são **previsões**, não observações da estação da Embrapa.

---

## 14. INMET — previsão, avisos e estação de referência

### Estado: Backend ativo + Público ativo

O INMET é utilizado em três frentes principais.

### 14.1 Previsão oficial municipal

Endpoint consultado:

`https://apiprevmet3.inmet.gov.br/previsao/4314407`

O parser reconhece períodos, datas, resumos, mínimas, máximas, umidade, vento, ícones, nascer/pôr do sol e estação do ano quando presentes no payload.

Arquivo: `src/lib/weather/inmet-forecast.server.ts`.

### 14.2 Avisos meteorológicos

O sistema consulta o município e possui caminhos de contingência por RSS/CAP.

Recursos do parser:

- severidade;
- rótulo de severidade;
- relevância para Pelotas;
- relevância regional/estadual;
- início e término;
- ativo ou futuro;
- municípios e códigos IBGE;
- áreas afetadas;
- descrição;
- instruções;
- URL oficial;
- descarte de avisos expirados.

Arquivo: `src/lib/weather/inmet.server.ts`.

### 14.3 Estação de referência

Endpoint:

`https://apiprevmet3.inmet.gov.br/estacao/proxima/4314407`

O sistema extrai, quando disponíveis:

- código;
- nome;
- município;
- UF;
- latitude;
- longitude;
- altitude;
- distância.

Esses metadados não substituem a medição local da Embrapa.

Arquivo: `src/lib/weather/inmet-station.server.ts`.

---

## 15. Alertas oficiais

**Rota:** `/alertas`

### Estado: Público ativo

Recursos:

- avisos oficiais do INMET;
- classificação por severidade;
- aviso ativo versus próximo;
- escopo Pelotas/regional/estadual;
- datas de vigência;
- descrição e instruções;
- links oficiais;
- integração visual com a Home e o cabeçalho;
- elevação do nível visual para atenção/alerta quando um aviso relevante está ativo.

O portal não gera um alerta meteorológico próprio para substituir o INMET. Ele consolida e apresenta o aviso oficial com contexto local.

---

## 16. CPPMet / UFPel

### Estado: Público ativo + Backend ativo

O Centro de Pesquisas e Previsões Meteorológicas da UFPel é usado em duas frentes distintas.

### 16.1 Contexto regional da previsão

O portal consulta conteúdo meteorológico do CPPMet e o utiliza como contexto regional complementar.

Na Home, quando há conteúdo válido, esse contexto pode aparecer em conjunto com a previsão operacional e os dados observados.

### 16.2 Blog/RSS do CPPMet

**Rota implementada:** `/blog`

Feed:

`https://wp.ufpel.edu.br/cppmet/feed/`

Recursos do leitor RSS:

- consulta server-side;
- timeout de 8 segundos;
- tentativa alternativa do feed sem barra final;
- até 12 publicações;
- sanitização de HTML;
- decodificação de entidades XML;
- remoção de `script` e `style`;
- excerto limitado;
- categorias;
- deduplicação por URL;
- aceitação apenas de HTTPS no host `wp.ufpel.edu.br` e caminho `/cppmet/`;
- link sempre para a publicação original;
- não republica o artigo integral;
- estado seguro de indisponibilidade quando o RSS falha;
- `rel=alternate` apontando para o RSS oficial.

Arquivos:

- `src/lib/content/cppmet-news.server.ts`;
- `src/lib/content/cppmet-news.functions.ts`;
- `src/routes/blog.tsx`.

A integração foi validada anteriormente contra o feed real com HTTP 200 e itens válidos.

**Observação de publicação:** a rota existe na `main`, porém não aparecia no sitemap do domínio na fotografia de 16/08/2026. Isso indica diferença entre a `main` e a superfície publicada observada naquele momento.

---

## 17. Radar, satélite e trovoadas — REDEMET/DECEA

**Rota:** `/radar-e-satelite-pelotas`

### Estado: Público ativo, integração condicional à configuração

O portal oferece monitoramento remoto com produtos da REDEMET/DECEA.

Recursos:

- imagens de radar;
- imagens de satélite;
- ocorrências de trovoada/STSC;
- múltiplos frames;
- linha temporal;
- navegação/reprodução de quadros;
- horário de observação;
- comparação contextual com a previsão meteorológica;
- estados de carregamento, indisponibilidade e produto não configurado.

Esses produtos representam observação remota recente ou passada. Não são “radar do futuro”.

### APIs

- `/api/redemet/radar`;
- `/api/redemet/satellite`;
- `/api/redemet/storms`;
- `/api/redemet/image`.

### Proxy seguro de imagens

O proxy de imagem protege credenciais e restringe o acesso a origens oficiais permitidas.

Controles incluem:

- validação de URL;
- restrição de protocolo;
- allowlist de hosts oficiais/configurados;
- tratamento controlado de redirecionamento;
- limite de tamanho;
- exigência de `Content-Type` de imagem;
- credencial REDEMET apenas no servidor;
- não exposição da chave para o cliente.

### Continuidade/último quadro válido

Existe uma camada de “last good” para preservar o último frame válido em falhas transitórias, dentro da política operacional do sistema.

Arquivos principais:

- `src/lib/redemet/redemet.server.ts`;
- `src/lib/redemet/redemet-last-good.server.ts`;
- `src/routes/api/redemet/*`.

---

## 18. Mapa de geadas do Rio Grande do Sul

**Rota:** `/mapa-de-geadas-rio-grande-do-sul`

### Estado: Público ativo

Fonte: INMET.

O mapa trabalha com **ocorrências observadas/históricas de geada**, e não com previsão futura de geada.

Recursos:

- mapa de estações;
- tabela/listagem;
- filtro de período;
- filtro por tipo de estação;
- convencionais;
- automáticas;
- intensidade/classificação;
- temperatura registrada;
- estatísticas agregadas;
- menor temperatura do período;
- limite operacional de consulta;
- cache;
- reaproveitamento temporário do último resultado válido em falha transitória.

Para estações convencionais, a classificação usa faixas de temperatura definidas no código. Para automáticas, o sistema pode apresentar classificação de possibilidade conforme o dado disponível.

Endpoint público:

- `/api/inmet/geadas`.

Na auditoria, `/api/inmet/geadas?days=7&uf=RS` respondeu HTTP 200.

Arquivo principal: `src/lib/inmet/frost.server.ts`.

---

## 19. Estação Embrapa Clima Temperado

**Rota:** `/estacao-embrapa-pelotas`

### Estado: Público ativo

A página expõe com maior detalhe a observação local utilizada pelo portal.

Recursos incluem, conforme disponibilidade da estação:

- condição numérica atual;
- temperatura;
- sensação;
- umidade;
- pressão;
- vento;
- direção;
- extremos registrados;
- acumulados;
- horários das medições/extremos;
- fonte e estação;
- estado `live`, `stale` ou indisponível;
- explicações sobre a diferença entre observação e previsão.

Endpoint público de apoio:

- `/api/weather/embrapa`.

Esse endpoint respondeu HTTP 200 na auditoria de 16/08/2026.

---

## 20. Histórico meteorológico recente

**Rota:** `/historico-climatico-pelotas`

### Estado: Público ativo

A página apresenta aproximadamente os **últimos 30 dias completos** de histórico meteorológico recente.

Não deve ser interpretada como normal climatológica de longo prazo.

### Fontes e contingências

Ordem atual do módulo:

1. Open-Meteo Historical Forecast;
2. Open-Meteo Archive;
3. NASA POWER Daily.

No fallback NASA POWER, a busca pode olhar uma janela maior para reunir 30 dias válidos.

Recursos:

- máxima diária;
- mínima diária;
- precipitação;
- rajadas quando suportadas;
- tabela/visualização temporal;
- média de mínimas;
- média de máximas;
- precipitação total;
- maior rajada;
- dia mais quente;
- dia mais frio;
- dia mais chuvoso;
- dia mais ventoso.

O módulo não inventa valor para preencher dado ausente.

Arquivo: `src/lib/weather/history.server.ts`.

---

## 21. Página “Clima em Pelotas”

**Rota:** `/clima-em-pelotas`

### Estado: Público ativo

Conteúdo editorial e educativo que contextualiza:

- comportamento sazonal;
- chuva;
- vento;
- influência da Lagoa dos Patos;
- observações atuais disponíveis;
- relação entre tempo do dia e histórico recente;
- links para páginas especializadas.

É uma página explicativa. Não substitui uma série climatológica oficial de décadas.

---

## 22. Cobertura regional da Zona Sul e Campanha

### Estado: Público ativo

### 22.1 Portal regional

**Rota:** `/tempo-na-regiao-sul-rs`

Agrupa cidades por região e funciona como porta de entrada para as páginas municipais.

### 22.2 Cidades cadastradas

O catálogo atual possui 24 cidades, incluindo Pelotas:

#### Pelotas e entorno

- Pelotas;
- Capão do Leão;
- Canguçu;
- Morro Redondo;
- Turuçu;
- Arroio do Padre;
- Pedro Osório;
- Cerrito;
- Piratini.

#### Costa Doce

- Rio Grande;
- São José do Norte;
- São Lourenço do Sul;
- Cristal.

#### Fronteira Sul

- Jaguarão;
- Arroio Grande;
- Herval;
- Santa Vitória do Palmar;
- Chuí.

#### Campanha

- Pinheiro Machado;
- Pedras Altas;
- Bagé;
- Candiota;
- Aceguá;
- Dom Pedrito.

Pelotas possui páginas especializadas próprias. As outras 23 cidades usam a rota dinâmica:

`/tempo-em/$citySlug`

### 22.3 Dados das páginas regionais

Para as cidades regionais, o sistema utiliza Open-Meteo para condição/previsão e tenta obter avisos municipais do INMET pelo código IBGE.

Recursos típicos:

- temperatura atual do serviço meteorológico;
- sensação;
- umidade;
- vento;
- condição;
- previsão horária;
- previsão diária;
- avisos INMET locais quando disponíveis;
- SEO específico por cidade;
- navegação regional.

### Limitação importante

O “atual” das cidades regionais não é uma observação local equivalente à estação Embrapa de Pelotas. É o campo `current` fornecido pelo serviço de modelagem meteorológica utilizado para a cidade.

Portanto, o rigor de “medição observada” aplicado a Pelotas não deve ser estendido automaticamente às demais cidades.

Arquivo: `src/lib/weather/regional-city-weather.server.ts`.

---

## 23. Hidrologia — visão geral

**Rota:** `/situacao-hidrologica-pelotas`

### Estado: Público ativo

A página hidrológica consolida múltiplos pontos e sistemas em uma visão regional.

Ela reúne:

- Estação Laranjal / Lagoa dos Patos;
- nível do Guaíba;
- contexto SACE/SGB;
- rede de estações da Lagoa dos Patos;
- meteorologia associada;
- câmeras quando úteis;
- estados de atualização;
- tendências e variações;
- referências de atenção/perigo disponíveis para cada ponto;
- explicações de contexto hidrológico.

A rota atual carrega em paralelo Laranjal, Guaíba, SACE, rede regional da Lagoa, meteorologia e câmeras.

---

## 24. Estação Laranjal — Lagoa dos Patos

**Rota:** `/nivel-da-lagoa-dos-patos-laranjal`

### Estado: Público ativo

Fonte principal: **LabHidroSens / UFPel**, via telemetria ThingsBoard.

Recursos:

- nível atual;
- horário da leitura;
- idade do dado em minutos;
- série recente de aproximadamente 48 horas;
- tendência em cm/h;
- variação em 1 hora;
- variação em 6 horas;
- variação em 24 horas;
- média do período;
- mínimo do período;
- máximo do período;
- estado de atualização;
- fonte e contexto;
- fallback temporário para último dado conhecido quando aplicável.

### Estados operacionais

- `live` — leitura recente;
- `stale` — leitura antiga/último valor conhecido ainda exibido com sinalização;
- `unavailable` — sem leitura utilizável.

A política atual considera a leitura atrasada quando ultrapassa aproximadamente 120 minutos.

Arquivo: `src/lib/hydrology/laranjal-level.server.ts`.

---

## 25. Rede regional da Lagoa dos Patos

### Estado: Público ativo, dependente de fontes externas

O módulo atual acompanha pontos regionais ligados à Lagoa dos Patos.

Estações cadastradas:

- **FURG CCMAR / Rio Grande** — FURG / Portos RS;
- **São Lourenço do Sul** — Portos RS / FURG;
- **Arambaré** — Portos RS / FURG;
- **São José do Norte** — Portos RS / FURG;
- **Itapuã** — Portos RS / FURG.

Para cada estação, o sistema pode apresentar:

- nível;
- horário de atualização;
- idade do dado;
- mudança em 24 horas;
- tendência em cm/h;
- estado normal/atenção/perigo/indisponível;
- referência de perigo configurada;
- fonte.

As referências atuais versionadas são específicas por estação e utilizadas como contexto visual operacional, não como substituição de orientações oficiais de Defesa Civil ou autoridade portuária.

O carregamento é paralelo, com timeout e tratamento individual de falhas. A rede pode ficar em estado parcial quando apenas algumas estações respondem.

Arquivo: `src/lib/hydrology/lagoon-network.server.ts`.

---

## 26. Nível do Guaíba

### Estado: Público ativo, dependente de fontes externas

O módulo principal utiliza:

- TideSat/MetSul como fonte primária para o Cais Mauá;
- `nivelguaiba.com.br` como fallback contextual em fluxo suportado.

Recursos:

- nível atual;
- horário;
- idade do dado;
- tendência;
- variação em 24h;
- mínimo/média/máximo do período;
- distância para a referência de 3,00 m;
- estados de disponibilidade e atraso;
- fallback.

Arquivo: `src/lib/hydrology/guaiba.server.ts`.

---

## 27. SACE/SGB — contexto oficial do Guaíba

### Estado: Backend/Público contextual

O portal integra dados do sistema SACE do Serviço Geológico do Brasil para contexto do Guaíba.

Endpoint versionado:

`https://sace.sgb.gov.br/guaiba/api/geojson/point`

Recursos de resiliência:

- até 2 tentativas;
- atraso curto entre tentativas;
- timeout;
- leitura de nome/cor oficial do estado de alerta quando fornecidos;
- parsing de nível e horário;
- cache saudável;
- reaproveitamento de último dado válido em falhas transitórias;
- cache curto para indisponibilidade;
- distinção entre falha da integração e indisponibilidade da fonte oficial.

Arquivo: `src/lib/hydrology/sace-guaiba.server.ts`.

---

## 28. Câmeras meteorológicas

**Rota:** `/cameras-ao-vivo-pelotas`

### Estado: Público ativo + slots condicionais

O sistema possui slots para:

- Laranjal;
- Centro;
- São Gonçalo.

### Laranjal

O resolvedor pode localizar conteúdo do YouTube por várias estratégias:

1. configuração manual;
2. YouTube Data API quando configurada;
3. descoberta de transmissão pública ao vivo do canal;
4. RSS do canal como fallback para replay recente.

O embed usa domínio de privacidade aprimorada `youtube-nocookie.com` quando aplicável.

O sistema diferencia estados como transmissão ao vivo, replay/preparação e indisponibilidade conforme os dados disponíveis.

A Home pode usar a câmera do Laranjal como plano de fundo do Hero somente quando:

- o slot está online;
- a transmissão está marcada como live;
- existe URL de embed HTTPS válida.

### Centro e São Gonçalo

A infraestrutura está provisionada, mas a disponibilidade depende da configuração/transmissão real. Não devem ser descritas como câmeras permanentemente ativas.

Arquivo: `src/lib/cameras/cameras.server.ts`.

---

## 29. Dados públicos para terceiros

### 29.1 Snapshot JSON

**Rota:** `/pelotas.json`

### Estado: Público ativo

Formato público estruturado, atualmente com `schema_version: 2.0`.

Inclui:

- data de geração;
- localização de Pelotas;
- estado geral;
- síntese;
- condição atual;
- proveniência dos campos atuais;
- previsão horária;
- previsão diária;
- alertas;
- previsão oficial/contextual;
- observação Embrapa;
- indicador de validade da Embrapa como condição atual;
- qualidade/confiança;
- fontes;
- mensagens de degradação;
- origem da síntese;
- hidrologia do Laranjal;
- links principais;
- aviso de uso responsável.

Características de distribuição:

- JSON;
- CORS público;
- cache curto;
- `nosniff`.

### 29.2 JSON Feed

**Rota:** `/feed`

### Estado: Público ativo

Formato JSON Feed 1.1 com itens relativos a:

- tempo de hoje;
- alertas;
- observação da Embrapa;
- nível do Laranjal;
- metodologia.

Também possui CORS público e cache curto.

Arquivo central: `src/lib/public-portal.server.ts`.

---

## 30. Embeds e widgets externos

### 30.1 Embed do nível do Laranjal

**Rota:** `/embed/nivel-laranjal`

### Estado: Público ativo

Visão compacta para incorporação externa, com política de não indexação própria.

### 30.2 Embed do tempo agora

**Rota:** `/embed/status-tempo-agora`

### Estado: Público ativo

Visão compacta da condição atual/estado meteorológico para incorporação externa.

**Limitação:** a mesma ressalva semântica do Hero vale para a descrição visual quando a Embrapa não fornece uma condição observada e o sistema usa condição de previsão como apresentação.

### 30.3 Widget JavaScript do Laranjal

**Rota:** `/widgets/nivel-laranjal.js`

### Estado: Público ativo

Script para terceiros inserirem o nível do Laranjal em seus próprios sites.

Recursos:

- criação automática de iframe;
- sandbox;
- configuração de origem;
- montagem no elemento alvo;
- observação de DOM para montagem tardia;
- ajuste de altura por `postMessage`.

### 30.4 API do widget

**Rota:** `/api/widgets/nivel-laranjal`

### Estado: Público ativo

Expõe JSON com:

- status;
- nível atual;
- atualização;
- idade;
- tendência;
- mudanças recentes;
- série;
- fonte;
- link para detalhes.

Possui CORS público.

Todos os quatro recursos acima responderam HTTP 200 na auditoria pública.

---

## 31. Conta opcional e autenticação

### Estado: Condicional

O portal é utilizável publicamente sem conta. A conta adiciona recursos pessoais quando a infraestrutura Supabase/OAuth está corretamente configurada.

### Rotas

- `/entrar`;
- `/conta`;
- `/minha-conta` → redireciona para `/conta`;
- `/auth/callback`;
- `/auth/signout`.

### Login

O fluxo atualmente implementado utiliza Google OAuth através do Supabase Auth.

A rota de entrada:

- é marcada para não indexação;
- evita cache público;
- valida o redirecionamento de retorno;
- não é requisito para consumir meteorologia/hidrologia.

### Área da conta

Recursos implementados:

- nome de exibição;
- e-mail;
- preferências de alertas meteorológicos;
- preferências de alertas de água;
- resumo diário;
- atualizações da comunidade;
- consentimento versionado;
- data do consentimento;
- exportação dos próprios dados;
- exclusão da conta;
- logout;
- acesso à política de privacidade.

Quando a configuração externa não está disponível, a conta pode ficar indisponível sem derrubar o portal público.

Arquivo principal: `src/components/auth/AccountPage.tsx`.

---

## 32. Direitos LGPD e privacidade

**Rota:** `/privacidade-e-dados`

### Estado: Público ativo

A página documenta em linguagem pública:

- finalidade do portal;
- dados processados;
- uso de fontes externas;
- autenticação opcional;
- consentimento;
- notificações;
- exportação de dados;
- exclusão de conta;
- retenção;
- segurança;
- cookies/armazenamento local;
- contato;
- metodologia.

### APIs de direitos do titular

- `/api/account/export`;
- `/api/account/delete`.

A área da conta exige confirmação explícita para exclusão e implementa limpeza relacionada a perfil/preferências/consentimentos/subscrições conforme a camada de backend.

Migrações relacionadas a perfis, preferências, consentimento e permissões existem no repositório.

---

## 33. Web Push e notificações

### Estado: Backend implementado; ativação do cliente atualmente condicionada/suspensa junto ao PWA

Infraestrutura versionada:

- `/api/push/config`;
- `/api/push/subscription`;
- `/api/push/broadcast`;
- `/api/cron/push-daily`;
- armazenamento de subscriptions;
- VAPID;
- preferências por usuário;
- remoção de inscrições inválidas;
- service worker com evento `push` e clique de notificação.

Tópicos previstos no backend incluem:

- alertas meteorológicos;
- alertas de água;
- atualizações da comunidade;
- resumo diário conforme preferência/rotina de envio.

### Segurança

- chave privada não é enviada ao cliente;
- configuração pública só é retornada quando o ambiente está pronto;
- subscription exige autenticação no fluxo atual;
- endpoint da subscription é validado;
- broadcast/cron é protegido por credencial de servidor.

### Situação atual do cliente

A infraestrutura de Push existe, mas a ativação do service worker precisa ser analisada junto com o estado atual do PWA descrito na seção seguinte. Não considerar notificações browser plenamente ativas apenas porque o backend está versionado.

---

## 34. PWA, instalação e modo offline

### Estado: Implementação presente, atualmente suspensa no shell ativo

O repositório contém uma implementação completa de PWA:

- `public/manifest.webmanifest`;
- `public/sw.js`;
- `src/components/pwa/PwaManager.tsx`.

### Manifest

Define:

- modo `standalone`;
- identidade/ícones;
- atalhos para páginas como Agora, 7 dias, Águas, Lagoa, Câmeras e Avisos.

### Service worker

O arquivo possui lógica para:

- fallback offline;
- cache estático;
- navegação com estratégia própria;
- evitar tratar APIs como conteúdo offline antigo;
- atualização de recursos;
- Web Push;
- clique em notificação.

### PwaManager

A implementação possui:

- captura de `beforeinstallprompt`;
- CTA de instalação;
- orientação específica para iOS;
- registro do service worker;
- detecção de atualização;
- atualização periódica do registro;
- controle de foco/diálogo.

### Por que não está classificado como PWA ativo

Na `main` auditada:

- o `SiteLayout` atual não monta `PwaManager`;
- o `__root.tsx` contém um **reset emergencial de PWA** que, uma vez por sessão, procura registros de service worker e caches do portal e os remove.

Portanto, o código PWA existe e pode ser reativado, mas a experiência de instalação/offline/service worker não deve ser comercialmente descrita como funcionalidade ativa do portal neste estado da `main`.

---

## 35. SEO técnico e descoberta

### Estado: Público ativo

### 35.1 Domínio canônico

Domínio oficial:

`https://tempopelotas.com.br`

O código força convergência de:

- `www.tempopelotas.com.br`;
- HTTP no host canônico;
- hosts técnicos Lovable/Vercel reconhecidos;

para o domínio raiz HTTPS, usando redirecionamento permanente 308.

Arquivos:

- `src/lib/site-config.ts`;
- `src/lib/canonical-host.ts`.

### 35.2 Metadados

As páginas usam geração consistente de:

- `<title>`;
- meta description;
- canonical;
- Open Graph;
- Twitter Card.

Arquivo: `src/lib/page-meta.ts`.

### 35.3 Sitemap

**Rota:** `/sitemap.xml`

Gerado a partir da lista pública de rotas e das cidades regionais.

Na auditoria de produção, o sitemap servido continha 42 URLs e todas responderam HTTP 200.

### 35.4 Robots

**Rota:** `/robots.txt`

O arquivo público:

- permite o conteúdo público;
- bloqueia `/api/`;
- bloqueia `/_server/`;
- referencia o sitemap canônico.

### 35.5 Dados estruturados

A arquitetura possui geradores para diferentes tipos de Schema.org, incluindo conforme a página:

- Organization;
- WebSite;
- WebPage/editorial;
- BreadcrumbList;
- FAQPage;
- Dataset;
- VideoObject;
- ItemList;
- dados de confiança/contexto para datasets ambientais.

---

## 36. Acessibilidade e navegação assistiva

### Estado: Implementação ativa, sem alegação formal de conformidade total

Recursos existentes incluem:

- link “pular para conteúdo”;
- foco programático no conteúdo principal após navegação;
- tratamento de hash/âncora;
- anúncio de mudança de rota em região `aria-live`;
- estados `aria-*` nos controles;
- menus acionáveis por teclado;
- fechamento de menus com Escape;
- labels descritivos em métricas e widgets;
- tratamento de `prefers-reduced-motion` em estilos/componentes onde implementado;
- contratos/testes específicos de acessibilidade e estrutura semântica no repositório.

O inventário não afirma certificação WCAG. Ele registra os mecanismos implementados.

---

## 37. Dados astronômicos

### Estado: Público ativo como contexto meteorológico

A Home possui um módulo astronômico que trabalha com:

- nascer do sol;
- pôr do sol;
- fase da Lua;
- estação do ano;
- fonte de cada informação quando resolvida.

Nascer/pôr do sol podem vir do INMET quando presentes ou da observação/contexto disponível. A fase da Lua possui cálculo determinístico próprio.

---

## 38. Qualidade, confiança e rastreabilidade meteorológica

### Estado: Backend ativo + Público parcialmente visível

O agregador calcula um estado de qualidade com base em:

- presença da previsão baseline;
- presença de grade horária;
- presença de grade diária;
- qualidade/atualidade da Embrapa;
- disponibilidade dos avisos INMET;
- disponibilidade da previsão INMET;
- estação INMET;
- CPPMet;
- divergências relevantes entre fontes.

O resultado inclui:

- score numérico;
- confiança `high`, `medium` ou `low`;
- fonte do “agora”;
- fonte da previsão;
- provedor de previsão;
- fontes degradadas;
- idade da observação;
- divergências;
- notas explicativas.

### Comparação de fontes

O sistema compara, quando possível:

- temperatura atual de modelo versus Embrapa;
- sensação;
- umidade;
- pressão;
- vento;
- mínimas/máximas de previsão contra INMET;
- mínimas/máximas contra contexto do CPPMet.

As diferenças são classificadas por limiares de aviso/significância.

Arquivo: `src/lib/weather/aggregated-weather.server.ts`.

---

## 39. Verificação de acurácia da previsão

### Estado: Backend implementado/condicional a banco configurado

Existe infraestrutura para registrar previsões e confrontá-las posteriormente com observações reais da Embrapa.

Horizontes versionados incluem:

- 1 hora;
- 3 horas;
- 6 horas;
- 12 horas;
- 24 horas.

O subsistema suporta:

- snapshots de previsão;
- verificação posterior;
- associação com observação;
- métricas de erro;
- rotina cron;
- persistência Supabase.

Arquivos/migrações relacionados:

- `src/lib/weather/forecast-accuracy.server.ts`;
- `/api/cron/forecast-accuracy`;
- migrações `forecast_accuracy`.

A existência das migrações no Git não prova que todas estejam aplicadas em um ambiente específico. A aplicação no banco deve ser validada separadamente.

---

## 40. Persistência e centralização de dados meteorológicos

### Estado: Backend versionado/condicional

O repositório possui migrações para:

- perfis de usuário;
- preferências;
- consentimentos/LGPD;
- Web Push;
- snapshots meteorológicos diários;
- centralização de observações Embrapa;
- saúde das fontes meteorológicas;
- duração de falhas;
- acurácia da previsão;
- cache de payload Open-Meteo;
- snapshots editoriais de IA;
- fingerprint de snapshot;
- orçamento mensal de chamadas de IA.

A presença dessas migrações documenta a arquitetura esperada. Para recursos dependentes de Supabase, o estado real do banco de produção deve ser confirmado antes de afirmar ativação operacional.

---

## 41. APIs e rotas técnicas existentes

A árvore atual contém, entre outras, as seguintes rotas técnicas:

### Conta/autenticação

- `/api/account/delete`;
- `/api/account/export`;
- `/auth/callback`;
- `/auth/signout`.

### Weather

- `/api/weather/embrapa`;
- `/api/weather/hourly-precipitation`.

### INMET

- `/api/inmet/geadas`.

### REDEMET

- `/api/redemet/radar`;
- `/api/redemet/satellite`;
- `/api/redemet/storms`;
- `/api/redemet/image`.

### Push

- `/api/push/config`;
- `/api/push/subscription`;
- `/api/push/broadcast`.

### Widgets

- `/api/widgets/nivel-laranjal`;
- `/widgets/nivel-laranjal.js`.

### Cron/automação

- `/api/cron/embrapa`;
- `/api/cron/forecast-accuracy`;
- `/api/cron/push-daily`;
- `/api/cron/weather-snapshot`.

As rotas cron são de backend e não devem ser tratadas como APIs públicas para uso irrestrito.

---

## 42. Automações de backend

### 42.1 Coleta/centralização Embrapa

`/api/cron/embrapa`

Executa coleta protegida por segredo de cron e alimenta a infraestrutura centralizada quando configurada.

### 42.2 Snapshots meteorológicos

`/api/cron/weather-snapshot`

Persiste fotografia diária/operacional para análise posterior, quando o backend está configurado.

### 42.3 Verificação de previsão

`/api/cron/forecast-accuracy`

Registra/verifica previsões em relação à observação.

### 42.4 Notificações diárias

`/api/cron/push-daily`

Pode montar conteúdo de previsão/alerta/água e enviar notificações de acordo com preferências e configuração do Web Push.

---

## 43. Inteligência editorial e IA

### Estado: Opcional; não é fonte meteorológica

O portal possui um sistema chamado `weather-intelligence` que sempre consegue construir uma síntese **determinística** a partir dos dados agregados.

A síntese determinística pode gerar:

- headline;
- resumo;
- destaques;
- cautelas;
- menções a alertas;
- menções a divergências/indisponibilidades.

### Snapshot Gemini opcional

Também existe uma camada de snapshots editoriais pré-gerados com Gemini.

Regras importantes:

- a requisição pública não chama Gemini para obter o tempo;
- os dados meteorológicos são coletados antes da síntese;
- um snapshot de IA só é reutilizado se o fingerprint dos dados for compatível;
- se não existir snapshot válido, o sistema usa síntese determinística;
- IA não determina temperatura, umidade, vento, nível de água, aviso INMET, radar ou satélite;
- o portal continua operando sem IA.

Na auditoria ao vivo de 16/08/2026, `/pelotas.json` indicava `summary_generation.origin: deterministic`.

### Controle financeiro

O código possui um teto mensal versionado para chamadas Gemini (`GEMINI_WEATHER_MONTHLY_CALL_LIMIT`), com default seguro e lógica fail-closed antes da chamada.

A migration correspondente está versionada. A aplicação dessa migration no banco oficial de produção não foi confirmada nesta auditoria; portanto, não declarar o orçamento como “aplicado em produção” sem validação do Supabase correto.

---

## 44. Caching, frescor e resiliência

O portal utiliza várias camadas de cache de acordo com a natureza da fonte.

Princípios atuais:

- dados muito dinâmicos usam cache curto;
- falhas de terceiros não devem derrubar todo o portal;
- algumas fontes possuem último resultado válido temporário;
- dados antigos são sinalizados como `stale` quando aplicável;
- valores de previsão não devem substituir silenciosamente observações;
- serviços independentes são carregados em paralelo em vários fluxos;
- timeouts evitam que uma fonte travada bloqueie a página inteira;
- a Home possui recuperação client-side da previsão;
- o navegador invalida loaders periodicamente enquanto a página está visível.

Cada integração possui sua própria política de tempo, pois radar, observação de estação, hidrologia e histórico têm requisitos de atualização diferentes.

---

## 45. Segurança operacional

Recursos/controles encontrados na arquitetura:

- segredos mantidos no servidor;
- endpoints cron protegidos;
- API keys não expostas no HTML público;
- proxy REDEMET com validação de origem;
- URLs externas filtradas em integrações críticas;
- feed CPPMet restrito ao domínio/caminho oficial;
- autenticação opcional via Supabase;
- RLS e revogações presentes em migrações relevantes;
- políticas server-only;
- validação de subscriptions Push;
- canonicalização de host;
- `X-Content-Type-Options` em endpoints públicos selecionados;
- rotas de conta com `no-store`/não indexação;
- exportação/exclusão de dados limitada ao usuário autenticado;
- smoke de runtime verifica exposição acidental de nomes de secrets.

A auditoria documental não substitui revisão de segurança dedicada.

---

## 46. Workflows e validação do projeto

A `main` contém workflows para:

- `quality.yml` — qualidade global;
- `runtime-smoke.yml` — runtime publicado, REDEMET e hidrologia;
- `cutover-smoke.yml` — verificações de publicação/cutover;
- `visual-parity.yml` — paridade visual;
- `weather-ai-snapshots.yml` — snapshots editoriais agendados.

### Pipeline de qualidade

O workflow `quality.yml` cobre etapas como:

- Node 24;
- `npm ci`;
- validação de ambiente de exemplo;
- contratos rápidos;
- verificação da árvore de rotas;
- build;
- testes de rotas;
- testes gerais;
- typecheck;
- ESLint.

### Dívida atual de CI

O workflow global de Qualidade ainda possui falhas legadas/preexistentes em contratos e está sendo acompanhado separadamente. Portanto, não declarar a suíte global como verde enquanto essa dívida não for resolvida.

Essa pendência não significa que todas as páginas estejam quebradas: a auditoria pública de 16/08/2026 obteve HTTP 200 em todas as 42 URLs do sitemap e nas interfaces públicas adicionais testadas.

---

## 47. Metodologia e transparência

**Rota:** `/metodologia`

### Estado: Público ativo

A página centraliza explicações sobre:

- fontes;
- papéis de cada fonte;
- observação versus previsão;
- atualidade dos dados;
- contingências;
- limitações;
- confiança;
- metodologia meteorológica;
- hidrologia;
- produtos de monitoramento;
- critérios operacionais.

É uma das páginas fundamentais para auditabilidade do portal.

---

## 48. O que existe no código, mas NÃO deve ser divulgado hoje como recurso público ativo

### 48.1 PWA/offline plenamente operacional

Manifest, service worker e gerenciador existem, mas o shell atual executa reset emergencial de service worker/cache e não monta `PwaManager`. Portanto: **suspenso**.

### 48.2 Web Push plenamente operacional no navegador

Backend e service worker possuem implementação, mas a ativação do cliente está ligada ao estado do PWA. Portanto: **backend presente, disponibilidade ao usuário não confirmada como ativa**.

### 48.3 Todas as câmeras permanentemente online

Existem slots para Laranjal, Centro e São Gonçalo. Somente transmissões realmente descobertas/configuradas devem ser descritas como online.

### 48.4 Todas as migrações Supabase aplicadas em produção

Arquivos SQL versionados não constituem prova de aplicação no banco oficial.

### 48.5 IA como fonte do tempo

Não é. IA é opcional e editorial. Não usar frases comerciais que deem a entender que “a IA prevê o tempo” ou “a IA mede o clima”.

### 48.6 Mapa de geada como previsão futura

O recurso atual mostra ocorrência observada/histórica conforme os dados INMET consultados.

### 48.7 Radar/satélite como previsão futura

São produtos de observação remota recente/passada.

### 48.8 Histórico de 30 dias como climatologia oficial

É histórico meteorológico recente, não normal climatológica de longo prazo.

### 48.9 “Agora” das cidades regionais como estação meteorológica observada

Nas páginas regionais, a condição vem do serviço meteorológico/modelo configurado; não é equivalente à estação Embrapa de Pelotas.

### 48.10 Recursos ainda apenas conceituais

Não fazem parte deste inventário como funcionalidades atuais, por exemplo:

- “Central de Monitoramento” como nova página unificada;
- “Painel Operacional” dedicado;
- seção específica “Mar e Lagoa”;
- novas fontes marítimas/ondas/marés ainda não implementadas;
- qualquer reorganização futura da Home ainda não mergeada.

Esses conceitos podem ser planejados depois a partir deste inventário.

---

## 49. Limitações conhecidas e pontos de atenção

1. **Semântica visual do Hero:** a condição textual/ícone pode ser derivada da previsão quando a Embrapa não fornece uma condição observada, mesmo com números atuais da Embrapa. Deve ser corrigido para não sugerir “chuva agora” como observação quando for previsão.
2. **Páginas regionais:** o campo atual usa Open-Meteo/modelo e não estação local observada.
3. **PWA:** implementação existente está atualmente suspensa pelo reset emergencial no root.
4. **Push:** backend implementado, mas a ativação do cliente precisa acompanhar a reativação segura do service worker.
5. **Supabase:** recursos dependentes do banco precisam de validação do ambiente oficial antes de serem considerados operacionais em produção.
6. **Orçamento Gemini:** migration está versionada, mas a aplicação no Supabase oficial não foi comprovada nesta auditoria.
7. **CI global:** existe dívida de contratos legados; acompanhamento separado é necessário.
8. **Câmeras:** disponibilidade varia de acordo com transmissão e configuração.
9. **Fontes externas:** INMET, Embrapa, CPPMet, REDEMET, LabHidroSens, FURG/Portos RS, SACE/SGB, Open-Meteo, MET Norway e demais fornecedores podem ficar parciais ou indisponíveis; o portal possui degradação/fallback, mas não controla a fonte.
10. **Blog:** implementado na `main`, mas ausente do sitemap publicado observado na auditoria de 16/08/2026; verificar sincronização/deploy.
11. **Índice de busca:** resultados antigos em `www` podem persistir mesmo com canonicalização atual para o domínio raiz.
12. **Hidrologia:** referências de atenção/perigo e níveis não substituem orientação oficial de Defesa Civil, autoridade portuária ou órgão competente.

---

## 50. Matriz resumida de fontes

| Fonte | Papel no portal | Tipo | Substitui observação local de Pelotas? |
|---|---|---|---|
| Embrapa Clima Temperado | condição atual de Pelotas | observação de estação | **Sim — é a fonte observada prioritária** |
| INMET | avisos, previsão municipal, estação de referência, geadas | oficial | Não substitui automaticamente a Embrapa como medição atual |
| CPPMet / UFPel | contexto regional e RSS meteorológico | oficial/acadêmico regional | Não |
| Open-Meteo | previsão operacional, histórico e recuperação | modelo/API meteorológica | Não |
| MET Norway | contingência de previsão | modelo/API meteorológica | Não |
| REDEMET / DECEA | radar, satélite e trovoadas | sensoriamento/monitoramento oficial | Não |
| LabHidroSens / UFPel | nível do Laranjal | observação hidrológica | N/A |
| FURG / Portos RS | rede regional da Lagoa dos Patos | observação hidrológica | N/A |
| TideSat / MetSul | nível do Guaíba no fluxo principal | monitoramento hidrológico | N/A |
| SACE / SGB | contexto oficial do Guaíba | monitoramento oficial | N/A |
| NASA POWER | fallback de histórico recente | dados meteorológicos históricos | Não |
| YouTube/canais configurados | câmera ao vivo/replay | imagem pública | Não |

---

## 51. Inventário das rotas públicas indexáveis da `main`

Rotas fixas registradas em `PUBLIC_ROUTES`:

1. `/`
2. `/tempo-hoje-pelotas`
3. `/tempo-amanha-pelotas`
4. `/previsao-7-dias-pelotas`
5. `/chuva-em-pelotas`
6. `/vento-em-pelotas`
7. `/meteograma-pelotas`
8. `/alertas`
9. `/radar-e-satelite-pelotas`
10. `/mapa-de-geadas-rio-grande-do-sul`
11. `/situacao-hidrologica-pelotas`
12. `/nivel-da-lagoa-dos-patos-laranjal`
13. `/estacao-embrapa-pelotas`
14. `/clima-em-pelotas`
15. `/historico-climatico-pelotas`
16. `/cameras-ao-vivo-pelotas`
17. `/tempo-na-regiao-sul-rs`
18. `/blog`
19. `/metodologia`
20. `/privacidade-e-dados`

Somam-se 23 páginas regionais dinâmicas para cidades diferentes de Pelotas, totalizando **43 rotas indexáveis esperadas pela `main` atual**.

Na fotografia do runtime auditado, o sitemap publicado continha 42, devido à ausência de `/blog` no sitemap servido naquele instante.

---

## 52. Arquivos-chave para manutenção do inventário

Quando uma nova funcionalidade for adicionada, revisar pelo menos:

### Rotas e SEO

- `src/routeTree.gen.ts`;
- `src/lib/public-routes.ts`;
- `src/lib/sitemap.ts`;
- `src/lib/site-config.ts`;
- `src/lib/page-meta.ts`;
- `src/lib/structured-data.ts`.

### Meteorologia

- `src/lib/weather/official-sources.server.ts`;
- `src/lib/weather/aggregated-weather.server.ts`;
- `src/lib/weather/weather-intelligence.server.ts`;
- `src/production/adapters/home.ts`;
- `src/production/ProductionHome.tsx`.

### Hidrologia

- `src/lib/hydrology/laranjal-level.server.ts`;
- `src/lib/hydrology/lagoon-network.server.ts`;
- `src/lib/hydrology/guaiba.server.ts`;
- `src/lib/hydrology/sace-guaiba.server.ts`.

### Monitoramento remoto

- `src/lib/redemet/`;
- `src/lib/inmet/frost.server.ts`;
- `src/lib/cameras/cameras.server.ts`.

### Dados públicos

- `src/lib/public-portal.server.ts`;
- `src/routes/feed.ts`;
- `src/routes/pelotas[.]json.ts`;
- `src/routes/embed/`;
- `src/routes/widgets/`.

### Conta/PWA/Push

- `src/components/auth/`;
- `src/components/pwa/PwaManager.tsx`;
- `public/sw.js`;
- `public/manifest.webmanifest`;
- `src/lib/push/`;
- `src/routes/api/push/`.

### Operação

- `.github/workflows/`;
- `supabase/migrations/`;
- `tests/`.

---

## 53. Regra para evolução futura deste documento

`docs/Recursos.md` deve representar o **produto que existe**, e não o backlog de ideias.

Ao adicionar ou remover um recurso:

1. atualizar a descrição funcional;
2. informar a rota;
3. informar a fonte de dados;
4. dizer se é observação, previsão, contexto ou conteúdo editorial;
5. registrar dependências externas;
6. registrar estado de disponibilidade/configuração;
7. registrar fallback/contingência;
8. registrar cache/frescor quando relevante;
9. registrar endpoints públicos relacionados;
10. atualizar a seção de limitações;
11. verificar se a rota aparece no sitemap quando deve ser indexável;
12. executar smoke no domínio publicado depois do deploy.

A intenção é que este arquivo possa ser usado como base para:

- decisões de UX e reorganização do portal;
- auditorias técnicas;
- planejamento de novas páginas;
- conteúdo editorial;
- material institucional/comercial;
- onboarding de desenvolvimento;
- comparação entre o que foi planejado e o que realmente está ativo;
- prevenção de regressões de produto e comunicação.
