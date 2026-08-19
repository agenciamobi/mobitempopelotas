import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const sectionNavigation = readFileSync(
  "src/production/components/home-section-navigation.tsx",
  "utf8",
);
const sectionNavigationCss = readFileSync(
  "src/production/components/home-section-navigation.css",
  "utf8",
);
const forecast = readFileSync("src/production/components/home-forecast-editorial.tsx", "utf8");
const forecastCss = readFileSync(
  "src/production/components/home-forecast-editorial.css",
  "utf8",
);
const trend = readFileSync("src/production/components/home-forecast-trend.tsx", "utf8");
const trendCss = readFileSync("src/production/components/home-forecast-trend.css", "utf8");
const radar = readFileSync("src/production/components/home-radar-editorial.tsx", "utf8");
const radarCss = readFileSync(
  "src/production/components/home-radar-editorial.css",
  "utf8",
);
const observation = readFileSync(
  "src/production/components/home-observation-editorial.tsx",
  "utf8",
);
const observationCss = readFileSync(
  "src/production/components/home-observation-editorial.css",
  "utf8",
);
const water = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const waterCss = readFileSync(
  "src/production/components/home-water-editorial.css",
  "utf8",
);
const weatherMap = readFileSync("src/production/components/weather-map.tsx", "utf8");
const weatherHero = readFileSync("src/production/components/weather-hero.tsx", "utf8");
const weatherHeroCss = readFileSync(
  "src/production/components/weather-hero-direction.css",
  "utf8",
);
const homeHeader = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
const homeHeaderCss = readFileSync(
  "src/production/components/home-editorial-header.css",
  "utf8",
);
const siteFooter = readFileSync("src/production/components/site-footer.tsx", "utf8");
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");

test("the homepage radar shortcut resolves to the isolated regional monitor", () => {
  assert.match(sectionNavigation, /href:\s*"#regiao"/);
  assert.match(weatherMap, /className="map-panel" id="regiao"/);
  assert.match(productionHome, /<HomeRadarEditorial regionalWeather=\{weather\.regional\} \/>/);
});

