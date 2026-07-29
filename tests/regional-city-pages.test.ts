import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  REGIONAL_CITIES,
  REGIONAL_HOME_CITY_SLUG,
  regionalCityPath,
} from "../src/lib/regional-cities.ts";
import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";

const server = readFileSync("src/lib/weather/regional-city-weather.server.ts", "utf8");
const route = readFileSync("src/routes/tempo-em/$citySlug.tsx", "utf8");
const directoryRoute = readFileSync("src/routes/tempo-na-regiao-sul-rs.tsx", "utf8");
const page = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");
const hero = readFileSync("src/components/regional/RegionalCityHero.tsx", "utf8");
const adapter = readFileSync("src/components/regional/regional-city-forecast-story.ts", "utf8");
const identityStyles = readFileSync("src/components/regional/RegionalCityIdentity.css", "utf8");
const performanceStyles = readFileSync("src/components/regional/RegionalCityPerformance.css", "utf8");
const sharedHero = readFileSync("src/components/weather/TodayRetailHero.tsx", "utf8");
const sharedForecast = readFileSync("src/components/weather/HomeForecastStory.tsx", "utf8");
const header = readFileSync("src/components/layout/Header.tsx", "utf8");

test("regional registry has unique slugs, IBGE codes and valid coordinates", () => {
  assert.ok(REGIONAL_CITIES.length >= 20);
  assert.equal(new Set(REGIONAL_CITIES.map((city) => city.slug)).size, REGIONAL_CITIES.length);
  assert.equal(new Set(REGIONAL_CITIES.map((city) => city.ibgeCode)).size, REGIONAL_CITIES.length);
  for (const city of REGIONAL_CITIES) {
    assert.match(city.ibgeCode, /^43\d{5}$/);
    assert.ok(city.latitude < -29 && city.latitude > -35);
    assert.ok(city.longitude < -50 && city.longitude > -56);
  }
});

test("Pelotas consolidates authority on the homepage while other cities remain indexable", () => {
  const publicPaths = new Set(PUBLIC_ROUTES.map((item) => item.path));
  const pelotas = REGIONAL_CITIES.find((city) => city.slug === REGIONAL_HOME_CITY_SLUG);

  assert.ok(pelotas);
  assert.equal(regionalCityPath(pelotas), "/");
  assert.ok(publicPaths.has("/"));
  assert.ok(!publicPaths.has("/tempo-em/pelotas-rs"));

  for (const city of REGIONAL_CITIES.filter((item) => item.slug !== REGIONAL_HOME_CITY_SLUG)) {
    assert.ok(publicPaths.has(regionalCityPath(city)), `sitemap sem ${city.name}`);
  }

  assert.match(route, /createFileRoute\("\/tempo-em\/\$citySlug"\)/);
  assert.match(route, /params\.citySlug === REGIONAL_HOME_CITY_SLUG/);
  assert.match(route, /statusCode:\s*301/);
  assert.match(route, /to:\s*"\/"/);
  assert.match(route, /getRegionalCityWeather/);
  assert.match(directoryRoute, /createFileRoute\("\/tempo-na-regiao-sul-rs"\)/);
});

test("city pages query real coordinate forecasts and municipal INMET alerts", () => {
  assert.match(server, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(server, /getByGeocode\/\$\{city\.ibgeCode\}/);
  assert.match(server, /temperature_2m_max/);
  assert.match(server, /precipitation_sum/);
  assert.match(server, /wind_gusts_10m_max/);
  assert.match(server, /hourly:/);
  assert.match(server, /precipitation_probability/);
  assert.match(server, /sunrise,sunset/);
  assert.match(server, /hourlyStart \+ 12/);
  assert.match(page, /RegionalOfficialAlertPanel/);
  assert.match(page, /hasVerifiedRegionalAlertSemantics/);
});

test("regional first fold reuses the approved retail hero", () => {
  assert.match(page, /<RegionalCityHero data=\{data\}/);
  assert.match(hero, /<TodayRetailHero/);
  assert.match(hero, /locationName=\{city\.name\}/);
  assert.match(hero, /primaryHref="#previsao-hoje"/);
  assert.match(hero, /secondaryHref="#tendencia"/);
  assert.match(hero, /alertHref="#avisos-municipais"/);
  assert.match(hero, /currentIsObserved=\{false\}/);
  assert.match(adapter, /toRegionalRetailWeather/);
  assert.match(adapter, /regionalAdvisoryLevel/);
  assert.match(sharedHero, /locationName\?: string/);
  assert.match(sharedHero, /currentIsObserved\?: boolean/);
  assert.match(identityStyles, /> section\.today-retail-hero/);
  assert.match(identityStyles, /\.today-retail-hero__inner/);
});

test("regional pages reuse approved alert, chapter and forecast structures", () => {
  assert.match(page, /home-inmet-alerts/);
  assert.match(page, /<InternalPageChapters/);
  assert.match(page, /<HomeForecastStory/);
  assert.match(page, /internal-forecast-widget regional-city-shared-forecast/);
  assert.match(sharedForecast, /context\?: "home" \| "today-page" \| "regional-page"/);
  assert.match(sharedForecast, /locationName\?: string/);
  assert.match(adapter, /precipitationMm: hour\.precipitationMm/);
  assert.match(adapter, /rainChance: day\.rainChance/);
  assert.doesNotMatch(page, /RegionalCityHourlySection/);
});

test("regional pages defer lower sections and keep anchor navigation aligned", () => {
  assert.match(page, /import "\.\/RegionalCityPerformance\.css"/);
  assert.match(page, /regional-city-page/);
  assert.match(performanceStyles, /content-visibility:\s*auto/);
  assert.match(performanceStyles, /contain-intrinsic-size:\s*auto 760px/);
  assert.match(performanceStyles, /scroll-margin-top:\s*7\.5rem/);
  assert.match(performanceStyles, /@media \(max-width:\s*700px\)/);
  assert.match(identityStyles, /#previsao-hoje/);
  assert.match(identityStyles, /#tendencia/);
  assert.match(identityStyles, /#cidades-proximas/);
});

test("regional navigation points Pelotas directly to the homepage", () => {
  assert.match(header, /id: "region"/);
  assert.match(header, /Tempo por cidade na Zona Sul/);
  assert.match(header, /\{ label: "Pelotas", to: "\//);
  assert.doesNotMatch(header, /tempo-em\/pelotas-rs/);
  assert.match(header, /\/tempo-em\/rio-grande-rs/);
  assert.match(header, /label: "Região"/);
});
