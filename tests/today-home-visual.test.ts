import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrowRoute = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const sevenDayRoute = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const rainRoute = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const windRoute = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const todayComponent = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const todayStyles = readFileSync("src/components/weather/TodayForecastPageV5.css", "utf8");
const todayRetailHero = readFileSync("src/components/weather/TodayRetailHero.tsx", "utf8");
const todayRetailHeroStyles = readFileSync(
  "src/components/weather/TodayRetailHero.css",
  "utf8",
);
const todayRetailPhotoStyles = readFileSync(
  "src/components/weather/TodayRetailHeroPhoto.css",
  "utf8",
);
const todayRetailBackgrounds = readFileSync(
  "src/components/weather/today-retail-hero-backgrounds.ts",
  "utf8",
);
const internalShell = readFileSync(
  "src/components/layout/InternalWeatherPageShell.tsx",
  "utf8",
);
const internalShellStyles = readFileSync(
  "src/components/layout/InternalWeatherPageShell.css",
  "utf8",
);
const headerFrameStyles = readFileSync(
  "src/production/styles/header-hero-fullwidth-v32.css",
  "utf8",
);
const todayResources = readFileSync("src/components/weather/TodayWeatherResources.tsx", "utf8");
const todayResourceStyles = readFileSync(
  "src/components/weather/TodayWeatherResources.css",
  "utf8",
);
const internalWidgets = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const internalWidgetStyles = readFileSync(
  "src/components/weather/InternalWeatherWidgets.css",
  "utf8",
);
const internalWidgetRefinement = readFileSync(
  "src/components/weather/InternalWeatherWidgetsRefinement.css",
  "utf8",
);
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");

test("today forecast delegates the complete page frame to the shared internal weather shell", () => {
  assert.match(todayRoute, /InternalWeatherPageShell/);
  assert.match(todayRoute, /TodayRetailHero/);
  assert.match(todayRoute, /TodayForecastPageV5/);
  assert.match(todayRoute, /EditorialContentSection/);
  assert.doesNotMatch(todayRoute, /WeatherHero/);
  assert.doesNotMatch(todayRoute, /SiteHeader/);
  assert.doesNotMatch(todayRoute, /SiteFooter/);
});

