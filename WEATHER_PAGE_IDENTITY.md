# Identidade das páginas meteorológicas

Este documento define o contrato visual das páginas do Tempo Pelotas. O objetivo é impedir que cada rota crie uma composição própria para os mesmos tipos de informação.

## Componentes estruturais

As páginas de previsão devem reutilizar os componentes abaixo antes de criar qualquer alternativa:

1. `TodayRetailHero`
   - primeira dobra da página `/tempo-hoje-pelotas`;
   - concentra condição atual, fotografia contextual e métricas rápidas do dia.

2. `WeatherSplitHero`
   - primeira dobra editorial dividida em bloco escuro e painel operacional claro;
   - deriva da composição aprovada em `/vento-em-pelotas`;
   - usado nas rotas `/tempo-em/...`, com cidade, temperatura, chuva, faixa diária e rajadas parametrizadas.

3. `home-inmet-alerts`
   - contrato visual do aviso oficial do INMET;
   - mantém marca lateral, classificação, abrangência, validade e ação oficial na mesma posição.

4. `InternalPageChapters`
   - navegação numerada entre os capítulos da página;
   - textos e destinos podem variar, mas estrutura, tipografia e comportamento responsivo permanecem iguais.

5. `HomeForecastStory`
   - cabeçalho editorial, métricas do dia, resumo das próximas horas, cards horários e tendência diária;
   - recebe `locationName` e dados adaptados, sem manter grades alternativas por cidade.

6. `InternalObservationWidget` e `InternalPracticalSummary`
   - devem ser usados quando a página tiver medição observada ou orientação prática equivalente.

## Regra de arquitetura

Diferenças entre cidades e fontes pertencem a adaptadores de dados, não a novos componentes visuais.

- Pelotas usa os dados meteorológicos agregados do portal.
- As páginas municipais usam `regional-city-forecast-story.ts` para converter os dados regionais ao contrato compartilhado da previsão.
- A primeira dobra municipal usa `RegionalCityHero` apenas como adaptador de conteúdo para `WeatherSplitHero`.
- Valores indisponíveis permanecem indisponíveis; os adaptadores não devem inventar números para satisfazer o componente.

## Regra de evolução

Antes de criar um novo hero, aviso, navegação, resumo, grade horária ou card diário:

1. verificar se um componente equivalente já existe;
2. parametrizar o componente existente;
3. criar um adaptador quando a fonte de dados for diferente;
4. adicionar um componente novo somente quando a semântica também for realmente diferente.

Mudanças de identidade devem ser feitas no componente compartilhado para alcançar todas as páginas que o utilizam.
