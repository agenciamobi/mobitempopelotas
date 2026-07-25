import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("src/components/weather/DailyForecastPagesV2.tsx", "utf8");
const styles = readFileSync("src/components/weather/DailyForecastPagesV2.css", "utf8");
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");

test("today and tomorrow routes use the data-led daily pages", () => {
  assert.match(todayRoute, /TodayForecastPageV2/);
  assert.match(tomorrowRoute, /TomorrowForecastPageV2/);
  assert.doesNotMatch(todayRoute, /TodayForecastPage from/);
  assert.doesNotMatch(tomorrowRoute, /TomorrowForecastPage from/);
});

test("the first folds expose real weather values instead of a generic empty cover", () => {
  assert.match(component, /daily-hero daily-hero--today/);
  assert.match(component, /daily-hero daily-hero--tomorrow/);
  assert.match(component, /current\.temperature/);
  assert.match(component, /tomorrow\.min/);
  assert.match(component, /tomorrow\.max/);
  assert.match(component, /tomorrow\.precipitationMm/);
  assert.match(component, /tomorrow\.windGust/);
  assert.match(component, /daily-condition-card/);
  assert.doesNotMatch(component, /ForecastPageHeader/);
});

test("the current condition distinguishes observation from model fallback", () => {
  assert.match(component, /quality\.currentSource === "embrapa"/);
  assert.match(component, /Medição observada · Embrapa Clima Temperado/);
  assert.match(component, /Condição estimada · MET Norway/);
  assert.match(component, /Condição estimada · \$\{data\.weather\.quality\.forecastProvider/);
  assert.match(component, /observed \? "Observado agora" : "Estimativa atual"/);
});

test("daily pages preserve chapters, alerts, sources and accessible hourly labels", () => {
  for (const anchor of [
    "#agora",
    "#medicao-atual",
    "#proximas-horas",
    "#leitura-do-dia",
    "#como-interpretar-hoje",
    "#resumo-amanha",
    "#indicadores-amanha",
    "#planejamento-amanha",
    "#perguntas-amanha",
  ]) {
    assert.match(component, new RegExp(anchor));
  }
  assert.match(component, /aria-label="Previsão horária para hoje"/);
  assert.match(component, /Aviso oficial em vigor/);
  assert.match(component, /daily-source-note/);
  assert.match(component, /FAQPage/);
});

test("the visual system is responsive, solid and defers below-fold rendering", () => {
  assert.match(styles, /\.daily-hero\s*\{/);
  assert.match(styles, /grid-template-columns:\s*minmax\(0, 1\.12fr\)/);
  assert.match(styles, /\.daily-condition-card\s*\{/);
  assert.match(styles, /linear-gradient\(145deg, #062235/);
  assert.match(styles, /\.daily-condition-card--tomorrow/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /scroll-snap-type:\s*x mandatory/);
  assert.match(styles, /@media \(max-width: 900px\)/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /backdrop-filter/);
});
