import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const embedRoute = readFileSync("src/routes/embed/nivel-laranjal.tsx", "utf8");
const embedComponent = readFileSync("src/components/embed/LaranjalLevelEmbed.tsx", "utf8");
const embedScript = readFileSync("src/routes/widgets/nivel-laranjal[.]js.ts", "utf8");
const embedApi = readFileSync("src/routes/api/widgets/nivel-laranjal.ts", "utf8");
const embedGuide = readFileSync("src/components/embed/LaranjalEmbedGuide.tsx", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const alerts = readFileSync("src/components/weather/WeatherAlertsPage.tsx", "utf8");
const alertsStyles = readFileSync("src/components/weather/WeatherAlertsHomepageVisual.css", "utf8");
const hydrologyHero = readFileSync("src/components/hydrology/HydrologyEditorialHero.tsx", "utf8");
const hydrologyRouteStyles = readFileSync("src/components/hydrology/HydrologyEditorialRoute.css", "utf8");
const levelRoute = readFileSync("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx", "utf8");
const overviewRoute = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const resilientWeather = readFileSync(
  "src/lib/weather/regional-city-weather-resilient.server.ts",
  "utf8",
);
const regionalFunctions = readFileSync(
  "src/lib/weather/regional-city-weather.functions.ts",
  "utf8",
);

test("Laranjal widget is standalone, responsive and publicly reusable", () => {
  assert.match(embedRoute, /createFileRoute\("\/embed\/nivel-laranjal"\)/);
  assert.match(siteLayout, /"\/embed\/nivel-laranjal"/);
  assert.match(embedComponent, /tempo-pelotas:widget-resize/);
  assert.match(embedComponent, /ResizeObserver/);
  assert.match(embedScript, /data-tempo-pelotas-nivel-laranjal/);
  assert.match(embedScript, /https:\/\/tempopelotas\.com\.br\/embed\/nivel-laranjal/);
  assert.match(embedScript, /iframe\.style\.width = "100%"/);
  assert.match(embedApi, /Access-Control-Allow-Origin/);
  assert.match(embedApi, /currentLevel/);
  assert.match(embedApi, /series/);
  assert.match(embedGuide, /Código de incorporação/);
  assert.match(embedGuide, /navigator\.clipboard\.writeText/);
});

test("alerts page uses the homepage editorial first-fold language", () => {
  assert.match(alerts, /AlertsHero/);
  assert.match(alerts, /Alertas meteorológicos com contexto local/);
  assert.match(alerts, /alerts-editorial-panel/);
  assert.match(alertsStyles, /grid-template-columns:\s*minmax\(0, 1\.14fr\)/);
  assert.match(alertsStyles, /color:\s*#5e2ced/);
  assert.match(alertsStyles, /@media \(max-width:\s*620px\)/);
});

test("hydrology pages share a data-led editorial hero and hide the legacy first fold", () => {
  assert.match(hydrologyHero, /Acompanhe as águas que influenciam Pelotas/);
  assert.match(hydrologyHero, /Nível da Lagoa dos Patos no Laranjal/);
  assert.match(hydrologyHero, /level\.currentLevel/);
  assert.match(hydrologyHero, /level\.trendCmPerHour/);
  assert.match(hydrologyRouteStyles, /\.hydrology-page-header/);
  assert.match(hydrologyRouteStyles, /\.hydrology-detail-header/);
  assert.match(hydrologyRouteStyles, /display:\s*none/);
  assert.match(levelRoute, /HydrologyEditorialHero level=\{data\.level\} variant="detail"/);
  assert.match(overviewRoute, /HydrologyEditorialHero level=\{data\.level\} variant="overview"/);
  assert.match(levelRoute, /LaranjalEmbedGuide/);
});

test("regional city loader retries coordinate weather when the primary current block is unavailable", () => {
  assert.match(regionalFunctions, /fetchResilientRegionalCityWeather/);
  assert.match(resilientWeather, /hasUsableCurrent/);
  assert.match(resilientWeather, /temperature_2m/);
  assert.match(resilientWeather, /relative_humidity_2m/);
  assert.match(resilientWeather, /pressure_msl/);
  assert.match(resilientWeather, /wind_speed_10m/);
  assert.match(resilientWeather, /currentFromPayload/);
  assert.match(resilientWeather, /hourlyFromPayload/);
  assert.match(resilientWeather, /dailyFromPayload/);
});
