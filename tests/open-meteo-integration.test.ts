import assert from "node:assert/strict";
import test from "node:test";

import {
  createOpenMeteoForecastUrl,
  normalizeOpenMeteoWeather,
} from "../src/lib/weather/open-meteo.server.ts";

function makeResponse() {
  return {
    current: {
      time: "2026-07-24T17:30",
      temperature_2m: 16.2,
      relative_humidity_2m: 85,
      apparent_temperature: 16.2,
      weather_code: 3,
      pressure_msl: 1019,
      visibility: 29_720,
      wind_speed_10m: 7.7,
      wind_gusts_10m: 20.2,
      wind_direction_10m: 114,
      is_day: 1,
    },
    hourly: {
      time: ["2026-07-24T17:00", "2026-07-24T18:00"],
      temperature_2m: [16.1, 15.8],
      precipitation_probability: [null, 41],
      wind_speed_10m: [7.5, 8.1],
      wind_gusts_10m: [null, 20.2],
      weather_code: [3, 61],
      is_day: [1, 1],
    },
    daily: {
      time: ["2026-07-24"],
      weather_code: [61],
      temperature_2m_max: [18.3],
      temperature_2m_min: [11.4],
      precipitation_probability_max: [null],
      precipitation_sum: [0.2],
      wind_gusts_10m_max: [null],
      sunrise: ["2026-07-24T07:23"],
      sunset: ["2026-07-24T17:49"],
    },
  };
}

test("URL usa contrato explícito e coordenadas de Pelotas", () => {
  const url = new URL(createOpenMeteoForecastUrl());

  assert.equal(url.origin, "https://api.open-meteo.com");
  assert.equal(url.pathname, "/v1/forecast");
  assert.equal(url.searchParams.get("latitude"), "-31.7654");
  assert.equal(url.searchParams.get("longitude"), "-52.3376");
  assert.equal(url.searchParams.get("timezone"), "America/Sao_Paulo");
  assert.equal(url.searchParams.get("forecast_days"), "7");
  assert.equal(url.searchParams.get("temperature_unit"), "celsius");
  assert.equal(url.searchParams.get("wind_speed_unit"), "kmh");
  assert.equal(url.searchParams.get("precipitation_unit"), "mm");
  assert.equal(url.searchParams.get("timeformat"), "iso8601");
  assert.equal(url.searchParams.get("cell_selection"), "land");
});

test("normalização preserva ausências sem fabricar chuva ou rajada zero", () => {
  const result = normalizeOpenMeteoWeather(makeResponse());

  assert.equal(result.status, "live");
  assert.equal(result.source.key, "open-meteo");
  assert.equal(result.current?.temperature, 16);
  assert.equal(result.current?.visibilityKm, 30);
  assert.equal(result.hourly[0]?.time, "Agora");
  assert.equal(result.hourly[0]?.precipitationProbability, 41);
  assert.equal(result.hourly[0]?.windGust, 20);
  assert.equal(result.daily[0]?.rainChance, null);
  assert.equal(result.daily[0]?.windGust, null);
  assert.equal(result.daily[0]?.precipitationMm, 0.2);
});