test("the homepage radar is isolated as a civic-tech monitoring console", () => {
  assert.match(radar, /className="tp-home-radar"/);
  assert.match(radar, /Monitoramento em tempo real/);
  assert.match(radar, /Radar e satélite para acompanhar chuva, nebulosidade e trovoadas/);
  assert.match(radar, /Abrir monitoramento completo/);
  assert.match(radarCss, /\.tp-home-radar\s*\{[\s\S]*content-visibility:\s*auto/);
  assert.match(radarCss, /\.tp-home-radar__frame\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(radarCss, /\.tp-home-radar \.radar-player\s*\{[\s\S]*background:\s*#f8faf9/);
  assert.match(radarCss, /\.tp-home-radar \.map-layer-switcher\s*\{[\s\S]*box-shadow:\s*none/);
  assert.match(radarCss, /\.tp-home-radar__guide-items/);
  assert.doesNotMatch(radar, /home-map-story/);
  assert.doesNotMatch(radarCss, /\.home-map-story/);
  assert.doesNotMatch(radarCss, /!important/);
});

test("the Embrapa reading is isolated as civic-tech observed data", () => {
  assert.match(productionHome, /<HomeObservationEditorial weather=\{weather\} observation=\{observation\} \/>/);
  assert.match(observation, /className="tp-home-observation"/);
  assert.match(observation, /id="observacao-embrapa"/);
  assert.match(observation, /Chuva registrada hoje/);
  assert.doesNotMatch(observation, /Vento mais forte hoje/);
  assert.match(observationCss, /\.tp-home-observation__reading\s*\{[\s\S]*border-top:/);
  assert.doesNotMatch(observationCss, /!important/);
  assert.doesNotMatch(observationCss, /box-shadow/);
});

test("the Lagoa section is isolated as local civic-tech data", () => {
  assert.match(productionHome, /<HomeWaterEditorial laranjal=\{laranjal\} guaiba=\{guaiba\} lagoon=\{lagoon\} \/>/);
  assert.match(water, /className="tp-home-water"/);
  assert.match(water, /id="situacao-das-aguas"/);
  assert.match(water, /Praia do Laranjal/);
  assert.match(water, /HOME_LAGOON_STATION_PRIORITY/);
  assert.match(waterCss, /\.tp-home-water__layout\s*\{[\s\S]*grid-template-columns:/);
  assert.match(waterCss, /\.tp-home-water__rows article/);
  assert.doesNotMatch(waterCss, /!important/);
  assert.doesNotMatch(waterCss, /box-shadow/);
});

test("the homepage no longer renders the legacy editorial dashboard", () => {
  assert.doesNotMatch(productionHome, /HomeEditorialDashboard/);
  assert.doesNotMatch(productionHome, /home-editorial-dashboard-semantic/);
});

test("the hourly forecast headline is explicit, local and owned by the isolated component", () => {
  assert.match(forecast, /<h2 id="tp-home-forecast-title">Próximas horas em Pelotas<\/h2>/);
  assert.match(forecast, /className="tp-home-forecast"/);
  assert.doesNotMatch(forecast, /tp-home-trend/);
  assert.doesNotMatch(forecast, /home-story--forecast/);
});

test("the weekly trend is a separate chapter immediately before radar", () => {
  assert.match(trend, /className="tp-home-trend"/);
  assert.match(trend, /Como o tempo deve evoluir na semana/);
  assert.match(trendCss, /\.tp-home-trend__list/);
  assert.match(
    productionHome,
    /<HomeForecastEditorial[\s\S]*<InmetOfficialForecastPanel[\s\S]*<HomeForecastTrend[\s\S]*<HomeRadarEditorial/,
  );
});

test("the main meteorological narrative follows the definitive homepage order", () => {
  assert.match(
    productionHome,
    /<HomeForecastEditorial[\s\S]*<InmetOfficialForecastPanel[\s\S]*<HomeForecastTrend[\s\S]*<HomeRadarEditorial[\s\S]*<HomeObservationEditorial[\s\S]*<HomeWaterEditorial[\s\S]*<HomeExplorePortal/,
  );
});

test("forecast and weekly trend own responsive styles without important overrides", () => {
  assert.match(forecast, /import "\.\/home-forecast-editorial\.css"/);
  assert.match(trend, /import "\.\/home-forecast-trend\.css"/);
  assert.match(forecastCss, /\.tp-home-forecast\s*\{/);
  assert.match(forecastCss, /\.tp-home-forecast__hours/);
  assert.doesNotMatch(forecastCss, /tp-home-forecast-week/);
  assert.match(trendCss, /\.tp-home-trend\s*\{/);
  assert.match(trendCss, /\.tp-home-trend__list/);
  assert.match(forecastCss, /@media \(max-width: 1040px\)/);
  assert.match(forecastCss, /@media \(max-width: 700px\)/);
  assert.match(trendCss, /@media \(max-width: 700px\)/);
  assert.doesNotMatch(forecastCss, /!important/);
  assert.doesNotMatch(trendCss, /!important/);
});

test("the hero separates current wording from forecast wording", () => {
  assert.match(weatherHero, /if \(icon === "rain"\) return "Chuva"/);
  assert.match(weatherHero, /if \(icon === "storm"\) return "Trovoadas"/);
  assert.match(weatherHero, /if \(icon === "wind"\) return "Tempo ventoso"/);
  assert.doesNotMatch(weatherHero, /\{weatherConditionLabels\[heroIcon\]\} agora em Pelotas/);
});

test("the hero keeps only the essential public facts", () => {
  assert.match(weatherHero, /className="tp-home-hero__facts"/);
  assert.match(weatherHero, /label="Mín\. \/ máx\."/);
  assert.match(weatherHero, /label="Chuva"/);
  assert.match(weatherHero, /"Vento previsto"/);
  assert.doesNotMatch(weatherHero, /label="Umidade"/);
  assert.doesNotMatch(weatherHero, /label="Pressão"/);
});

test("the homepage section index is isolated and editorial instead of numbered", () => {
  assert.match(sectionNavigation, /className="tp-home-index"/);
  assert.match(sectionNavigation, /tp-home-index__links/);
  assert.doesNotMatch(sectionNavigation, /String\(index \+ 1\)/);
  assert.doesNotMatch(sectionNavigation, /home-section-navigation--editorial-index/);
  assert.match(sectionNavigationCss, /\.tp-home-index\s*\{[\s\S]*border-bottom/);
  assert.match(sectionNavigationCss, /@media \(max-width: 980px\)/);
  assert.doesNotMatch(sectionNavigationCss, /\.home-section-navigation/);
});

test("the homepage does not keep a permanent civil-defense promo in the main narrative", () => {
  assert.doesNotMatch(productionHome, /SafetyAlertBanner/);
  assert.doesNotMatch(productionHome, /getFeaturedSafetyBanner/);
});

test("the homepage header and footer load their stable editorial direction styles", () => {
  assert.match(homeHeader, /import "\.\/home-editorial-header\.css"/);
  assert.match(siteFooter, /import "\.\/site-footer-home\.css"/);
});

test("the homepage header is isolated from the historical first-fold cascade", () => {
  assert.match(homeHeader, /className="tp-home-header"/);
  assert.match(homeHeader, /tp-home-header__nav/);
  assert.match(homeHeaderCss, /\.tp-home-header\s*\{[\s\S]*position:\s*sticky/);
  assert.match(homeHeaderCss, /\.tp-home-header__inner\s*\{[\s\S]*grid-template-columns/);
  assert.match(homeHeaderCss, /@media \(max-width: 1040px\)/);
  assert.match(homeHeaderCss, /@media \(max-width: 720px\)/);
  assert.doesNotMatch(homeHeader, /className="home-editorial-header"/);
  assert.doesNotMatch(homeHeaderCss, /\.home-editorial-header/);
});

test("the homepage hero is isolated from the historical first-fold cascade", () => {
  assert.match(weatherHero, /className=\{`tp-home-hero tp-home-hero--\$\{resolvedLevel\}/);
  assert.match(weatherHero, /tp-home-hero__temperature/);
  assert.match(weatherHero, /tp-home-hero__hourly/);
  assert.match(weatherHeroCss, /\.tp-home-hero\s*\{[\s\S]*min-height:\s*530px/);
  assert.match(weatherHeroCss, /\.tp-home-hero__layout\s*\{[\s\S]*display:\s*flex/);
  assert.match(weatherHeroCss, /\.tp-home-hero__facts\s*\{[\s\S]*grid-template-columns/);
  assert.match(weatherHeroCss, /@media \(max-width: 1040px\)/);
  assert.match(weatherHeroCss, /@media \(max-width: 720px\)/);
  assert.doesNotMatch(weatherHero, /weather-hero--editorial-v7[01]/);
  assert.doesNotMatch(weatherHero, /weather-hero-editorial-/);
  assert.doesNotMatch(weatherHeroCss, /weather-hero--editorial-v7[01]/);
  assert.doesNotMatch(weatherHeroCss, /weather-hero-editorial-/);
});

test("the home targets now while the dedicated route targets today's forecast", () => {
  assert.match(weatherHero, /Tempo agora em Pelotas/);
  assert.doesNotMatch(weatherHero, /Tempo em Pelotas hoje/);
  assert.match(todayRoute, /Tempo hoje em Pelotas: previsão por hora/);
});

test("the hero does not credit a static photo while the live camera is visible", () => {
  assert.match(
    weatherHero,
    /\{liveCameraBackground \? null : \([\s\S]*className="tp-home-hero__credit"/,
  );
});

test("any official Pelotas alert raises the homepage to at least attention", () => {
  assert.match(productionHome, /const hasPelotasOfficialAlerts = pelotasOfficialAlerts\.length > 0/);
  assert.match(
    productionHome,
    /verifiedPelotasAlerts\.some\([\s\S]*hasPelotasOfficialAlerts[\s\S]*\? "attention"/,
  );
});
