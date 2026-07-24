import assert from "node:assert/strict";
import test from "node:test";

import {
  OBSERVATION_MAX_AGE_MINUTES,
  canUseEmbrapaObservation,
  deriveEmbrapaCurrent,
} from "../src/lib/weather/current-observation.ts";
import type { EmbrapaObservation } from "../src/lib/weather/official-sources.types.ts";

function makeObservation(
  overrides: Partial<EmbrapaObservation> = {},
  currentOverrides: Partial<EmbrapaObservation["current"]> = {},
): EmbrapaObservation {
  const base: EmbrapaObservation = {
    status: "live",
    current: {
      temperature: 21.4,
      humidity: 78,
      feelsLike: 20.9,
      dewPoint: 17.5,
      pressure: 1013.5,
      pressureTrend: "estável",
      windDirection: "SE",
      windSpeed: 12.3,
      sunrise: "05:52",
      sunset: "18:12",
    },
    extremes: {
      temperatureMin: { value: null, time: null },
      temperatureMax: { value: null, time: null },
      humidityMin: { value: null, time: null },
      humidityMax: { value: null, time: null },
      windSpeedMax: { value: null, time: null },
    },
    accumulated: {
      rainDaily: null,
      rainMonthly: null,
      rainAnnual: null,
    },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Pelotas",
      url: "https://example.com/embrapa",
      latitude: -31.77,
      longitude: -52.36,
      altitude: 60,
      observationTime: "12:00",
      fetchedAt: "2026-07-24T15:10:00.000Z",
    },
    error: null,
    ...overrides,
  };

  base.current = { ...base.current, ...currentOverrides };
  return base;
}

test("Embrapa válida => current e procedência exclusivamente Embrapa", () => {
  const observation = makeObservation();
  const { usable, current, provenance } = deriveEmbrapaCurrent(observation, 10);
  assert.equal(usable, true);
  assert.ok(current);
  assert.equal(current!.temperature, 21);
  assert.equal(current!.condition, null, "condição não é medida pela Embrapa");
  assert.equal(current!.icon, null, "ícone não é medido pela Embrapa");
  assert.equal(current!.visibilityKm, null, "visibilidade não é medida pela Embrapa");
  assert.equal(current!.windGust, null, "rajada não é medida pela Embrapa");
  assert.equal(provenance.temperature, "embrapa");
  assert.equal(provenance.humidity, "embrapa");
  assert.equal(provenance.pressure, "embrapa");
  assert.equal(provenance.windSpeed, "embrapa");
  // nenhum campo herdado de modelo
  for (const source of Object.values(provenance)) {
    assert.equal(source, "embrapa");
  }
});

test("Embrapa unavailable => sem fallback de modelo para 'agora'", () => {
  const observation = makeObservation({ status: "unavailable", error: "timeout" });
  const { usable, current, provenance } = deriveEmbrapaCurrent(observation, null);
  assert.equal(usable, false);
  assert.equal(current, null);
  assert.deepEqual(provenance, {});
});

test("Embrapa stale (idade > limite) => current fica null", () => {
  const observation = makeObservation();
  const { usable, current } = deriveEmbrapaCurrent(observation, OBSERVATION_MAX_AGE_MINUTES + 5);
  assert.equal(usable, false);
  assert.equal(current, null);
});

test("Embrapa sem temperatura => not usable", () => {
  const observation = makeObservation({}, { temperature: null });
  assert.equal(canUseEmbrapaObservation(observation, 5), false);
});

test("Embrapa exatamente no limite de 30 min => ainda usável", () => {
  const observation = makeObservation();
  assert.equal(canUseEmbrapaObservation(observation, OBSERVATION_MAX_AGE_MINUTES), true);
});