test("internal weather pages own one retail shell without duplicated global chrome", () => {
  const routes = [todayRoute, tomorrowRoute, sevenDayRoute, rainRoute, windRoute];

  for (const route of routes) {
    assert.match(route, /InternalWeatherPageShell/);
    assert.match(route, /pageClassName="internal-weather-shell--/);
  }

  for (const pathname of [
    "/tempo-hoje-pelotas",
    "/tempo-amanha-pelotas",
    "/previsao-7-dias-pelotas",
    "/chuva-em-pelotas",
    "/vento-em-pelotas",
  ]) {
    assert.match(siteLayout, new RegExp(`"${pathname.replaceAll("/", "\\/")}"`));
  }

  assert.match(siteLayout, /standaloneRoutes/);
});

test("the shared shell codifies tempo hoje as the internal weather visual contract", () => {
  assert.match(internalShell, /data-internal-weather-style="tempo-hoje-retail"/);
  assert.match(internalShell, /SiteHeader/);
  assert.match(internalShell, /SiteFooter/);
  assert.match(internalShell, /InmetAlertsPanel/);
  assert.match(internalShell, /hasVerifiedInmetAlertSemantics/);
  assert.match(internalShell, /toProductionWeatherData/);
  assert.match(internalShellStyles, /based on \/tempo-hoje-pelotas/);
  assert.match(internalShellStyles, /> \.daily-page/);
  assert.match(internalShellStyles, /> \.forecast-page/);
  assert.match(internalShellStyles, /> \.condition-page/);
  assert.match(internalShellStyles, /\.condition-page-header/);
  assert.match(internalShellStyles, /@media \(max-width: 680px\)/);
});

test("tempo hoje sections reuse the exact header container geometry", () => {
  assert.match(headerFrameStyles, /--portal-frame-max:\s*1760px/);
  assert.match(headerFrameStyles, /--portal-content-gutter:\s*clamp\(22px, 2\.4vw, 42px\)/);
  assert.match(
    headerFrameStyles,
    /\.production-header-inner,[\s\S]*max-width:\s*var\(--portal-frame-max\)/,
  );
  assert.match(
    internalShellStyles,
    /--internal-weather-frame-max:\s*var\(--portal-frame-max, 1760px\)/,
  );
  assert.match(
    internalShellStyles,
    /--internal-weather-frame-gutter:\s*var\([\s\S]*--portal-content-gutter/,
  );
  assert.match(
    internalShellStyles,
    /\.site-shell--home-editorial\.internal-weather-shell \.internal-weather-main[\s\S]*width:\s*100%[\s\S]*max-width:\s*var\(--internal-weather-frame-max\)/,
  );
  assert.match(internalShellStyles, /padding-right:\s*var\(--internal-weather-frame-gutter\)/);
  assert.match(internalShellStyles, /padding-left:\s*var\(--internal-weather-frame-gutter\)/);
  assert.match(
    internalShellStyles,
    /\.internal-weather-shell--today \.today-retail-hero__inner[\s\S]*max-width:\s*var\(--internal-weather-frame-max\)/,
  );
  assert.match(
    internalShellStyles,
    /\.internal-weather-shell--today \.today-v5-page,[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.doesNotMatch(todayStyles, /calc\(100% - 56px\)/);
  assert.doesNotMatch(todayStyles, /calc\(100% - 40px\)/);
  assert.doesNotMatch(todayStyles, /calc\(100% - 28px\)/);
  assert.doesNotMatch(todayStyles, /calc\(100% - 20px\)/);
});

test("the retail hero selects credited photography from the forecast condition", () => {
  assert.match(todayRetailHero, /getTodayRetailHeroPhoto/);
  assert.match(todayRetailHero, /--today-retail-hero-photo/);
  assert.match(todayRetailHero, /--today-retail-hero-position/);
  assert.match(todayRetailHero, /today-retail-hero__current-photo/);
  assert.match(todayRetailHero, /today-retail-hero__photo-credit/);
  assert.match(todayRetailHero, /data-weather-photo=\{iconName\}/);
  assert.match(todayRetailBackgrounds, /Amanhecer_na_Praia_do_Laranjal/);
  assert.match(todayRetailBackgrounds, /Sunset_over_Calm_Lake/);
  assert.match(todayRetailBackgrounds, /Heavy_Rain/);
  assert.match(todayRetailBackgrounds, /icon === "storm" \|\| icon === "rain"/);
  assert.match(todayRetailBackgrounds, /icon === "sun" \|\| icon === "partly-cloudy"/);
  assert.match(todayRetailPhotoStyles, /Condition-aware photography/);
  assert.match(todayRetailPhotoStyles, /var\(--today-retail-hero-photo\)/);
  assert.match(todayRetailPhotoStyles, /backdrop-filter:\s*blur\(12px\)/);
  assert.match(todayRetailPhotoStyles, /prefers-reduced-motion/);
  assert.match(todayRetailPhotoStyles, /forced-colors/);
});

test("the retail hero uses a useful headline and concise current metrics", () => {
  assert.match(todayRetailHero, /Tempo hoje em Pelotas/);
  assert.match(todayRetailHero, /previsão por hora, chuva e vento/);
  assert.doesNotMatch(todayRetailHero, /Seu dia em Pelotas/);
  assert.doesNotMatch(todayRetailHero, /organizado por horários/);
  assert.doesNotMatch(todayRetailHero, /percebida agora/);
  assert.doesNotMatch(todayRetailHero, /medição local/);
  assert.match(todayRetailHero, /formatWind\(current\.windSpeed, current\.windDirection\)/);
  assert.match(todayRetailHero, /metric\.detail \? <em>\{metric\.detail\}<\/em> : null/);
  assert.match(todayRetailHero, /today-retail-hero__current/);
  assert.match(todayRetailHero, /today-retail-hero__tiles/);
  assert.match(todayRetailHero, /Planejar próximas horas/);
  assert.match(todayRetailHero, /Ver previsão por hora/);
  assert.match(todayRetailHero, /Faixa do dia/);
  assert.match(todayRetailHero, /Maior chance prevista/);
  assert.match(todayRetailHero, /Máxima prevista hoje/);
  assert.match(todayRetailHero, /Nascer e pôr do sol/);
  assert.match(todayRetailHero, /<h1/);
});

test("the retail hero stays on the editorial rail and adapts across breakpoints", () => {
  assert.match(todayRetailHeroStyles, /retail-style hero/);
  assert.match(todayRetailHeroStyles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(todayRetailHeroStyles, /@media \(max-width: 920px\)/);
  assert.match(todayRetailHeroStyles, /@media \(max-width: 700px\)/);
  assert.match(todayRetailHeroStyles, /@media \(max-width: 420px\)/);
  assert.match(todayRetailHeroStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(todayRetailHeroStyles, /@media \(forced-colors: active\)/);
  assert.match(todayRetailHeroStyles, /:focus-visible/);
});

test("the internal today page no longer renders another hero", () => {
  assert.doesNotMatch(todayComponent, /WeatherHero/);
  assert.doesNotMatch(todayComponent, /TodayRetailHero/);
  assert.doesNotMatch(todayComponent, /today-v4-hero/);
  assert.doesNotMatch(todayComponent, /<h1/);
  assert.match(todayComponent, /InternalForecastStory/);
  assert.match(todayComponent, /TodayWeatherResources/);
  assert.match(todayComponent, /InternalObservationWidget/);
  assert.match(todayComponent, /InternalPracticalSummary/);
});

test("forecast and observation widgets are derived from homepage components", () => {
  assert.match(internalWidgets, /HomeForecastStory/);
  assert.match(internalWidgets, /daily:\s*data\.weather\.daily\.slice\(0, 1\)/);
  assert.match(internalWidgets, /home-observation-story internal-observation-widget/);
  assert.match(internalWidgets, /home-observation-story__reading/);
  assert.match(internalWidgets, /home-observation-temperature/);
  assert.match(internalWidgets, /Ver detalhes da estação/);
});

test("today content is concise and keeps measurement provenance explicit", () => {
  assert.match(internalWidgets, /currentProvenance\.humidity/);
  assert.match(internalWidgets, /currentProvenance\.windSpeed/);
  assert.match(internalWidgets, /currentProvenance\.pressure/);
  assert.match(internalWidgets, /currentProvenance\.sunset/);
  assert.match(internalWidgets, /highlights\.slice\(0, 2\)/);
  assert.match(internalWidgets, /cautions\.slice\(0, 2\)/);
  assert.match(internalWidgets, /Observação Embrapa/);
  assert.match(internalWidgets, /Atual complementada por modelo/);
  assert.match(internalWidgets, /Para a rotina/);
  assert.match(internalWidgets, /Pontos de atenção/);
});

test("today planning resources derive decisions from the next 12 forecast hours", () => {
  assert.match(todayComponent, /href: "#recursos-hoje"/);
  assert.match(todayComponent, /<TodayWeatherResources data=\{recoveredData\}/);
  assert.match(todayResources, /hourly\.slice\(0, 12\)/);
  assert.match(todayResources, /precipitationProbability/);
  assert.match(todayResources, /hour\.windGust \?\? hour\.windSpeed/);
  assert.match(todayResources, /periodScore/);
  assert.match(todayResources, /Melhor janela estimada/);
  assert.match(todayResources, /Maior atenção/);
  assert.match(todayResources, /Luz natural/);
});

test("today resources link to specialized rain wind radar and alert pages", () => {
  assert.match(todayResources, /to: "\/chuva-em-pelotas"/);
  assert.match(todayResources, /to: "\/vento-em-pelotas"/);
  assert.match(todayResources, /to: "\/radar-e-satelite-pelotas"/);
  assert.match(todayResources, /to: "\/alertas"/);
  assert.match(todayResources, /Recursos meteorológicos relacionados/);
  assert.match(todayResources, /não substituem avisos oficiais/);
});

test("reusable widgets preserve the homepage card language on desktop and mobile", () => {
  assert.match(internalWidgetStyles, /Reusable internal weather widgets derived from the homepage editorial system/);
  assert.match(internalWidgetStyles, /\.internal-forecast-widget \.home-forecast-story/);
  assert.match(internalWidgetStyles, /\.internal-page-chapters/);
  assert.match(internalWidgetStyles, /\.internal-practical-widget__cards/);
  assert.match(internalWidgetStyles, /content-visibility:\s*auto/);
  assert.match(internalWidgetStyles, /@media \(max-width: 980px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 760px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 520px\)/);
  assert.match(internalWidgetStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(internalWidgetStyles, /@media \(forced-colors: active\)/);
});

test("tempo hoje v6 reduces visual density without removing core forecast data", () => {
  assert.match(internalWidgets, /InternalWeatherWidgetsRefinement\.css/);
  assert.match(internalWidgetRefinement, /Tempo Hoje v6/);
  assert.match(internalWidgetRefinement, /grid-template-columns:\s*1\.35rem minmax\(0, 1fr\)/);
  assert.match(internalWidgetRefinement, /min-height:\s*180px/);
  assert.match(internalWidgetRefinement, /home-forecast-window[\s\S]*box-shadow:\s*none/);
  assert.match(internalWidgetRefinement, /internal-observation-widget[\s\S]*rgb\(255 255 255 \/ 96%\)/);
  assert.match(internalWidgetRefinement, /internal-practical-widget__cards article > span svg/);
});

test("today decision resources remain responsive and accessible", () => {
  assert.match(todayResourceStyles, /decision resources derived from the next 12 forecast hours/);
  assert.match(todayResourceStyles, /content-visibility:\s*auto/);
  assert.match(todayResourceStyles, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(todayResourceStyles, /@media \(max-width: 980px\)/);
  assert.match(todayResourceStyles, /@media \(max-width: 760px\)/);
  assert.match(todayResourceStyles, /@media \(max-width: 520px\)/);
  assert.match(todayResourceStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(todayResourceStyles, /@media \(forced-colors: active\)/);
  assert.match(todayResourceStyles, /:focus-visible/);
});
