import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createMeteogramUrl, fetchPelotasMeteogram } from "../src/lib/weather/meteogram.server.ts";

const route = readFileSync("src/routes/meteograma-pelotas.tsx", "utf8");
const page = readFileSync("src/components/weather/MeteogramPage.tsx", "utf8");
const styles = readFileSync("src/components/weather/MeteogramPage.css", "utf8");
const refinement = readFileSync("src/components/weather/MeteogramRefinement.css", "utf8");
const functionSource = readFileSync("src/lib/weather/meteogram.functions.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const todayAtmosphere = readFileSync("src/components/weather/TodayAtmosphericSignals.tsx", "utf8");
const header = readFileSync("src/components/layout/Header.tsx", "utf8");

function series(length: number, read: (index: number) => number | null) {
  return Array.from({ length }, (_, index) => read(index));
}

test("meteogram URL requests a dedicated 48-hour atmospheric profile", () => {
  const url = new URL(createMeteogramUrl());
  assert.equal(url.origin, "https://api.open-meteo.com");
  assert.equal(url.pathname, "/v1/forecast");
  assert.equal(url.searchParams.get("latitude"), "-31.7654");
  assert.equal(url.searchParams.get("longitude"), "-52.3376");
  assert.equal(url.searchParams.get("timezone"), "America/Sao_Paulo");
  assert.equal(url.searchParams.get("forecast_hours"), "48");
  assert.equal(url.searchParams.get("precipitation_unit"), "mm");

  const hourly = url.searchParams.get("hourly") ?? "";
  for (const variable of [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "dew_point_2m",
    "precipitation_probability",
    "precipitation",
    "pressure_msl",
    "cloud_cover_low",
    "cloud_cover_mid",
    "cloud_cover_high",
    "visibility",
    "cape",
    "boundary_layer_height",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
  ]) {
    assert.match(hourly, new RegExp(variable));
  }
});

test("meteogram normalizer preserves hourly volume and atmospheric variables", async () => {
  const originalFetch = globalThis.fetch;
  const length = 48;
  const payload = {
    latitude: -31.77,
    longitude: -52.34,
    timezone: "America/Sao_Paulo",
    utc_offset_seconds: -10_800,
    generationtime_ms: 3.4,
    hourly: {
      time: Array.from({ length }, (_, index) => `2026-07-${String(28 + Math.floor(index / 24)).padStart(2, "0")}T${String(index % 24).padStart(2, "0")}:00`),
      temperature_2m: series(length, (index) => 12 + index * 0.1),
      apparent_temperature: series(length, (index) => 11 + index * 0.1),
      relative_humidity_2m: series(length, (index) => 90 - (index % 20)),
      dew_point_2m: series(length, (index) => 10 + index * 0.08),
      precipitation_probability: series(length, (index) => index === 5 ? 70 : 20),
      precipitation: series(length, (index) => index === 5 ? 2.4 : 0),
      pressure_msl: series(length, (index) => 1015 + index * 0.05),
      cloud_cover: series(length, (index) => 60 + (index % 30)),
      cloud_cover_low: series(length, (index) => 40 + (index % 40)),
      cloud_cover_mid: series(length, (index) => 20 + (index % 35)),
      cloud_cover_high: series(length, (index) => 10 + (index % 45)),
      visibility: series(length, (index) => index === 4 ? 2_500 : 18_000),
      cape: series(length, (index) => index === 9 ? 620 : 80),
      boundary_layer_height: series(length, (index) => 400 + index * 10),
      wind_speed_10m: series(length, (index) => 8 + index * 0.2),
      wind_gusts_10m: series(length, (index) => 15 + index * 0.3),
      wind_direction_10m: series(length, (index) => 90 + index),
      weather_code: series(length, (index) => index === 5 ? 61 : 3),
      is_day: series(length, (index) => index % 24 >= 7 && index % 24 <= 18 ? 1 : 0),
    },
  };

  globalThis.fetch = (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;

  try {
    const data = await fetchPelotasMeteogram();
    assert.equal(data.status, "live");
    assert.equal(data.hours.length, 48);
    assert.equal(data.source.model, "Best Match");
    assert.equal(data.source.temporalResolutionMinutes, 60);
    assert.equal(data.source.generationTimeMs, 3.4);
    assert.equal(data.hours[5]?.precipitationProbability, 70);
    assert.equal(data.hours[5]?.precipitationMm, 2.4);
    assert.equal(data.hours[4]?.visibilityKm, 2.5);
    assert.equal(data.hours[9]?.cape, 620);
    assert.equal(data.hours[0]?.windDirectionDegrees, 90);
    assert.equal(data.hours[0]?.isDay, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("meteogram route exposes SEO, FAQ and separate forecast loading", () => {
  assert.match(route, /createFileRoute\("\/meteograma-pelotas"\)/);
  assert.match(route, /MeteogramRefinement\.css/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /getPelotasMeteogram\(\)/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /Meteograma de Pelotas/);
  assert.match(route, /temperatura, ponto de orvalho, chuva por hora, nuvens, visibilidade, pressão, vento, rajadas e CAPE/i);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, METEOGRAM_CONTENT\.faqs\)/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /O meteograma mostra dados medidos ou previstos/);
  assert.match(route, /CAPE é uma medida/);
});

test("meteogram page provides coordinated controls and practical readings", () => {
  assert.match(page, /Meteograma de Pelotas: atmosfera, chuva e vento hora a hora/);
  assert.match(page, /24 horas/);
  assert.match(page, /48 horas/);
  assert.match(page, /Maior chance de chuva/);
  assert.match(page, /Rajada máxima/);
  assert.match(page, /Menor visibilidade/);
  assert.match(page, /Pico de CAPE/);
  assert.match(page, /Horário selecionado/);
  assert.match(page, /Temperatura, sensação e ponto de orvalho/);
  assert.match(page, /Chance de chuva e umidade relativa/);
  assert.match(page, /Volume previsto por hora/);
  assert.match(page, /Camadas de nuvens/);
  assert.match(page, /Visibilidade prevista/);
  assert.match(page, /Vento e rajadas/);
  assert.match(page, /Pressão ao nível do mar/);
  assert.match(page, /CAPE isolado não confirma temporal/);
  assert.match(page, /O meteograma é uma previsão, não uma medição contínua/);
});

test("meteogram keeps atmospheric forecast separate from observation and hydrology", () => {
  assert.match(page, /A observação da[\s\S]*Embrapa permanece separada/);
  assert.match(page, /valores futuros não são chuva já medida/);
  assert.match(page, /Modelos podem mudar entre atualizações/);
  assert.doesNotMatch(`${route}\n${page}`, /SACE|Guaíba|Lagoa dos Patos|nível da água/i);
});

test("meteogram layout protects retail rail, scrolling charts and responsive states", () => {
  assert.match(styles, /internal-weather-shell--meteogram \.meteogram-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /overflow-x: auto/);
  assert.match(styles, /min-width: 920px/);
  assert.match(styles, /@media \(max-width: 1280px\)/);
  assert.match(styles, /@media \(max-width: 920px\)/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(refinement, /font-size:\s*0\.75rem/);
  assert.match(refinement, /grid-auto-flow:\s*column/);
  assert.match(refinement, /grid-template-columns:\s*none/);
  assert.match(refinement, /grid-auto-columns:\s*minmax\(32px, 1fr\)/);
});

test("meteogram is discoverable and cached as an operational page", () => {
  assert.match(publicRoutes, /path: "\/meteograma-pelotas", changeFrequency: "hourly"/);
  assert.match(todayAtmosphere, /to="\/meteograma-pelotas"/);
  assert.match(todayAtmosphere, /Abrir meteograma de 24 e 48 horas/);
  assert.match(header, /Meteograma 24–48h/);
  assert.match(header, /"\/meteograma-pelotas"/);
  assert.match(functionSource, /max-age=300/);
  assert.match(functionSource, /stale-while-revalidate=600/);
});
