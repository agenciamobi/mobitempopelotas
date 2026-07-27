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
  assert.doesNotMatch(route, /RainPage/);
  assert.doesNotMatch(route, /showOfficialAlerts=\{false\}/);
});

test("rain hero separates probability, volume and timing", () => {
  assert.match(hero, /A chuva em Pelotas/);
  assert.match(hero, /organizada por horário/);
  assert.match(hero, /Maior chance próxima/);
  assert.match(hero, /Volume hoje/);
  assert.match(hero, /Acumulado 7 dias/);
  assert.match(hero, /Horas com sinal/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /<h1/);
});

test("rain page is decision-focused and has no duplicate hero", () => {
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /buildWindows/);
  assert.match(page, /Probabilidade indica a chance de ocorrência/);
  assert.match(page, /Quando a probabilidade aumenta/);
  assert.match(page, /Chance e volume não significam a mesma coisa/);
  assert.match(page, /Transforme a previsão em decisões simples/);
  assert.match(page, /Alertas e previsão do INMET/);
  assert.match(page, /Nenhum valor demonstrativo foi inserido/);
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
