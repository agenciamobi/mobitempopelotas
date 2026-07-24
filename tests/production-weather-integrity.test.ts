import assert from "node:assert/strict";
import test from "node:test";

import type { AggregatedWeatherData } from "../src/lib/weather/aggregated-weather.types.ts";
import { toProductionWeatherData } from "../src/production/adapters/home.ts";
import { fallbackWeatherData } from "../src/production/lib/weather-data.ts";

function makeAggregatedWeather(overrides: Record<string, unknown> = {}) {
  const base = {
    status: "degraded",
    current: null,
    currentProvenance: {},
    hourly: [
      {
        time: "Agora",
        temperature: 18,
        precipitationProbability: null,
        windSpeed: 0,
        windGust: null,
        icon: "rain",
      },
    ],
    daily: [
      {
        weekday: "Sexta-feira",
        date: "24/07",
        min: 14,
        max: 18,
        rainChance: null,
        precipitationMm: 1.2,
        windGust: null,
        icon: "rain",
      },
    ],
    alerts: [],
    officialForecast: [],
    observation: {
      status: "live",
      current: {
        temperature: 18,
        humidity: 96,
        feelsLike: 18,
        dewPoint: 17,
        pressure: 1012,
        pressureTrend: "estável",
        windDirection: "CALM",
        windSpeed: 0,
        sunrise: "07:10",
        sunset: "17:50",
      },
      extremes: {
        temperatureMin: { value: 14, time: "06:00" },
        temperatureMax: { value: 18, time: "03:14" },
        humidityMin: { value: 80, time: "12:00" },
        humidityMax: { value: 96, time: "03:14" },
        windSpeedMax: { value: 0, time: "03:14" },
      },
      accumulated: { rainDaily: 0, rainMonthly: 10, rainAnnual: 500 },
      source: {
        name: "Embrapa Clima Temperado",
        station: "Posto Meteorológico da Sede",
        url: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
        latitude: -31.7,
        longitude: -52.4,
        altitude: 57,
        fetchedAt: "2026-07-24T06:14:00.000Z",
        observationTime: "03:14",
      },
      error: null,
    },
    quality: {
      score: 45,
      confidence: "low",
      degradedSources: ["Open-Meteo", "Embrapa"],
      currentSource: null,
      forecastSource: "met-norway",
      forecastProvider: "MET Norway",
    },
    sources: {},
    source: { fetchedAt: "2026-07-24T06:14:00.000Z" },
    message: "Dados degradados",
    ...overrides,
  };

  return base as unknown as AggregatedWeatherData;
}

test("leitura bruta ou previsão não são convertidas em condição atual", () => {
  const result = toProductionWeatherData(makeAggregatedWeather());

  assert.equal(result.current.available, false);
  assert.equal(result.current.temperature, null);
  assert.equal(result.current.feelsLike, null);
  assert.equal(result.current.humidity, null);
  assert.equal(result.current.windSpeed, null);
  assert.equal(result.current.windGust, null);
  assert.equal(result.current.icon, null);
  assert.equal(result.current.condition, null);
  assert.equal(result.current.source.name, "Embrapa Clima Temperado");
  assert.equal(result.current.source.kind, "unavailable");
  assert.notEqual(result.current.source.name, "MET Norway");
});

test("campos ausentes na previsão continuam ausentes e não viram zero", () => {
  const result = toProductionWeatherData(makeAggregatedWeather());

  assert.equal(result.hourly[0]?.time, "Próxima hora");
  assert.equal(result.hourly[0]?.precipitation, null);
  assert.equal(result.hourly[0]?.windGust, null);
  assert.equal(result.daily[0]?.rainChance, null);
  assert.equal(result.daily[0]?.windGust, null);
});

test("observação atual válida mantém apenas campos medidos pela Embrapa", () => {
  const result = toProductionWeatherData(
    makeAggregatedWeather({
      status: "live",
      current: {
        city: "Pelotas",
        state: "RS",
        temperature: 21,
        feelsLike: 20,
        condition: null,
        humidity: 77,
        pressure: 1014,
        windSpeed: 11,
        windGust: null,
        windDirection: "SE",
        visibilityKm: null,
        sunrise: "07:10",
        sunset: "17:50",
        observedAt: "03:14",
        icon: null,
      },
      quality: {
        score: 90,
        confidence: "high",
        degradedSources: [],
        currentSource: "embrapa",
        forecastSource: "met-norway",
        forecastProvider: "MET Norway",
      },
    }),
  );

  assert.equal(result.current.available, true);
  assert.equal(result.current.temperature, 21);
  assert.equal(result.current.humidity, 77);
  assert.equal(result.current.windSpeed, 11);
  assert.equal(result.current.source.kind, "observation");
  assert.equal(result.current.source.name, "Embrapa Clima Temperado");
  assert.equal(result.current.condition, null);
  assert.equal(result.current.icon, null);
  assert.equal(result.current.windGust, null);
  assert.equal(result.current.visibility, null);
});

test("fallback de produção não contém números meteorológicos demonstrativos", () => {
  assert.equal(fallbackWeatherData.current.available, false);
  assert.equal(fallbackWeatherData.current.temperature, null);
  assert.equal(fallbackWeatherData.current.humidity, null);
  assert.equal(fallbackWeatherData.current.windSpeed, null);
  assert.deepEqual(fallbackWeatherData.hourly, []);
  assert.deepEqual(fallbackWeatherData.daily, []);
  assert.deepEqual(fallbackWeatherData.regional, []);
});
