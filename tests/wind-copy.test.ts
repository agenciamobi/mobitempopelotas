import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const page = readFileSync("src/components/weather/WindForecastPageV3.tsx", "utf8");
const styles = readFileSync("src/components/weather/WindForecastPageV3.css", "utf8");

const windSource = `${route}\n${page}`;

test("wind route uses the deeper source-aware page", () => {
  assert.match(route, /WindForecastPageV3/);
  assert.match(route, /pageClassName="internal-weather-shell--wind"/);
  assert.match(route, /Veja vento atual com procedência/);
  assert.match(route, /WIND_PAGE_CONTENT/);
  assert.match(route, /Como ler velocidade, direção e rajadas em Pelotas/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, WIND_PAGE_CONTENT\.faqs\)/);
  assert.match(route, /staleTime: 5 \* 60 \* 1_000/);
  assert.doesNotMatch(route, /WindForecastPageV2/);
});

test("wind page uses field-level provenance instead of a single current source", () => {
  assert.match(page, /currentProvenance\.windSpeed/);
  assert.match(page, /currentProvenance\.windDirection/);
  assert.match(page, /sourceName\(windSource\)/);
  assert.match(page, /sourceName\(directionSource\)/);
  assert.match(page, /Horário da condição/);
  assert.match(page, /Consulta do portal/);
  assert.match(page, /current\?\.observedAt/);
  assert.doesNotMatch(page, /quality\.currentSource/);
  assert.match(route, /A condição atual é consolidada campo a campo/);
});

test("wind page expands the hourly window to 24 hours", () => {
  assert.match(page, /weather\.hourly\.slice\(0, 24\)/);
  assert.match(page, /Próximas 24 horas/);
  assert.match(page, /Velocidade e rajada por horário/);
  assert.match(page, /wind-v3-hourly-list/);
  assert.match(page, /hour\.windSpeed/);
  assert.match(page, /hour\.windGust/);
  assert.match(page, /Rajada menos velocidade no mesmo horário/);
  assert.doesNotMatch(page, /slice\(0, 12\)/);
});

test("future direction is not fabricated from the current reading", () => {
  assert.match(page, /A série integrada não fornece direção futura por hora/);
  assert.match(page, /não repete a direção atual como se fosse previsão/);
  assert.match(route, /sem inventar direção horária ausente/);
  assert.match(route, /Por que a direção não aparece em cada horário futuro\?/);
  assert.doesNotMatch(page, /hour\.windDirection/);
});

test("editorial wind bands are never presented as official alerts", () => {
  assert.match(page, /Faixa editorial mais intensa/);
  assert.match(page, /Faixa editorial elevada/);
  assert.match(page, /Faixa editorial moderada/);
  assert.match(page, /As faixas visuais não substituem alertas oficiais/);
  assert.match(route, /As faixas visuais da página são editoriais/);
  assert.match(route, /As faixas de intensidade da página são alertas oficiais\?/);
  assert.doesNotMatch(windSource, /alerta oficial de 50 km\/h/i);
  assert.doesNotMatch(windSource, /alerta oficial de 70 km\/h/i);
});

test("peak hours and weekly gusts remain transparent forecasts", () => {
  assert.match(page, /function peakHours/);
  assert.match(page, /sort\(\(a, b\) => \(b\.windGust \?\? b\.windSpeed\)/);
  assert.match(page, /Maiores valores dentro da janela/);
  assert.match(page, /O ranking usa a rajada quando disponível/);
  assert.match(page, /Próximos 7 dias/);
  assert.match(page, /Maior rajada prevista em cada dia/);
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
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
  assert.match(route, /Qual é a diferença entre velocidade do vento e rajada\?/);
  assert.match(route, /O que significa a direção do vento\?/);
  assert.match(route, /O vento mostrado agora foi medido\?/);
  assert.match(route, /Por que a direção não aparece em cada horário futuro\?/);
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
