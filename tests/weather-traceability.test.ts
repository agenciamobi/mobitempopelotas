import assert from "node:assert/strict";
import test from "node:test";

import { selectBaseline } from "../src/lib/weather/weather-baseline-select.ts";
import type { ForecastSourceKey, WeatherHomeData } from "../src/lib/weather/types.ts";

function makeProvider(key: ForecastSourceKey, live: boolean): WeatherHomeData {
  return {
    status: live ? "live" : "unavailable",
    current: live
      ? {
          city: "Pelotas",
          state: "RS",
          temperature: 20,
          feelsLike: 20,
          condition: "Céu limpo",
          humidity: 70,
          pressure: 1015,
          windSpeed: 10,
          windGust: null,
          windDirection: "S",
          visibilityKm: null,
          sunrise: null,
          sunset: null,
          observedAt: new Date().toISOString(),
          icon: "sun",
        }
      : null,
    hourly: [],
    daily: live
      ? [
          {
            weekday: "hoje",
            date: "2026-07-24",
            min: 10,
            max: 22,
            rainChance: 0,
            precipitationMm: 0,
            windGust: null,
            icon: "sun",
          },
        ]
      : [],
    source: {
      name: key === "open-meteo" ? "Open-Meteo" : "MET Norway",
      url: "https://example.com",
      kind: "forecast",
      key,
      fetchedAt: new Date().toISOString(),
      isFallback: false,
    },
    message: live ? null : "fonte indisponível",
  };
}

test("Open-Meteo saudável é selecionado com a chave correta", () => {
  const om = makeProvider("open-meteo", true);
  const mn = makeProvider("met-norway", true);
  const baseline = selectBaseline(om, mn);
  assert.equal(baseline.source.key, "open-meteo");
  assert.equal(baseline.providers["open-meteo"].status, "live");
  assert.equal(baseline.providers["met-norway"].status, "live");
});

test("Open-Meteo indisponível: MET Norway assume como contingência", () => {
  const om = makeProvider("open-meteo", false);
  const mn = makeProvider("met-norway", true);
  const baseline = selectBaseline(om, mn);
  assert.equal(baseline.source.key, "met-norway");
  assert.notEqual(baseline.source.key, "open-meteo");
  assert.equal(baseline.providers["open-meteo"].status, "unavailable");
});

test("Baseline preserva providers para auditoria mesmo em falha total", () => {
  const om = makeProvider("open-meteo", false);
  const mn = makeProvider("met-norway", false);
  const baseline = selectBaseline(om, mn);
  assert.equal(baseline.source.key, "open-meteo");
  assert.ok(baseline.providers["open-meteo"]);
  assert.ok(baseline.providers["met-norway"]);
  assert.match(baseline.message ?? "", /MET Norway|Open-Meteo|previsão/i);
});

test("Falha isolada do MET Norway não altera a seleção do Open-Meteo", () => {
  const om = makeProvider("open-meteo", true);
  const mn = makeProvider("met-norway", false);
  const baseline = selectBaseline(om, mn);
  assert.equal(baseline.source.key, "open-meteo");
  assert.equal(baseline.providers["met-norway"].status, "unavailable");
});
