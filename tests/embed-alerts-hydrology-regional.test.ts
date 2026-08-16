import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const embedRoute = readFileSync("src/routes/embed/nivel-laranjal.tsx", "utf8");
const embedComponent = readFileSync("src/components/embed/LaranjalLevelEmbed.tsx", "utf8");
const embedIsolation = readFileSync("src/components/embed/LaranjalEmbedIsolation.css", "utf8");
const embedScript = readFileSync("src/routes/widgets/nivel-laranjal[.]js.ts", "utf8");
const embedApi = readFileSync("src/routes/api/widgets/nivel-laranjal.ts", "utf8");
const embedGuide = readFileSync("src/components/embed/LaranjalEmbedGuide.tsx", "utf8");
const obsRoute = readFileSync("src/routes/embed/status-tempo-agora.tsx", "utf8");
const obsComponent = readFileSync("src/components/embed/ObsWeatherStatusWidget.tsx", "utf8");
const obsStyles = readFileSync("src/components/embed/ObsWeatherStatusWidget.module.css", "utf8");
const obsFunctions = readFileSync("src/lib/weather/obs-weather-status.functions.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const serverEntry = readFileSync("src/server.ts", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const alerts = readFileSync("src/components/weather/WeatherAlertsPage.tsx", "utf8");
const alertsStyles = readFileSync("src/components/weather/WeatherAlertsHomepageVisual.css", "utf8");
const alertsRefinements = readFileSync("src/components/weather/WeatherAlertsRefinements.css", "utf8");
const hydrologyHero = readFileSync("src/components/hydrology/HydrologyEditorialHero.tsx", "utf8");
const hydrologyRouteStyles = readFileSync("src/components/hydrology/HydrologyEditorialRoute.css", "utf8");
const hydrologyRefinements = readFileSync("src/components/hydrology/HydrologyEditorialRefinements.css", "utf8");
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
const regionalAlertPriority = readFileSync(
  "src/lib/weather/regional-alert-priority.ts",
  "utf8",
);
const regionalHero = readFileSync("src/components/regional/RegionalCityHero.tsx", "utf8");
const regionalPage = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");
const regionalIdentity = readFileSync("src/components/regional/RegionalCityIdentity.css", "utf8");
const regionalPerformance = readFileSync("src/components/regional/RegionalCityPerformance.css", "utf8");
const regionalPageStyles = readFileSync(
  "src/components/regional/RegionalCityWeatherPage.module.css",
  "utf8",
);

test("Laranjal widget is standalone, responsive and publicly reusable", () => {
  assert.match(embedRoute, /createFileRoute\("\/embed\/nivel-laranjal"\)/);
  assert.match(embedRoute, /LaranjalEmbedIsolation\.css/);
  assert.match(siteLayout, /"\/embed\/nivel-laranjal"/);
  assert.match(embedComponent, /tempo-pelotas:widget-resize/);
  assert.match(embedComponent, /ResizeObserver/);
  assert.match(embedComponent, /document\.referrer/);
  assert.match(embedComponent, /targetOrigin/);
  assert.match(embedComponent, /removeEventListener\("load", report\)/);
  assert.match(embedScript, /data-tempo-pelotas-nivel-laranjal/);
  assert.match(embedScript, /https:\/\/tempopelotas\.com\.br\/embed\/nivel-laranjal/);
  assert.match(embedScript, /iframe\.style\.width = "100%"/);
  assert.match(embedScript, /MutationObserver/);
  assert.match(embedScript, /allow-popups-to-escape-sandbox/);
  assert.match(embedScript, /TempoPelotasNivelLaranjal/);
  assert.match(embedScript, /version: 1/);
  assert.match(embedScript, /Cross-Origin-Resource-Policy/);
  assert.match(embedScript, /X-Robots-Tag/);
  assert.match(embedApi, /Access-Control-Allow-Origin/);
  assert.match(embedApi, /Access-Control-Allow-Methods/);
  assert.match(embedApi, /Access-Control-Max-Age/);
  assert.match(embedApi, /Cross-Origin-Resource-Policy/);
  assert.match(embedApi, /X-Robots-Tag/);
  assert.match(embedApi, /currentLevel/);
  assert.match(embedApi, /series/);
  assert.match(embedGuide, /Código de incorporação/);
  assert.match(embedGuide, /navigator\.clipboard\.writeText/);
  assert.match(embedIsolation, /\.pwa-launcher/);
  assert.match(embedIsolation, /\.push-launcher/);
  assert.match(embedIsolation, /onesignal-bell-container/);
});

test("OBS weather widget is private-by-discovery, noindex and Embrapa-led", () => {
  assert.match(obsRoute, /createFileRoute\("\/embed\/status-tempo-agora"\)/);
  assert.match(obsRoute, /noindex, nofollow, noarchive, nosnippet, noimageindex/);
  assert.match(obsRoute, /getObsWeatherStatus/);
  assert.match(siteLayout, /"\/embed\/status-tempo-agora"/);
  assert.doesNotMatch(publicRoutes, /\/embed\/status-tempo-agora/);
  assert.match(obsFunctions, /fetchAggregatedPelotasWeather/);
  assert.match(obsFunctions, /observation\.temperature/);
  assert.match(obsFunctions, /Embrapa Clima Temperado/);
  assert.match(obsFunctions, /Trovoadas/);
  assert.match(obsFunctions, /Chuva/);
  assert.match(obsFunctions, /Nublado/);
  assert.doesNotMatch(obsFunctions, /Trovoadas previstas|Nublado previsto/i);
  assert.match(obsComponent, /REFRESH_INTERVAL_MS = 5 \* 60 \* 1_000/);
  assert.match(obsComponent, /router\.invalidate\(\)/);
  assert.match(obsComponent, /WeatherIcon/);
  assert.match(obsStyles, /background:\s*transparent/);
  assert.match(obsStyles, /@media \(max-width: 440px\)/);
});

test("only registered embed documents accept third-party framing", () => {
  assert.match(serverEntry, /EMBED_PATHS = new Set/);
  assert.match(serverEntry, /\/embed\/nivel-laranjal/);
  assert.match(serverEntry, /\/embed\/status-tempo-agora/);
  assert.match(serverEntry, /!EMBED_PATHS\.has\(pathname\)/);
  assert.match(serverEntry, /headers\.delete\("X-Frame-Options"\)/);
  assert.match(serverEntry, /frame-ancestors/);
  assert.match(serverEntry, /Cross-Origin-Resource-Policy", "cross-origin"/);
  assert.match(serverEntry, /camera=\(\), microphone=\(\), geolocation=\(\)/);
  assert.match(serverEntry, /X-Robots-Tag", EMBED_ROBOTS_POLICY/);
  assert.match(serverEntry, /noarchive, nosnippet, noimageindex/);
  assert.match(serverEntry, /EMBED_CACHE_CONTROL/);
  assert.match(serverEntry, /response\.ok/);
  assert.match(serverEntry, /Cache-Control", "no-store"/);
});

test("alerts page uses a concise first fold and trustworthy source states", () => {
  assert.match(alerts, /AlertsHero/);
  assert.match(alerts, /Alertas meteorológicos em Pelotas/);
  assert.match(alerts, /alerts-editorial-panel/);
  assert.match(alerts, /severityPriority/);
  assert.match(alerts, /prioritizeAlerts/);
  assert.match(alerts, /sourceAvailable/);
  assert.match(alerts, /Não foi possível confirmar os avisos do INMET/);
  assert.match(alerts, /id="resumo-alertas"/);
  assert.match(alerts, /const target = featured \? "#aviso-prioritario" : "#situacao-alertas"/);
  assert.match(alertsStyles, /grid-template-columns:\s*minmax\(0, 1\.14fr\)/);
  assert.match(alertsStyles, /color:\s*#5e2ced/);
  assert.match(alertsRefinements, /min-height:\s*clamp\(420px/);
  assert.match(alertsRefinements, /#situacao-alertas/);
  assert.match(alertsRefinements, /@media \(max-width: 760px\)/);
});

test("hydrology pages share a compact data-led editorial hero", () => {
  assert.match(hydrologyHero, /Acompanhe as águas que influenciam Pelotas/);
  assert.match(hydrologyHero, /Nível da Lagoa dos Patos no Laranjal/);
  assert.match(hydrologyHero, /level\.currentLevel/);
  assert.match(hydrologyHero, /level\.trendCmPerHour/);
  assert.match(hydrologyRouteStyles, /\.hydrology-page-header/);
  assert.match(hydrologyRouteStyles, /\.hydrology-detail-header/);
  assert.match(hydrologyRouteStyles, /display:\s*none/);
  assert.match(hydrologyRefinements, /min-height:\s*clamp\(470px/);
  assert.match(hydrologyRefinements, /#hydrology-level-title/);
  assert.match(levelRoute, /HydrologyEditorialHero level=\{data\.level\} variant="detail"/);
  assert.match(
    overviewRoute,
    /HydrologyOverviewHero[\s\S]*level=\{data\.level\}[\s\S]*lagoon=\{data\.lagoon\}[\s\S]*sace=\{data\.sace\}/,
  );
  assert.match(levelRoute, /LaranjalEmbedGuide/);
});

test("regional city loader recovers every incomplete weather group", () => {
  assert.match(regionalFunctions, /fetchResilientRegionalCityWeather/);
  assert.match(resilientWeather, /needsRecovery/);
  assert.match(resilientWeather, /hasCompleteCurrent/);
  assert.match(resilientWeather, /hasUsefulHourly/);
  assert.match(resilientWeather, /hasUsefulDaily/);
  assert.match(resilientWeather, /mergeCurrent/);
  assert.match(resilientWeather, /value === null \|\| value === undefined/);
  assert.match(resilientWeather, /temperature_2m/);
  assert.match(resilientWeather, /relative_humidity_2m/);
  assert.match(resilientWeather, /pressure_msl/);
  assert.match(resilientWeather, /wind_speed_10m/);
  assert.match(resilientWeather, /currentFromPayload/);
  assert.match(resilientWeather, /hourlyFromPayload/);
  assert.match(resilientWeather, /dailyFromPayload/);
});

test("regional city pages share alert priority, pt-BR metrics and current responsive layers", () => {
  assert.match(regionalAlertPriority, /hasVerifiedRegionalAlertSemantics/);
  assert.match(regionalAlertPriority, /regionalAlertPeriod/);
  assert.match(regionalAlertPriority, /selectPriorityRegionalAlert/);
  assert.match(regionalAlertPriority, /great-danger": 3/);
  assert.match(regionalHero, /selectPriorityRegionalAlert/);
  assert.match(regionalHero, /Intl\.NumberFormat\("pt-BR"/);
  assert.match(regionalHero, /regional-city-hero/);
  assert.match(regionalPage, /selectPriorityRegionalAlert/);
  assert.match(regionalPage, /to="\/tempo-em\/\$citySlug"/);
  assert.match(regionalPage, /href=\{officialUrl\} target="_blank" rel="noreferrer"/);
  assert.match(regionalPage, /Consultar avisos/);
  assert.match(regionalPage, /RegionalCityPerformance\.css/);
  assert.match(regionalPage, /RegionalCityWeatherPage\.module\.css/);
  assert.match(regionalPage, /RegionalCityIdentity\.css/);
  assert.match(regionalIdentity, /#previsao-hoje/);
  assert.match(regionalIdentity, /#tendencia/);
  assert.match(regionalIdentity, /#como-interpretar-previsao-regional/);
  assert.match(regionalIdentity, /@media \(max-width: 520px\)/);
  assert.match(regionalPerformance, /content-visibility:\s*auto/);
  assert.match(regionalPerformance, /@media \(max-width: 700px\)/);
  assert.match(regionalPageStyles, /@media \(max-width: 760px\)/);
});
