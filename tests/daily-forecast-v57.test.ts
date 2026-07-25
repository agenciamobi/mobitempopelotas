import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sharedComponent = readFileSync("src/components/weather/DailyForecastPagesV2.tsx", "utf8");
const sharedStyles = readFileSync("src/components/weather/DailyForecastPagesV2.css", "utf8");
const todayComponent = readFileSync("src/components/weather/TodayForecastPageV3.tsx", "utf8");
const todayStyles = readFileSync("src/components/weather/TodayForecastPageV3.css", "utf8");
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");

test("today uses its dedicated complete experience while tomorrow remains isolated", () => {
  assert.match(todayRoute, /TodayForecastPageV3/);
  assert.match(todayRoute, /components\/weather\/TodayForecastPageV3/);
  assert.doesNotMatch(todayRoute, /TodayForecastPageV2/);
  assert.match(tomorrowRoute, /TomorrowForecastPageV2/);
  assert.match(sharedComponent, /export function TomorrowForecastPageV2/);
});

test("the today hero is driven by real condition, source and remaining-day values", () => {
  assert.match(todayComponent, /today-v3-hero/);
  assert.match(todayComponent, /current\.condition/);
  assert.match(todayComponent, /current\.temperature/);
  assert.match(todayComponent, /currentSourceLabel\(recoveredData\)/);
  assert.match(todayComponent, /today\.min/);
  assert.match(todayComponent, /today\.max/);
  assert.match(todayComponent, /today\.rainChance/);
  assert.match(todayComponent, /current\?\.sunset/);
  assert.doesNotMatch(todayComponent, /ForecastPageHeader/);
});

test("the current condition distinguishes observation from model fallback", () => {
  assert.match(todayComponent, /quality\.currentSource === "embrapa"/);
  assert.match(todayComponent, /Medição observada pela Embrapa Clima Temperado/);
  assert.match(todayComponent, /Condição estimada pelo MET Norway/);
  assert.match(todayComponent, /Condição estimada por \$\{data\.weather\.quality\.forecastProvider/);
  assert.match(todayComponent, /observed \? "Observado agora" : "Estimado agora"/);
});

test("the page selects the most relevant severe alert and keeps validity explicit", () => {
  assert.match(todayComponent, /alertSeverityRank/);
  assert.match(todayComponent, /right\.relevance === "pelotas"/);
  assert.match(todayComponent, /right\.period === "active"/);
  assert.match(todayComponent, /alertSeverityRank\[right\.severity\]/);
  assert.match(todayComponent, /Em vigor — horário não informado pelo INMET/);
  assert.match(todayComponent, /today-v3-alert is-\$\{relevantAlert\.severity\}/);
});

test("current metrics disclose field-level provenance and observation integrity", () => {
  for (const field of ["humidity", "windSpeed", "windDirection", "pressure", "sunrise", "sunset"]) {
    assert.match(todayComponent, new RegExp(`currentProvenance\\.${field}`));
  }
  assert.match(todayComponent, /Cada campo mantém sua origem identificada/);
  assert.match(todayComponent, /Medição não é previsão/);
  assert.match(todayComponent, /observationAgeMinutes/);
  assert.match(todayComponent, /degradedSources\.length/);
});

test("hourly evolution compares temperature, rain, wind and gusts accessibly", () => {
  assert.match(todayComponent, /weather\.hourly\.slice\(0, 12\)/);
  assert.match(todayComponent, /hottestHour/);
  assert.match(todayComponent, /wettestHour/);
  assert.match(todayComponent, /windiestHour/);
  assert.match(todayComponent, /aria-label="Previsão horária para hoje"/);
  assert.match(todayComponent, /today-v3-temperature-scale/);
  assert.match(todayComponent, /hour\.windGust/);
  assert.match(todayComponent, /data-rain=\{rainTone\}/);
});

test("today visual system covers the full route and remains responsive", () => {
  assert.match(todayStyles, /\.today-v3-hero\s*\{/);
  assert.match(todayStyles, /grid-template-columns:\s*minmax\(0, 1\.12fr\)/);
  assert.match(todayStyles, /\.today-v3-now\s*\{/);
  assert.match(todayStyles, /\.today-v3-window-grid/);
  assert.match(todayStyles, /\.today-v3-observation-layout/);
  assert.match(todayStyles, /scroll-snap-type:\s*x mandatory/);
  assert.match(todayStyles, /\.today-v3-reading\s*\{/);
  assert.match(todayStyles, /data-topic="tempo-hoje-pelotas"/);
  assert.match(todayStyles, /content-visibility:\s*auto/);
  assert.match(todayStyles, /@media \(max-width: 960px\)/);
  assert.match(todayStyles, /@media \(max-width: 720px\)/);
  assert.match(todayStyles, /@media \(max-width: 460px\)/);
  assert.match(todayStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(todayStyles, /backdrop-filter/);
});

test("tomorrow shared visual layer remains available and unchanged", () => {
  assert.match(sharedStyles, /\.daily-condition-card--tomorrow/);
  assert.match(sharedStyles, /@media \(max-width: 900px\)/);
  assert.match(sharedStyles, /@media \(max-width: 680px\)/);
});
