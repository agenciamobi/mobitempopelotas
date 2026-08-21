# Hardening de estados degradados da previsão — 21/08/2026

## Objetivo

Registrar as regras funcionais adotadas nas páginas públicas para impedir que ausência, zero, parcialidade ou empate de dados sejam apresentados como destaques meteorológicos inexistentes.

## Regras consolidadas

### Ausência não é zero

- `null`/ausência significa dado não informado ou em atualização; não pode ser convertido em `0` para texto, badge ou interpretação pública.
- Zero realmente publicado continua sendo um valor válido e deve ser apresentado como zero quando a grandeza assim exigir.
- Fallbacks numéricos continuam permitidos apenas em cálculos internos quando não alteram a semântica exibida ao visitante.

### Navegação

- CTAs internos só apontam para âncoras cuja série necessária está disponível.
- Quando a série está ausente, o CTA muda para uma rota pública útil em vez de manter uma âncora morta.
- No Vento, capítulos condicionais do índice são ocultados quando o respectivo `id` não foi renderizado.
- Em Hoje, os capítulos de previsão horária, planejamento e atmosfera desaparecem do índice quando seus componentes não renderizam.
- Nas páginas regionais, capítulos de próximas horas e próximos dias acompanham a existência real dos blocos correspondentes.

### Rajada x vento sustentado

- `windGust` e `windSpeed` são grandezas diferentes.
- `windSpeed` pode ser usado como proxy interno de risco de vento quando a lógica explicita esse objetivo.
- `windSpeed` nunca pode ser exibido ao visitante com o rótulo de rajada.
- `windGust === null` significa rajada não informada.
- `windGust <= 0` é apresentado como ausência de rajada prevista, não como `0 km/h` destacado.
- Rankings de rajada e direção associada à maior rajada exigem uma rajada positiva realmente publicada.

### Chuva

- Probabilidade e volume permanecem separados.
- `0%` é um valor de previsão válido, mas não cria artificialmente um “horário de maior chance”.
- Probabilidade não informada não pode ser apresentada como `0%` ou “sem chuva”.
- `0 mm` em toda a janela não cria “dia mais chuvoso” nem “maior volume” associado arbitrariamente a um dia.
- Soma horária parcial não pode ser rotulada como total completo de 12h/24h; a interface deve indicar quantos horários possuem volume publicado.
- Horário sem `precipitationMm` deve ser distinguido visual e textualmente de um horário com `0 mm` publicado.

### Empates e ausência de contraste

- Quando todos os períodos possuem a mesma pontuação, a interface não elege arbitrariamente um “melhor período” ou “horário de maior atenção”.
- Empates de temperatura máxima/mínima são apresentados como empate, sem selecionar o primeiro dia do array como vencedor.
- Empate entre direções mais frequentes do vento é apresentado como “Sem direção dominante”.
- Cores semânticas de destaque devem acompanhar contraste real nos dados.

### Estado atual sem leitura

- Uma condição atual só pode ser marcada como observada quando o dado atual está realmente disponível.
- Ausência simultânea de observação e previsão horária deve ser apresentada como atualização/indisponibilidade, sem condição meteorológica inventada.
- A Home principal diferencia “Agora”, “Previsão” e “Atualizando” conforme a disponibilidade real de observação e série horária.

### Atmosfera, neblina e nuvens

- Avaliações de neblina não preenchem umidade, nuvens baixas ou visibilidade ausentes com valores artificiais para produzir uma classificação.
- Se ponto de orvalho e temperatura estiverem próximos, mas faltarem sinais complementares, o estado permanece inconclusivo.
- Camada de nuvem ausente é apresentada como “não informada”; não equivale a `0%`.
- Cobertura total de nuvens só é exibida quando `cloudCover` foi publicado; não é reconstruída tomando o máximo entre as camadas baixa/média/alta.

### Previsão semanal

- O rótulo de um dia “estável” é absoluto (`Sem destaque`) e não afirma que ele possui os menores valores em comparação com outros dias.
- Uma grande amplitude térmica semanal pode ser o principal destaque mesmo quando chuva e rajadas estão zeradas.
- Rankings de chuva e rajadas semanais incluem somente valores positivos publicados.

## Componentes cobertos

- `TodayRetailHero`
- `TomorrowRetailHero`
- `SevenDayRetailHero`
- `RainRetailHero`
- `TodayForecastPageV5`
- `TodayWeatherResources`
- `TodayAtmosphericSignals`
- `RainForecastPageV2`
- `RainHourlyVolumeContext`
- `WindForecastPageV3`
- `WindDirectionContext`
- `HomeForecastStory`
- `home-forecast-editorial`
- `home-forecast-trend`
- `weather-hero`
- `RegionalCityHero`
- `WindNavigationAvailability.css`
- `TodayNavigationAvailability.css`
- `RegionalCityAccentContract.css`

## Testes relacionados

- `tests/forecast-empty-navigation.test.ts`
- `tests/public-hourly-detail-layers.test.ts`
- `tests/rain-retail-visual.test.ts`
- `tests/seven-day-retail-visual.test.ts`
- `tests/tomorrow-retail-visual.test.ts`
- `tests/regional-city-editorial.test.ts`
- `tests/wind-copy.test.ts`

O contrato transversal `forecast-empty-navigation.test.ts` faz parte de `npm run test:contracts`.
