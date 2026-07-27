import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sharedComponent = readFileSync("src/components/weather/DailyForecastPagesV2.tsx", "utf8");
const sharedStyles = readFileSync("src/components/weather/DailyForecastPagesV2.css", "utf8");
const todayComponent = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const todayStyles = readFileSync("src/components/weather/TodayForecastPageV5.css", "utf8");
const internalWidgets = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const internalWidgetStyles = readFileSync(
  "src/components/weather/InternalWeatherWidgets.css",
  "utf8",
);
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const inmetAlertsPanel = readFileSync(
  "src/production/components/inmet-alerts-panel.tsx",
  "utf8",
);

test("today uses its reusable v5 composition while tomorrow remains isolated", () => {
  assert.match(todayRoute, /TodayForecastPageV5/);
  assert.match(todayRoute, /components\/weather\/TodayForecastPageV5/);
  assert.doesNotMatch(todayRoute, /TodayForecastPageV4/);
  assert.doesNotMatch(todayRoute, /TodayForecastPageV4Refinement\.css/);
  assert.match(tomorrowRoute, /TomorrowForecastPageV2/);
  assert.match(sharedComponent, /export function TomorrowForecastPageV2/);
});

test("measurement and visual-condition availability remain separate states", () => {
  assert.match(internalWidgets, /const hasMeasurement = current\?\.temperature !== null/);
  assert.match(internalWidgets, /weather\.quality\.currentSource === "embrapa"/);
  assert.match(internalWidgets, /Leitura local temporariamente indisponível/);
  assert.match(internalWidgets, /A previsão por modelo continua ativa/);
  assert.match(internalWidgets, /Abrir estação Embrapa/);
  assert.match(internalWidgetStyles, /\.internal-observation-unavailable/);
});

test("the page hero stays driven by production weather without a duplicate internal hero", () => {
  assert.match(todayRoute, /WeatherHero/);
  assert.match(todayRoute, /weather=\{productionWeather\}/);
  assert.match(todayRoute, /officialAlertCount=\{pelotasOfficialAlerts\.length\}/);
  assert.doesNotMatch(todayComponent, /WeatherHero/);
  assert.doesNotMatch(todayComponent, /<h1/);
  assert.doesNotMatch(todayComponent, /today-v4-hero/);
});

test("official alerts reuse the homepage panel and verified INMET semantics", () => {
  assert.match(todayRoute, /InmetAlertsPanel/);
  assert.match(todayRoute, /variant="home"/);
  assert.match(todayRoute, /hasVerifiedInmetAlertSemantics/);
  assert.match(inmetAlertsPanel, /function primaryHomeAlert/);
  assert.match(inmetAlertsPanel, /compareHomeAlerts/);
  assert.match(inmetAlertsPanel, /Em vigor — horário não informado pelo INMET/);
});

test("the today forecast reuses the homepage narrative without unrelated future days", () => {
  assert.match(internalWidgets, /HomeForecastStory/);
  assert.match(internalWidgets, /includeTrend = false/);
  assert.match(internalWidgets, /daily:\s*data\.weather\.daily\.slice\(0, 1\)/);
  assert.match(internalWidgets, /internal-forecast-widget/);
});

test("current metrics disclose concise field-level provenance", () => {
  for (const field of ["humidity", "windSpeed", "pressure", "sunset"]) {
    assert.match(internalWidgets, new RegExp(`currentProvenance\\.${field}`));
  }
  assert.doesNotMatch(internalWidgets, /currentProvenance\.windDirection/);
  assert.match(internalWidgets, /Medição local e procedência/);
  assert.match(internalWidgets, /O que está sendo observado agora/);
  assert.match(internalWidgets, /Atualizado em/);
});

test("the practical reading keeps an interpretive title and limits repetition", () => {
  assert.match(todayComponent, /function buildReadingTitle/);
  assert.match(todayComponent, /A chuva deve ser o principal ponto de atenção/);
  assert.match(todayComponent, /Temperaturas baixas devem persistir/);
  assert.match(todayComponent, /Rajadas podem interferir/);
  assert.match(todayComponent, /title=\{buildReadingTitle\(recoveredData\)\}/);
  assert.match(internalWidgets, /highlights\.slice\(0, 3\)/);
  assert.match(internalWidgets, /cautions\.slice\(0, 3\)/);
});

test("one clear next step replaces duplicate related-link blocks", () => {
  assert.match(todayComponent, /InternalNextStep/);
  assert.match(internalWidgets, /Ver a previsão para amanhã/);
  assert.doesNotMatch(todayComponent, /previsao-7-dias-pelotas/);
  assert.doesNotMatch(todayComponent, /radar-e-satelite-pelotas/);
});

test("the internal visual system covers width, mobile and below-fold rendering", () => {
  assert.match(todayStyles, /width:\s*min\(var\(--editorial-max\), calc\(100% - 56px\)\)/);
  assert.match(todayStyles, /width:\s*min\(780px, calc\(100% - 40px\)\)/);
  assert.match(todayStyles, /@media \(max-width: 680px\)/);
  assert.match(todayStyles, /@media \(max-width: 420px\)/);
  assert.match(internalWidgetStyles, /content-visibility:\s*auto/);
  assert.match(internalWidgetStyles, /contain-intrinsic-size/);
  assert.match(internalWidgetStyles, /@media \(max-width: 980px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 760px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 520px\)/);
  assert.match(internalWidgetStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(internalWidgetStyles, /backdrop-filter/);
});

test("tomorrow shared visual layer remains available and unchanged", () => {
  assert.match(sharedStyles, /\.daily-condition-card--tomorrow/);
  assert.match(sharedStyles, /@media \(max-width: 900px\)/);
  assert.match(sharedStyles, /@media \(max-width: 680px\)/);
});
