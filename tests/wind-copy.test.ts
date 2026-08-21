import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const page = readFileSync("src/components/weather/WindForecastPageV3.tsx", "utf8");
const styles = readFileSync("src/components/weather/WindForecastPageV3.css", "utf8");
const navigationAvailabilityStyles = readFileSync(
  "src/components/weather/WindNavigationAvailability.css",
  "utf8",
);

const windSource = `${route}\n${page}`;

test("wind route uses the deeper source-aware page", () => {
  assert.match(route, /WindForecastPageV3/);
  assert.match(route, /WindNavigationAvailability\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--wind"/);
  assert.match(route, /Veja o vento agora, direção observada, direção prevista por hora/);
  assert.match(route, /WIND_PAGE_CONTENT/);
  assert.match(route, /Como ler vento, direção e rajadas em Pelotas/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, WIND_PAGE_CONTENT\.faqs\)/);
  assert.match(route, /staleTime: 5 \* 60 \* 1_000/);
  assert.doesNotMatch(route, /WindForecastPageV2/);
});

test("wind page uses field-level provenance instead of a single current source", () => {
  assert.match(page, /currentProvenance\.windSpeed/);
  assert.match(page, /currentProvenance\.windDirection/);
  assert.match(page, /sourceName\(windSource\)/);
  assert.match(page, /sourceName\(directionSource\)/);
  assert.match(page, /Horário do vento atual/);
  assert.match(page, /Última atualização/);
  assert.match(page, /current\?\.observedAt/);
  assert.doesNotMatch(page, /quality\.currentSource/);
  assert.match(route, /O vento atual e a direção observada podem ter origens diferentes/);
});

test("wind page expands the hourly window to 24 hours", () => {
  assert.match(page, /weather\.hourly\.slice\(0, 24\)/);
  assert.match(page, /Próximas 24 horas/);
  assert.match(page, /Vento e rajadas por horário/);
  assert.match(page, /wind-v3-hourly-list/);
  assert.match(page, /hour\.windSpeed/);
  assert.match(page, /hour\.windGust/);
  assert.match(page, /Quanto a rajada supera o vento naquele horário/);
  assert.doesNotMatch(page, /slice\(0, 12\)/);
});

test("future direction is an explicit model forecast, never fabricated from the current reading", () => {
  assert.match(route, /direção prevista por hora/i);
  assert.match(route, /não é apresentada como medição da estação/i);
  assert.match(page, /direção prevista por horário aparece em uma camada detalhada separada/);
  assert.doesNotMatch(page, /A fonte não informa a direção futura em cada horário/);
  assert.doesNotMatch(page, /hour\.windDirection/);
  assert.match(route, /A direção futura é uma medição da estação\?/);
  assert.match(route, /Por que a direção prevista pode mudar ao longo do dia\?/);
});

test("top wind summary uses objective visitor-facing language", () => {
  assert.match(page, /Rajadas de até \$\{number\(maximum\)\} km\/h nas próximas 24h/);
  assert.match(page, /Sem rajadas positivas previstas nas próximas 24h/);
  assert.match(page, /Vento agora/);
  assert.match(page, /Rajada mais forte nas próximas 24h/);
  assert.match(page, /Resumo da previsão\. Avisos oficiais têm prioridade/);
  assert.match(route, /O resumo do topo apenas organiza os valores previstos/);
  assert.match(route, /O resumo de intensidade do topo é um alerta oficial\?/);
  assert.doesNotMatch(windSource, /Faixa editorial/i);
  assert.doesNotMatch(windSource, /Vento consolidado agora/i);
  assert.doesNotMatch(windSource, /Procedência campo a campo/i);
});

test("peak rankings use only positive published gusts", () => {
  assert.match(page, /function peakHours/);
  assert.match(page, /\.filter\(\(hour\) => \(hour\.windGust \?\? 0\) > 0\)/);
  assert.match(page, /\.sort\(\(a, b\) => \(b\.windGust \?\? 0\) - \(a\.windGust \?\? 0\)\)/);
  assert.match(page, /As rajadas mais fortes das próximas 24 horas/);
  assert.match(page, /Velocidade sustentada não substitui rajada/);
  assert.match(page, /Não há rajadas positivas previstas para as próximas 24 horas/);
  assert.match(page, /Sem rajada prevista/);
  assert.match(page, /Próximos 7 dias/);
  assert.match(page, /Rajada mais forte prevista em cada dia/);
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
});

test("wind hourly CTA never points to an absent hourly section", () => {
  assert.match(page, /hours\.length \? \(/);
  assert.match(page, /href="#vento-por-hora"/);
  assert.match(page, /to="\/previsao-7-dias-pelotas"/);
  assert.match(page, /Ver previsão de 7 dias/);
});

test("wind chapter index hides links to conditional sections that are not rendered", () => {
  assert.match(navigationAvailabilityStyles, /not\(:has\(#vento-por-hora\)\)/);
  assert.match(navigationAvailabilityStyles, /a\[href="#vento-por-hora"\]/);
  assert.match(navigationAvailabilityStyles, /not\(:has\(#vento-na-semana\)\)/);
  assert.match(navigationAvailabilityStyles, /a\[href="#vento-na-semana"\]/);
  assert.match(navigationAvailabilityStyles, /not\(:has\(#direcao-do-vento-por-hora\)\)/);
  assert.match(navigationAvailabilityStyles, /a\[href="#direcao-do-vento-por-hora"\]/);
  assert.doesNotMatch(navigationAvailabilityStyles, /!important/);
});

test("wind alerts come only from active official alert records", () => {
  assert.match(page, /alert\.period === "active"/);
  assert.match(page, /vento\|vendaval\|rajada\|tempestade\|ciclone/);
  assert.match(page, /Aviso oficial vigente/);
  assert.match(page, /to="\/alertas"/);
});

test("wind empty state never inserts manual values", () => {
  assert.match(page, /Os dados de vento estão em atualização/);
  assert.match(page, /Nenhuma velocidade ou rajada foi preenchida manualmente/);
  assert.match(page, /!current && weather\.hourly\.length === 0 && weather\.daily\.length === 0/);
});

test("wind FAQ covers interpretation and provenance", () => {
  assert.match(route, /Qual é a diferença entre vento e rajada\?/);
  assert.match(route, /O que significa a direção do vento\?/);
  assert.match(route, /O vento mostrado agora foi medido\?/);
  assert.match(route, /A direção futura é uma medição da estação\?/);
  assert.match(route, /Por que a direção prevista pode mudar ao longo do dia\?/);
  assert.match(route, /Quando as rajadas exigem mais atenção\?/);
});

test("wind page follows responsive retail and accessibility contracts", () => {
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /scroll-margin-top:\s*8rem/);
  assert.match(styles, /@media \(max-width: 1220px\)/);
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /@media \(max-width: 480px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[0-6][0-9]rem/);
});
