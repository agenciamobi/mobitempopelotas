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
const heroStyles = readFileSync("src/components/regional/RegionalCityHero.module.css", "utf8");
const performanceStyles = readFileSync("src/components/regional/RegionalCityPerformance.css", "utf8");
const hourly = readFileSync("src/components/regional/RegionalCityHourlySection.tsx", "utf8");
const hourlyStyles = readFileSync("src/components/regional/RegionalCityHourlySection.module.css", "utf8");
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
  assert.match(page, /RegionalCityHourlySection/);
  assert.match(page, /consulta municipal ao INMET/i);
  assert.match(page, /hasVerifiedAlertSemantics/);
});

test("regional first fold follows the homepage composition with an honest visual fallback", () => {
  assert.match(page, /<RegionalCityHero data=\{data\}/);
  assert.match(hero, /Boletim meteorológico · \{city\.name\}/);
  assert.match(hero, /\$\{condition\} agora em \$\{city\.name\}/);
  assert.match(hero, /Imagem ilustrativa/);
  assert.match(hero, /Representação visual da condição atual/);
  assert.match(hero, /Estimativa por modelo para as coordenadas centrais/);
  assert.match(hero, /current\?\.temperature/);
  assert.match(hero, /current\?\.humidity/);
  assert.match(hero, /current\?\.windSpeed/);
  assert.match(hero, /current\?\.pressure/);
  assert.match(hero, /conditionPresentation/);
  assert.match(hero, /w=1400&q=72/);
  assert.doesNotMatch(hero, /w=1800&q=82/);
  assert.match(heroStyles, /grid-template-columns:\s*minmax\(0, 1\.08fr\)/);
  assert.match(heroStyles, /background-image:\s*var\(--regional-hero-image\)/);
  assert.match(heroStyles, /@media \(max-width:\s*900px\)/);
  assert.match(heroStyles, /@media \(max-width:\s*620px\)/);
  assert.match(heroStyles, /width:\s*calc\(100% - 24px\)/);
});

test("regional pages defer lower sections and keep anchor navigation aligned", () => {
  assert.match(page, /import "\.\/RegionalCityPerformance\.css"/);
  assert.match(page, /regional-city-page/);
  assert.match(performanceStyles, /content-visibility:\s*auto/);
  assert.match(performanceStyles, /contain-intrinsic-size:\s*auto 760px/);
  assert.match(performanceStyles, /scroll-margin-top:\s*7\.5rem/);
  assert.match(performanceStyles, /@media \(max-width:\s*700px\)/);
});

test("hourly regional section shows probability, millimeters, wind and sun times", () => {
  assert.match(hourly, /id="previsao-horaria-regional"/);
  assert.match(hourly, /Próximas horas/);
  assert.match(hourly, /data\.astronomy\.sunrise/);
  assert.match(hourly, /data\.astronomy\.sunset/);
  assert.match(hourly, /hour\.rainChance/);
  assert.match(hourly, /hour\.precipitationMm/);
  assert.match(hourly, /hour\.windSpeed/);
  assert.match(hourly, /hour\.windGust/);
  assert.match(hourlyStyles, /grid-auto-flow:\s*column/);
  assert.match(hourlyStyles, /overflow-x:\s*auto/);
  assert.match(hourlyStyles, /@media \(max-width:\s*620px\)/);
});

test("regional navigation points Pelotas directly to the homepage", () => {
  assert.match(header, /id: "region"/);
  assert.match(header, /Tempo por cidade na Zona Sul/);
  assert.match(header, /\{ label: "Pelotas", to: "\//);
  assert.doesNotMatch(header, /tempo-em\/pelotas-rs/);
  assert.match(header, /\/tempo-em\/rio-grande-rs/);
  assert.match(header, /label: "Região"/);
});
