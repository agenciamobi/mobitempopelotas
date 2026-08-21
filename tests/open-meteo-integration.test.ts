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
      dew_point_2m: 13.7,
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
      precipitation: [0, 1.4],
      wind_speed_10m: [7.5, 8.1],
      wind_gusts_10m: [null, 20.2],
      wind_direction_10m: [108, 122],
      weather_code: [3, 61],
      is_day: [1, 1],
      relative_humidity_2m: [84, 88],
      dew_point_2m: [13.4, 13.8],
      pressure_msl: [1019.2, 1019.8],
      visibility: [29_720, 8_400],
      cloud_cover: [72, 88],
      cloud_cover_low: [52, 78],
      cloud_cover_mid: [35, 44],
      cloud_cover_high: [16, 28],
      cape: [80, 420],
      boundary_layer_height: [620, 410],
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

  const current = url.searchParams.get("current") ?? "";
  const hourly = url.searchParams.get("hourly") ?? "";
  assert.match(current, /dew_point_2m/);
  assert.match(hourly, /relative_humidity_2m/);
  assert.match(hourly, /dew_point_2m/);
  assert.match(hourly, /precipitation(?:,|$)/);
  assert.match(hourly, /pressure_msl/);
  assert.match(hourly, /visibility/);
  assert.match(hourly, /cloud_cover_low/);
  assert.match(hourly, /cloud_cover_mid/);
  assert.match(hourly, /cloud_cover_high/);
  assert.match(hourly, /cape/);
  assert.match(hourly, /boundary_layer_height/);
  assert.match(hourly, /wind_direction_10m/);
});

test("normalização preserva ausências e inclui o perfil atmosférico", () => {
  const result = normalizeOpenMeteoWeather(makeResponse());

  assert.equal(result.status, "live");
  assert.equal(result.source.key, "open-meteo");
  assert.equal(result.source.model, "Open-Meteo Best Match");
  assert.equal(result.source.temporalResolutionMinutes, 60);
  assert.equal(result.current?.temperature, 16);
  assert.equal(result.current?.dewPoint, 13.7);
  assert.equal(result.current?.visibilityKm, 30);
  assert.equal(result.hourly[0]?.time, "Agora");
  assert.equal(result.hourly[0]?.timestamp, "2026-07-24T18:00");
  assert.equal(result.hourly[0]?.precipitationProbability, 41);
  assert.equal(result.hourly[0]?.precipitationMm, 1.4);
  assert.equal(result.hourly[0]?.windGust, 20);
  assert.equal(result.hourly[0]?.windDirectionDegrees, 122);
  assert.equal(result.hourly[0]?.relativeHumidity, 88);
  assert.equal(result.hourly[0]?.dewPoint, 13.8);
  assert.equal(result.hourly[0]?.pressure, 1020);
  assert.equal(result.hourly[0]?.visibilityKm, 8.4);
  assert.equal(result.hourly[0]?.cloudCoverLow, 78);
  assert.equal(result.hourly[0]?.cloudCoverMid, 44);
  assert.equal(result.hourly[0]?.cloudCoverHigh, 28);
  assert.equal(result.hourly[0]?.cape, 420);
  assert.equal(result.hourly[0]?.boundaryLayerHeight, 410);
  assert.equal(result.daily[0]?.rainChance, null);
  assert.equal(result.daily[0]?.windGust, null);
  assert.equal(result.daily[0]?.precipitationMm, 0.2);
});
