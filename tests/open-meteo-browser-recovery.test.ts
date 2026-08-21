import assert from "node:assert/strict";
import test from "node:test";

import {
  needsOpenMeteoRecovery,
  recoverWeatherDataFromOpenMeteo,
  recoverWeatherIntelligenceFromOpenMeteo,
} from "../src/production/lib/open-meteo-browser-recovery.ts";
import type { WeatherIntelligenceData } from "../src/lib/weather/weather-intelligence.types.ts";
import { fallbackWeatherData } from "../src/production/lib/weather-data.ts";

const hours = Array.from({ length: 8 }, (_, index) => `2026-07-24T${String(17 + index).padStart(2, "0")}:00`);
const days = Array.from({ length: 7 }, (_, index) => `2026-07-${String(24 + index).padStart(2, "0")}`);

function payload() {
  return {
    current: { time: "2026-07-24T17:30" },
    hourly: {
      time: hours,
      temperature_2m: [16, 15, 15, 14, 14, 13, 13, 12],
      precipitation_probability: [10, 20, 30, 40, 50, 60, 70, 80],
      precipitation: [0, 0.3, 0.8, 1.1, 0.2, 0, 0, 0],
      wind_speed_10m: [8, 9, 10, 11, 12, 13, 14, 15],
      wind_gusts_10m: [18, 19, 20, 21, 22, 23, 24, 25],
      wind_direction_10m: [90, 100, 110, 120, 130, 140, 150, 160],
      weather_code: [3, 3, 61, 61, 3, 2, 2, 0],
      is_day: [1, 1, 1, 0, 0, 0, 0, 0],
      relative_humidity_2m: [80, 82, 84, 86, 88, 90, 91, 92],
      dew_point_2m: [12, 12.2, 12.4, 12.6, 12.8, 13, 13.1, 13.2],
      pressure_msl: [1016, 1016.2, 1016.4, 1016.6, 1016.8, 1017, 1017.2, 1017.4],
      visibility: [20_000, 18_000, 15_000, 12_000, 9_000, 8_000, 7_000, 6_000],
      cloud_cover: [60, 65, 70, 75, 80, 85, 90, 95],
      cloud_cover_low: [30, 35, 40, 45, 50, 55, 60, 65],
      cloud_cover_mid: [20, 25, 30, 35, 40, 45, 50, 55],
      cloud_cover_high: [10, 15, 20, 25, 30, 35, 40, 45],
      cape: [20, 40, 80, 120, 160, 200, 240, 280],
      boundary_layer_height: [700, 680, 650, 620, 590, 560, 530, 500],
    },
    daily: {
      time: days,
      weather_code: [61, 3, 2, 0, 61, 3, 2],
      temperature_2m_max: [18, 19, 20, 21, 22, 23, 24],
      temperature_2m_min: [11, 12, 13, 14, 15, 16, 17],
      precipitation_probability_max: [70, 60, 50, 40, 30, 20, 10],
      precipitation_sum: [2.4, 1.2, 0.4, 0, 3.1, 0.2, 0],
      wind_gusts_10m_max: [35, 34, 33, 32, 31, 30, 29],
    },
  };
}

test("recupera previsão completa no navegador sem substituir a observação atual", () => {
  const observedWeather = {
    ...fallbackWeatherData,
    current: {
      ...fallbackWeatherData.current,
      available: true,
      temperature: 16,
    },
  };

  assert.equal(needsOpenMeteoRecovery(observedWeather), true);

  const recovered = recoverWeatherDataFromOpenMeteo(observedWeather, payload());

  assert.ok(recovered);
  assert.equal(recovered.current.temperature, 16);
  assert.equal(recovered.hourly.length, 7);
  assert.equal(recovered.hourly[0]?.time, "Próxima hora");
  assert.equal(recovered.hourly[0]?.timestamp, "2026-07-24T18:00");
  assert.equal(recovered.hourly[0]?.precipitation, 20);
  assert.equal(recovered.hourly[0]?.precipitationMm, 0.3);
  assert.equal(recovered.hourly[0]?.windGust, 19);
  assert.equal(recovered.hourly[0]?.windDirectionDegrees, 100);
  assert.equal(recovered.hourly[0]?.relativeHumidity, 82);
  assert.equal(recovered.hourly[0]?.dewPoint, 12.2);
  assert.equal(recovered.hourly[0]?.visibilityKm, 18);
  assert.equal(recovered.hourly[0]?.cloudCoverLow, 35);
  assert.equal(recovered.hourly[0]?.cape, 40);
  assert.equal(recovered.hourly[0]?.boundaryLayerHeight, 680);
  assert.equal(recovered.daily.length, 7);
  assert.equal(recovered.daily[0]?.rainChance, 70);
  assert.equal(recovered.daily[0]?.windGust, 35);
  assert.equal(recovered.source.forecastName, "Open-Meteo");
});

