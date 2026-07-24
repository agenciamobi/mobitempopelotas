import assert from "node:assert/strict";
import test from "node:test";

import {
  needsOpenMeteoRecovery,
  recoverWeatherDataFromOpenMeteo,
} from "../src/production/lib/open-meteo-browser-recovery.ts";
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
      wind_speed_10m: [8, 9, 10, 11, 12, 13, 14, 15],
      wind_gusts_10m: [18, 19, 20, 21, 22, 23, 24, 25],
      weather_code: [3, 3, 61, 61, 3, 2, 2, 0],
      is_day: [1, 1, 1, 0, 0, 0, 0, 0],
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
  assert.equal(recovered.hourly[0]?.precipitation, 20);
  assert.equal(recovered.hourly[0]?.windGust, 19);
  assert.equal(recovered.daily.length, 7);
  assert.equal(recovered.daily[0]?.rainChance, 70);
  assert.equal(recovered.daily[0]?.windGust, 35);
  assert.equal(recovered.source.forecastName, "Open-Meteo");
});

test("rejeita resposta parcial sem apagar o fallback auditável", () => {
  assert.equal(recoverWeatherDataFromOpenMeteo(fallbackWeatherData, { hourly: {} }), null);
});
