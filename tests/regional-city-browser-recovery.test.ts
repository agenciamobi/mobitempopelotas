import assert from "node:assert/strict";
import test from "node:test";

import { REGIONAL_CITIES } from "../src/lib/regional-cities.ts";
import {
  normalizeRegionalCityBrowserForecast,
  regionalCityForecastUrl,
  regionalCityNeedsBrowserRecovery,
} from "../src/lib/weather/regional-city-weather-client.ts";
import type { RegionalCityWeatherData } from "../src/lib/weather/regional-city-weather.types.ts";

const city = REGIONAL_CITIES.find((item) => item.slug === "capao-do-leao-rs");
if (!city) throw new Error("Cidade regional de teste não encontrada.");

function emptyData(): RegionalCityWeatherData {
  return {
    status: "unavailable",
    city,
    current: null,
    hourly: [],
    daily: [],
    astronomy: { sunrise: null, sunset: null },
    alerts: {
      status: "unavailable",
      items: [],
      sourceUrl: `https://apiprevmet3.inmet.gov.br/avisos/getByGeocode/${city.ibgeCode}`,
    },
    source: {
      forecastName: "Open-Meteo",
      forecastUrl: "https://open-meteo.com/",
      alertsName: "INMET",
      fetchedAt: "2026-07-29T15:00:00.000Z",
    },
    message: "A previsão local está temporariamente indisponível.",
  };
}

function forecastPayload() {
  const hourlyTimes = Array.from(
    { length: 24 },
    (_, index) => `2026-07-29T${String(index).padStart(2, "0")}:00`,
  );
  const dailyDates = [
    "2026-07-29",
    "2026-07-30",
    "2026-07-31",
    "2026-08-01",
    "2026-08-02",
    "2026-08-03",
    "2026-08-04",
  ];

  return {
    current: {
      time: "2026-07-29T13:00",
      temperature_2m: 18.6,
      apparent_temperature: 17.9,
      relative_humidity_2m: 82,
      pressure_msl: 1017.4,
      precipitation: 0,
      wind_speed_10m: 12.2,
      wind_gusts_10m: 24.8,
      wind_direction_10m: 135,
      weather_code: 2,
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: hourlyTimes.map((_, index) => 12 + index / 2),
      precipitation_probability: hourlyTimes.map((_, index) => (index >= 18 ? 40 : 10)),
      precipitation: hourlyTimes.map(() => 0),
      wind_speed_10m: hourlyTimes.map(() => 12),
      wind_gusts_10m: hourlyTimes.map(() => 25),
      weather_code: hourlyTimes.map(() => 2),
    },
    daily: {
      time: dailyDates,
      temperature_2m_min: [10, 11, 9, 8, 12, 13, 11],
      temperature_2m_max: [19, 20, 18, 17, 21, 22, 20],
      precipitation_probability_max: [20, 40, 10, 5, 50, 60, 30],
      precipitation_sum: [0, 1.2, 0, 0, 4.5, 7.1, 0.4],
      wind_gusts_10m_max: [30, 35, 28, 25, 42, 48, 33],
      weather_code: [2, 61, 1, 0, 63, 80, 3],
      sunrise: dailyDates.map((date) => `${date}T07:20`),
      sunset: dailyDates.map((date) => `${date}T17:55`),
    },
  };
}

test("monta a consulta regional com as coordenadas da cidade", () => {
  const url = regionalCityForecastUrl(city);

  assert.match(url, /latitude=-31\.7565/);
  assert.match(url, /longitude=-52\.4889/);
  assert.match(url, /timezone=America%2FSao_Paulo/);
  assert.match(url, /forecast_days=7/);
});

test("recupera condição atual, horas e sete dias quando o SSR retorna vazio", () => {
  const base = emptyData();
  const recovered = normalizeRegionalCityBrowserForecast(
    base,
    forecastPayload(),
    new Date("2026-07-29T16:30:00.000Z"),
  );

  assert.equal(regionalCityNeedsBrowserRecovery(base), true);
  assert.equal(recovered.city.slug, "capao-do-leao-rs");
  assert.equal(recovered.current?.temperature, 19);
  assert.equal(recovered.current?.condition, "Parcialmente nublado");
  assert.equal(recovered.hourly.length, 11);
  assert.equal(recovered.hourly[0]?.time, "2026-07-29T13:00");
  assert.equal(recovered.daily.length, 7);
  assert.equal(recovered.daily[0]?.maximum, 19);
  assert.equal(recovered.astronomy.sunrise, "2026-07-29T07:20");
  assert.equal(recovered.status, "partial");
  assert.equal(regionalCityNeedsBrowserRecovery(recovered), false);
});