test("rejeita resposta parcial sem apagar o fallback auditável", () => {
  assert.equal(recoverWeatherDataFromOpenMeteo(fallbackWeatherData, { hourly: {} }), null);
});

test("propaga a recuperação rica para o agregado e corrige sua rastreabilidade", () => {
  const baseline = {
    weather: {
      status: "degraded",
      current: {
        city: "Pelotas",
        state: "RS",
        temperature: 16,
        feelsLike: 16,
        condition: null,
        humidity: 90,
        pressure: 1019,
        windSpeed: 5,
        windGust: null,
        windDirection: "L",
        visibilityKm: null,
        sunrise: null,
        sunset: null,
        observedAt: "18:00",
        icon: null,
      },
      currentProvenance: { temperature: "embrapa" },
      hourly: [],
      daily: [],
      observation: {},
      alerts: [],
      officialForecast: [],
      sources: {
        "open-meteo": {
          source: "open-meteo",
          status: "unavailable",
          role: "forecast",
          fetchedAt: "2026-07-24T21:00:00.000Z",
          usable: false,
          reason: "timeout",
        },
      },
      quality: {
        score: 70,
        confidence: "medium",
        currentSource: "embrapa",
        forecastSource: "met-norway",
        forecastProvider: "MET Norway",
        degradedSources: ["open-meteo"],
        observationAgeMinutes: 5,
        discrepancies: [],
        notes: ["MET Norway usado como contingência do Open-Meteo."],
      },
      source: {
        name: "MOBI Tempo Pelotas",
        kind: "aggregated",
        fetchedAt: "2026-07-24T21:00:00.000Z",
      },
      message: "Dados disponíveis em modo degradado.",
    },
    brief: {
      headline: "Dados degradados",
      summary: "Previsão em contingência.",
      highlights: [],
      cautions: ["Fontes com restrição ou indisponibilidade: Open-Meteo."],
    },
    intelligence: {
      origin: "deterministic",
      geminiStatus: "disabled",
      model: null,
      generatedAt: "2026-07-24T21:00:00.000Z",
      error: null,
    },
  } as unknown as WeatherIntelligenceData;

  const recovered = recoverWeatherIntelligenceFromOpenMeteo(baseline, payload());

  assert.ok(recovered);
  assert.equal(recovered.weather.status, "live");
  assert.equal(recovered.weather.quality.forecastSource, "open-meteo");
  assert.equal(recovered.weather.quality.forecastProvider, "Open-Meteo");
  assert.deepEqual(recovered.weather.quality.degradedSources, []);
  assert.equal(recovered.weather.sources["open-meteo"].usable, true);
  assert.equal(recovered.weather.hourly[0]?.precipitationProbability, 20);
  assert.equal(recovered.weather.hourly[0]?.precipitationMm, 0.3);
  assert.equal(recovered.weather.hourly[0]?.windDirectionDegrees, 100);
  assert.equal(recovered.weather.hourly[0]?.dewPoint, 12.2);
  assert.equal(recovered.weather.hourly[0]?.cloudCoverLow, 35);
  assert.equal(recovered.weather.daily[0]?.windGust, 35);
  assert.equal(recovered.weather.message, null);
  assert.match(recovered.brief.summary, /Embrapa registra 16 °C/);
});
