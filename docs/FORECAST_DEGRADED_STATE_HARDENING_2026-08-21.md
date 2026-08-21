# Hardening de estados degradados da previsão — 21/08/2026

## Objetivo

Registrar as regras funcionais adotadas nas páginas públicas para impedir que ausência, zero ou empate de dados sejam apresentados como destaques meteorológicos inexistentes.

## Regras consolidadas

### Navegação

- CTAs internos só apontam para âncoras cuja série necessária está disponível.
- Quando a série está ausente, o CTA muda para uma rota pública útil em vez de manter uma âncora morta.
- No Vento, capítulos condicionais do índice são ocultados quando o respectivo `id` não foi renderizado.

### Rajada x vento sustentado

- `windGust` e `windSpeed` são grandezas diferentes.
- `windSpeed` pode ser usado como proxy interno de risco de vento quando a lógica explicita esse objetivo.
- `windSpeed` nunca pode ser exibido ao visitante com o rótulo de rajada.
- `windGust === null` significa rajada não informada.
- `windGust <= 0` é apresentado como ausência de rajada prevista, não como `0 km/h` destacado.

### Chuva

- Probabilidade e volume permanecem separados.
- `0%` é um valor de previsão válido, mas não cria artificialmente um “horário de maior chance”.
- `0 mm` em toda a janela não cria “dia mais chuvoso” nem “maior volume” associado arbitrariamente a um dia.

### Empates e ausência de contraste

- Quando todos os períodos possuem a mesma pontuação, a interface não elege arbitrariamente um “melhor período” ou “horário de maior atenção”.
- Cores semânticas de destaque devem acompanhar contraste real nos dados.

### Estado atual sem leitura

- Uma condição atual só pode ser marcada como observada quando o dado atual está realmente disponível.
- Ausência simultânea de observação e previsão horária deve ser apresentada como atualização/indisponibilidade, sem condição meteorológica inventada.

## Componentes cobertos

- `TodayRetailHero`
- `TomorrowRetailHero`
- `SevenDayRetailHero`
- `RainRetailHero`
- `TodayWeatherResources`
- `RainForecastPageV2`
- `WindForecastPageV3`
- `HomeForecastStory`
- `WindNavigationAvailability.css`

## Testes relacionados

- `tests/forecast-empty-navigation.test.ts`
- `tests/public-hourly-detail-layers.test.ts`
- `tests/rain-retail-visual.test.ts`
- `tests/seven-day-retail-visual.test.ts`
- `tests/wind-copy.test.ts`

O contrato transversal `forecast-empty-navigation.test.ts` faz parte de `npm run test:contracts`.
