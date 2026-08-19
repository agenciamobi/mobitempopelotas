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
const semanticDashboard = readFileSync(
  "src/production/components/home-editorial-dashboard-semantic.tsx",
  "utf8",
);
const forecast = readFileSync("src/production/components/home-forecast-editorial.tsx", "utf8");
const forecastCss = readFileSync(
  "src/production/components/home-forecast-editorial.css",
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

test("the homepage radar shortcut resolves to one existing section anchor", () => {
  assert.match(sectionNavigation, /href:\s*"#regiao"/);
  assert.match(weatherMap, /className="map-panel" id="regiao"/);
  assert.doesNotMatch(semanticDashboard, /normalizedId\s*=\s*"regiao"/);
});

test("the hourly forecast headline is explicit, local and owned by the isolated component", () => {
  assert.match(forecast, /<h2 id="tp-home-forecast-title">Próximas horas em Pelotas<\/h2>/);
  assert.match(forecast, /className="tp-home-forecast"/);
  assert.doesNotMatch(forecast, /home-story--forecast/);
});

test("the official INMET forecast follows the public editorial forecast", () => {
  assert.match(
    productionHome,
    /<HomeForecastEditorial[\s\S]*<InmetOfficialForecastPanel[\s\S]*<HomeEditorialDashboard/,
  );
});

test("legacy forecast markup is removed before the remaining dashboard reaches the DOM", () => {
  assert.match(
    semanticDashboard,
    /hasClass\(className, "home-story--forecast"\)[\s\S]*return null;/,
  );
  assert.doesNotMatch(productionHome, /HeroAstronomyPortal/);
  assert.doesNotMatch(productionHome, /HomeHourlyConditionPortal/);
  assert.doesNotMatch(productionHome, /HomeTrendEditorialPortal/);
});

test("the editorial forecast owns responsive styles without important overrides", () => {
  assert.match(forecast, /import "\.\/home-forecast-editorial\.css"/);
  assert.match(forecastCss, /\.tp-home-forecast\s*\{/);
  assert.match(forecastCss, /\.tp-home-forecast__hours/);
  assert.match(forecastCss, /\.tp-home-forecast-week__list/);
  assert.match(forecastCss, /@media \(max-width: 1040px\)/);
  assert.match(forecastCss, /@media \(max-width: 700px\)/);
  assert.doesNotMatch(forecastCss, /!important/);
  assert.doesNotMatch(forecastCss, /\.home-story--forecast/);
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
