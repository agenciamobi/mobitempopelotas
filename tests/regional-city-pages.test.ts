import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { REGIONAL_CITIES, regionalCityPath } from "../src/lib/regional-cities.ts";
import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";

const server = readFileSync("src/lib/weather/regional-city-weather.server.ts", "utf8");
const route = readFileSync("src/routes/tempo-em/$citySlug.tsx", "utf8");
const directoryRoute = readFileSync("src/routes/tempo-na-regiao-sul-rs.tsx", "utf8");
const page = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");
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

test("every regional city has a concrete sitemap URL served by the dynamic route", () => {
  const publicPaths = new Set(PUBLIC_ROUTES.map((item) => item.path));
  for (const city of REGIONAL_CITIES) {
    assert.ok(publicPaths.has(regionalCityPath(city)), `sitemap sem ${city.name}`);
  }
  assert.match(route, /createFileRoute\("\/tempo-em\/\$citySlug"\)/);
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
  assert.match(page, /Chuva agora:/);
  assert.match(page, /consulta municipal ao INMET/i);
});

test("hourly regional section shows probability, millimeters, wind and sun times", () => {
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

test("regional navigation is exposed in desktop and mobile header", () => {
  assert.match(header, /id: "region"/);
  assert.match(header, /Tempo por cidade na Zona Sul/);
  assert.match(header, /\/tempo-em\/rio-grande-rs/);
  assert.match(header, /label: "Região"/);
});
