import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/SevenDayRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/SevenDayRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/SevenDayForecastPageV2.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/SevenDayForecastPageV2.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

const remValues = [...pageStyles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("seven day route uses the retail shell with a dedicated hero", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /SevenDayRetailHero/);
  assert.match(route, /SevenDayForecastPageV2/);
  assert.match(route, /pageClassName="internal-weather-shell--seven-day"/);
  assert.match(route, /hero=\{\(\{ weather: productionWeather, advisoryLevel, officialAlertCount \}\)/);
  assert.doesNotMatch(route, /SevenDayForecastPage\s/);
  assert.doesNotMatch(route, /components\/weather\/ForecastPages/);
});

test("weekly hero is derived from the seven daily forecasts", () => {
  assert.match(hero, /weather\.daily\.slice\(0, 7\)/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /Sua semana em Pelotas/);
  assert.match(hero, /organizada para planejar/);
  assert.match(hero, /Menor mínima/);
  assert.match(hero, /Maior chuva/);
  assert.match(hero, /Rajada máxima/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /today-retail-hero__photo-credit/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /weather\.current\.temperature/);
});

test("weekly page compares days and separates trend, risk and official context", () => {
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Compare os sete dias sem perder contexto/);
  assert.match(page, /Como a faixa de temperatura muda/);
  assert.match(page, /Os períodos que merecem nova consulta/);
  assert.match(page, /INMET e CPPMet\/UFPel/);
  assert.match(page, /riskScore/);
  assert.match(page, /rainRanking/);
  assert.match(page, /windRanking/);
  assert.match(page, /--week-low/);
  assert.match(page, /Nenhum valor demonstrativo foi inserido/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /ForecastPageHeader/);
  assert.doesNotMatch(page, /forecast-seven-day-list/);
});

test("weekly sections use the exact header rail", () => {
  assert.match(
    shellStyles,
    /\.internal-weather-shell--seven-day \.seven-day-retail-hero__inner[\s\S]*max-width:\s*var\(--internal-weather-frame-max\)/,
  );
  assert.match(
    shellStyles,
    /\.internal-weather-shell--seven-day \.seven-day-v2-page,[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.match(shellStyles, /padding-right:\s*var\(--internal-weather-frame-gutter\)/);
  assert.match(shellStyles, /padding-left:\s*var\(--internal-weather-frame-gutter\)/);
});

test("weekly visual system is readable and responsive", () => {
  assert.match(heroStyles, /weekly planning accent/);
  assert.match(heroStyles, /font-size:\s*clamp\(0\.75rem/);
  assert.match(heroStyles, /@media \(max-width: 920px\)/);
  assert.match(heroStyles, /@media \(max-width: 700px\)/);
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
  assert.ok(remValues.every((value) => value >= 0.72), "microtext must stay readable");
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /content-visibility:\s*auto/);
  assert.match(pageStyles, /@media \(max-width: 1280px\)/);
  assert.match(pageStyles, /@media \(max-width: 900px\)/);
  assert.match(pageStyles, /@media \(max-width: 560px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /:focus-visible/);
});
