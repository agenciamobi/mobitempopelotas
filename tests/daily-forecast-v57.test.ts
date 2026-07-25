import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sharedComponent = readFileSync("src/components/weather/DailyForecastPagesV2.tsx", "utf8");
const sharedStyles = readFileSync("src/components/weather/DailyForecastPagesV2.css", "utf8");
const todayComponent = readFileSync("src/components/weather/TodayForecastPageV4.tsx", "utf8");
const todayStyles = readFileSync("src/components/weather/TodayForecastPageV4.css", "utf8");
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");

test("today uses its compact dedicated experience while tomorrow remains isolated", () => {
  assert.match(todayRoute, /TodayForecastPageV4/);
  assert.match(todayRoute, /components\/weather\/TodayForecastPageV4/);
  assert.doesNotMatch(todayRoute, /TodayForecastPageV[23]/);
  assert.match(tomorrowRoute, /TomorrowForecastPageV2/);
  assert.match(sharedComponent, /export function TomorrowForecastPageV2/);
});

test("measurement and visual-condition availability are treated as separate states", () => {
  assert.match(todayComponent, /const hasMeasurement = current\?\.temperature !== null/);
  assert.match(todayComponent, /const hasCondition = Boolean\(current\?\.condition\?\.trim\(\)\)/);
  assert.match(todayComponent, /Medição atual em atualização/);
  assert.match(todayComponent, /Condição visual ainda não classificada/);
  assert.match(todayComponent, /today-v4-unavailable-panel/);
  assert.match(todayComponent, /A previsão por modelo continua ativa/);
  assert.match(todayComponent, /Consultar estação/);
});

test("the today hero remains driven by real values and source semantics", () => {
  assert.match(todayComponent, /today-v4-hero/);
  assert.match(todayComponent, /current\?\.temperature/);
  assert.match(todayComponent, /currentSourceLabel\(recoveredData\)/);
  assert.match(todayComponent, /today\.min/);
  assert.match(todayComponent, /today\.max/);
  assert.match(todayComponent, /today\.rainChance/);
  assert.match(todayComponent, /weather\.inmetForecast\[0\]\?\.sunset/);
  assert.match(todayComponent, /quality\.currentSource === "embrapa"/);
  assert.match(todayComponent, /Medição observada pela Embrapa Clima Temperado/);
  assert.match(todayComponent, /Condição estimada pelo MET Norway/);
});

test("the page selects the most relevant severe alert and keeps validity explicit", () => {
  assert.match(todayComponent, /alertSeverityRank/);
  assert.match(todayComponent, /right\.relevance === "pelotas"/);
  assert.match(todayComponent, /right\.period === "active"/);
  assert.match(todayComponent, /alertSeverityRank\[right\.severity\]/);
  assert.match(todayComponent, /Em vigor — horário não informado pelo INMET/);
  assert.match(todayComponent, /today-v4-alert is-\$\{relevantAlert\.severity\}/);
});

test("the remaining-day window excludes the current slot", () => {
  assert.match(todayComponent, /const futureHours = nextHours\.length > 1 \? nextHours\.slice\(1\) : \[\]/);
  assert.match(todayComponent, /const comparisonHours = futureHours\.length \? futureHours : nextHours/);
  assert.match(todayComponent, /Depois de agora/);
  assert.match(todayComponent, /horários futuros comparados/);
  assert.match(todayComponent, /hottestHour/);
  assert.match(todayComponent, /wettestHour/);
  assert.match(todayComponent, /windiestHour/);
});

test("current metrics disclose provenance and the integrity panel is concise", () => {
  for (const field of ["humidity", "windSpeed", "windDirection", "pressure", "sunrise", "sunset"]) {
    assert.match(todayComponent, new RegExp(`currentProvenance\\.${field}`));
  }
  assert.match(todayComponent, /Valores locais com procedência identificada/);
  assert.match(todayComponent, /Integridade dos dados/);
  assert.match(todayComponent, /Idade da leitura/);
  assert.match(todayComponent, /Complementação/);
});

test("hourly cards separate the temperature scale from rain semantics", () => {
  assert.match(todayComponent, /aria-label="Previsão horária para hoje"/);
  assert.match(todayComponent, /today-v4-temperature-scale/);
  assert.match(todayComponent, /today-v4-rain-badge is-\$\{rainTone\}/);
  assert.match(todayComponent, /hour\.windGust/);
  assert.match(todayStyles, /\.today-v4-temperature-scale > span[\s\S]*linear-gradient\(90deg, var\(--today-v4-cyan\), var\(--today-v4-purple\)\)/);
  assert.match(todayStyles, /\.today-v4-rain-badge\.is-high/);
  assert.doesNotMatch(todayStyles, /article\[data-rain="high"\] \.today-v4-temperature-scale/);
});

test("the practical reading uses an interpretive title instead of repeating the current temperature", () => {
  assert.match(todayComponent, /function buildReadingTitle/);
  assert.match(todayComponent, /Pouca chuva prevista para o restante do dia/);
  assert.match(todayComponent, /Temperaturas baixas devem persistir/);
  assert.match(todayComponent, /Rajadas fortes podem alterar a rotina/);
  assert.match(todayComponent, /<h2 id="today-v4-reading-title">\{readingTitle\}<\/h2>/);
  assert.doesNotMatch(todayComponent, /<h2 id="today-v4-reading-title">\{recoveredData\.brief\.headline\}<\/h2>/);
});

test("duplicate closing links are replaced by one next step", () => {
  assert.match(todayComponent, /className="today-v4-closing"/);
  assert.match(todayComponent, /Ver a previsão para amanhã/);
  assert.doesNotMatch(todayComponent, /today-v4-related/);
  assert.doesNotMatch(todayComponent, /to="\/previsao-7-dias-pelotas"/);
  assert.doesNotMatch(todayComponent, /to="\/radar-e-satelite-pelotas"/);
});

test("the compact visual system covers desktop, mobile and below-fold rendering", () => {
  assert.match(todayStyles, /min-height:\s*clamp\(28rem, 39vw, 36rem\)/);
  assert.match(todayStyles, /\.today-v4-unavailable-panel/);
  assert.match(todayStyles, /\.today-v4-window,\n\.today-v4-observation,\n\.today-v4-hourly\s*\{/);
  assert.match(todayStyles, /border-block:\s*1px solid var\(--today-v4-line\)/);
  assert.match(todayStyles, /\.today-v4-closing/);
  assert.match(todayStyles, /data-topic="tempo-hoje-pelotas"/);
  assert.match(todayStyles, /content-visibility:\s*auto/);
  assert.match(todayStyles, /@media \(max-width: 900px\)/);
  assert.match(todayStyles, /@media \(max-width: 680px\)/);
  assert.match(todayStyles, /@media \(max-width: 460px\)/);
  assert.match(todayStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(todayStyles, /backdrop-filter/);
});

test("tomorrow shared visual layer remains available and unchanged", () => {
  assert.match(sharedStyles, /\.daily-condition-card--tomorrow/);
  assert.match(sharedStyles, /@media \(max-width: 900px\)/);
  assert.match(sharedStyles, /@media \(max-width: 680px\)/);
});
