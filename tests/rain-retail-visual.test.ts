import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/RainRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/RainRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/RainForecastPageV2.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

test("rain route uses the shared shell with a dedicated retail hero", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /RainRetailHero/);
  assert.match(route, /RainForecastPageV2/);
  assert.match(route, /pageClassName="internal-weather-shell--rain"/);
  assert.match(route, /hero=\{\(\{ weather: productionWeather, advisoryLevel, officialAlertCount \}\)/);
  assert.match(route, /Veja a chance de chuva em Pelotas/);
  assert.match(route, /RAIN_PAGE_CONTENT/);
  assert.match(route, /Como ler chance e volume de chuva em Pelotas/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, RAIN_PAGE_CONTENT\.faqs\)/);
  assert.doesNotMatch(route, /RainPage/);
  assert.doesNotMatch(route, /showOfficialAlerts=\{false\}/);
});

test("rain hero separates chance, volume and timing in direct language", () => {
  assert.match(hero, /Chuva em Pelotas/);
  assert.match(hero, /chance por horário e volume previsto/);
  assert.match(hero, /Maior chance nas próximas 12 horas/);
  assert.match(hero, /Volume previsto hoje/);
  assert.match(hero, /Total previsto em 7 dias/);
  assert.match(hero, /Horários com 30% ou mais/);
  assert.match(hero, /Horário com maior chance/);
  assert.match(hero, /Dia com maior volume/);
  assert.match(hero, /Rajada em período com chuva/);
  assert.match(hero, /Fonte da previsão/);
  assert.match(hero, /timeReference/);
  assert.match(hero, /alertLabel/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /organizada por horário/);
  assert.doesNotMatch(hero, /aviso\(s\) oficial\(is\)/);
  assert.doesNotMatch(hero, /Dia mais chuvoso/);
});

test("rain page answers when, how much and which period in direct language", () => {
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /buildWindows/);
  assert.match(page, /Resumo da chuva/);
  assert.match(page, /Chance de chuva nas próximas 12 horas/);
  assert.match(page, /Chance e volume de chuva em cada dia/);
  assert.match(page, /Quais períodos têm menor e maior chance de chuva/);
  assert.match(page, /O que o INMET publica sobre chuva em Pelotas/);
  assert.match(page, /Período com menor chance/);
  assert.match(page, /Período com maior chance/);
  assert.match(page, /Chance de chuva indica a possibilidade de precipitação/);
  assert.match(page, /activeAlertLabel/);
  assert.match(page, /officialPeriodLabel/);
  assert.match(page, /Nenhum valor foi estimado manualmente/);
  assert.doesNotMatch(page, /A próxima janela relevante/);
  assert.doesNotMatch(page, /Transforme a previsão em decisões simples/);
  assert.doesNotMatch(page, /ativo\(s\)/);
  assert.doesNotMatch(page, /período\(s\)/);
  assert.doesNotMatch(page, /Nenhum valor demonstrativo foi inserido/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /PageHeader/);
  assert.doesNotMatch(page, /QualitySummary/);
});

test("rain experience uses the exact header rail", () => {
  assert.match(
    shellStyles,
    /\.internal-weather-shell--rain \.rain-retail-hero__inner[\s\S]*max-width:\s*var\(--internal-weather-frame-max\)/,
  );
  assert.match(
    shellStyles,
    /\.internal-weather-shell--rain \.rain-v2-page,[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.match(heroStyles, /max-width:\s*var\(--internal-weather-frame-max\)/);
});

test("rain typography remains readable and responsive", () => {
  assert.match(pageStyles, /font-size:\s*clamp\(0\.75rem/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /@media \(max-width: 980px\)/);
  assert.match(pageStyles, /@media \(max-width: 760px\)/);
  assert.match(pageStyles, /@media \(max-width: 520px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /:focus-visible/);
});
