import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayComponent = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const tomorrowComponent = readFileSync("src/components/weather/TomorrowForecastPageV3.tsx", "utf8");
const internalWidgets = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const internalWidgetStyles = readFileSync(
  "src/components/weather/InternalWeatherWidgets.css",
  "utf8",
);
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const inmetAlertsPanel = readFileSync(
  "src/production/components/inmet-alerts-panel.tsx",
  "utf8",
);

test("today and tomorrow use dedicated retail compositions inside the shared shell", () => {
  assert.match(todayRoute, /InternalWeatherPageShell/);
  assert.match(todayRoute, /TodayRetailHero/);
  assert.match(todayRoute, /TodayForecastPageV5/);
  assert.match(tomorrowRoute, /InternalWeatherPageShell/);
  assert.match(tomorrowRoute, /TomorrowRetailHero/);
  assert.match(tomorrowRoute, /TomorrowForecastPageV3/);
  assert.doesNotMatch(tomorrowRoute, /TomorrowForecastPageV2/);
});

test("measurement and visual-condition availability remain separate states", () => {
  assert.match(internalWidgets, /const hasMeasurement =/);
  assert.match(internalWidgets, /weather\.quality\.currentSource === "embrapa"/);
  assert.match(internalWidgets, /Leitura local temporariamente indisponível/);
  assert.match(internalWidgets, /A previsão por modelo continua ativa/);
  assert.match(internalWidgets, /Ver detalhes da estação/);
  assert.match(internalWidgetStyles, /\.internal-observation-unavailable/);
});

test("route heroes stay outside the internal content compositions", () => {
  assert.match(todayRoute, /hero=\{/);
  assert.match(tomorrowRoute, /hero=\{/);
  assert.doesNotMatch(todayComponent, /TodayRetailHero/);
  assert.doesNotMatch(todayComponent, /<h1/);
  assert.doesNotMatch(tomorrowComponent, /TomorrowRetailHero/);
  assert.doesNotMatch(tomorrowComponent, /<h1/);
});

test("official alerts reuse the homepage panel and verified INMET semantics", () => {
  const shell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");
  assert.match(shell, /InmetAlertsPanel/);
  assert.match(shell, /variant="home"/);
  assert.match(shell, /hasVerifiedInmetAlertSemantics/);
  assert.match(inmetAlertsPanel, /function primaryHomeAlert/);
  assert.match(inmetAlertsPanel, /compareHomeAlerts/);
  assert.match(inmetAlertsPanel, /Em vigor — horário não informado pelo INMET/);
});

test("today forecast reuses the homepage narrative without unrelated future days", () => {
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
  assert.match(internalWidgets, /Medição local mais recente/);
  assert.match(internalWidgets, /Atualizado em/);
});

test("today practical reading limits repeated highlights and cautions", () => {
  assert.match(todayComponent, /function buildReadingTitle/);
  assert.match(todayComponent, /A chuva deve ser o principal ponto de atenção/);
  assert.match(todayComponent, /Temperaturas baixas devem persistir/);
  assert.match(todayComponent, /Rajadas podem interferir/);
  assert.match(todayComponent, /title=\{buildReadingTitle\(recoveredData\)\}/);
  assert.match(internalWidgets, /highlights\.slice\(0, 2\)/);
  assert.match(internalWidgets, /cautions\.slice\(0, 2\)/);
});

test("tomorrow adds comparison planning and official context without another hero", () => {
  assert.match(tomorrowComponent, /weather\.daily\[1\]/);
  assert.match(tomorrowComponent, /O que muda de hoje para amanhã/);
  assert.match(tomorrowComponent, /buildPlanningCards/);
  assert.match(tomorrowComponent, /weather\.inmetForecast/);
  assert.match(tomorrowComponent, /weather\.officialForecast/);
  assert.match(tomorrowComponent, /FAQPage/);
  assert.doesNotMatch(tomorrowComponent, /daily-hero/);
  assert.doesNotMatch(tomorrowComponent, /daily-condition-card/);
});

test("daily pages share the Home rail and retain mobile rendering contracts", () => {
  assert.match(
    shellStyles,
    /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/,
  );
  assert.match(
    shellStyles,
    /--internal-weather-frame-gutter:\s*var\(--tp-home-container-gutter, 48px\)/,
  );
  assert.match(shellStyles, /--internal-weather-section-padding:\s*clamp\(24px, 3vw, 34px\)/);
  assert.match(shellStyles, /internal-weather-shell--today \.today-retail-hero__inner/);
  assert.match(shellStyles, /internal-weather-shell--tomorrow \.tomorrow-retail-hero__inner/);
  assert.match(shellStyles, /padding-right:\s*var\(--internal-weather-section-padding\)/);
  assert.match(shellStyles, /padding-left:\s*var\(--internal-weather-section-padding\)/);
  assert.match(internalWidgetStyles, /content-visibility:\s*auto/);
  assert.match(internalWidgetStyles, /contain-intrinsic-size/);
  assert.match(internalWidgetStyles, /@media \(max-width: 980px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 760px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 520px\)/);
  assert.match(internalWidgetStyles, /@media \(prefers-reduced-motion: reduce\)/);
});
