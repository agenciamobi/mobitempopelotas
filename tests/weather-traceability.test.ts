import assert from "node:assert/strict";
import test from "node:test";

import { selectBaseline } from "../src/lib/weather/weather-baseline-select.ts";
import type { ForecastSourceKey, WeatherHomeData } from "../src/lib/weather/types.ts";
import type {
  WeatherSourceHealth,
  WeatherSourceKey,
} from "../src/lib/weather/aggregated-weather.types.ts";
import {
  baselineProvenance,
  createProviderHealth,
  deriveTraceability,
} from "../src/lib/weather/weather-traceability.ts";

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

function healthyOther(): Pick<
  Record<WeatherSourceKey, WeatherSourceHealth>,
  "embrapa" | "inmet" | "cppmet"
> {
  const now = new Date().toISOString();
  return {
    embrapa: {
      source: "embrapa",
      status: "live",
      role: "observation",
      fetchedAt: now,
      usable: true,
      reason: null,
    },
    inmet: {
      source: "inmet",
      status: "live",
      role: "alerts",
      fetchedAt: now,
      usable: true,
      reason: null,
    },
    cppmet: {
      source: "cppmet",
      status: "live",
      role: "forecast-context",
      fetchedAt: now,
      usable: true,
      reason: null,
    },
  };
}

function makeSources(
  baseline: ReturnType<typeof selectBaseline>,
): Record<WeatherSourceKey, WeatherSourceHealth> {
  return {
    "open-meteo": createProviderHealth(baseline.providers["open-meteo"], "open-meteo"),
    "met-norway": createProviderHealth(baseline.providers["met-norway"], "met-norway"),
    ...healthyOther(),
  };
}

// ---- selectBaseline (rastreabilidade da seleção) --------------------------

test("Open-Meteo saudável é selecionado com a chave correta", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", true),
    makeProvider("met-norway", true),
  );
  assert.equal(baseline.source.key, "open-meteo");
  assert.equal(baseline.providers["open-meteo"].status, "live");
  assert.equal(baseline.providers["met-norway"].status, "live");
});

test("Open-Meteo indisponível: MET Norway assume como contingência", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", false),
    makeProvider("met-norway", true),
  );
  assert.equal(baseline.source.key, "met-norway");
  assert.equal(baseline.providers["open-meteo"].status, "unavailable");
});

test("Baseline preserva providers para auditoria mesmo em falha total", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", false),
    makeProvider("met-norway", false),
  );
  assert.equal(baseline.source.key, "open-meteo");
  assert.ok(baseline.providers["open-meteo"]);
  assert.ok(baseline.providers["met-norway"]);
  assert.match(baseline.message ?? "", /MET Norway|Open-Meteo|previsão/i);
});

test("Falha isolada do MET Norway não altera a seleção do Open-Meteo", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", true),
    makeProvider("met-norway", false),
  );
  assert.equal(baseline.source.key, "open-meteo");
  assert.equal(baseline.providers["met-norway"].status, "unavailable");
});

// ---- deriveTraceability (camada agregada) --------------------------------

test("Agregação com Open-Meteo saudável: forecastSource=open-meteo, provider Open-Meteo, status live", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", true),
    makeProvider("met-norway", true),
  );
  const sources = makeSources(baseline);
  const trace = deriveTraceability({
    baseline,
    sources,
    confidence: "high",
    hasWeatherData: true,
  });
  assert.equal(trace.selectedForecastKey, "open-meteo");
  assert.equal(trace.usingContingency, false);
  assert.equal(trace.forecastSource, "open-meteo");
  assert.equal(trace.forecastProvider, "Open-Meteo");
  assert.equal(trace.status, "live");
  assert.ok(!trace.degradedSources.includes("met-norway"));
});

test("Agregação: falha apenas do MET Norway não entra em degradedSources nem degrada status", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", true),
    makeProvider("met-norway", false),
  );
  const sources = makeSources(baseline);
  const trace = deriveTraceability({
    baseline,
    sources,
    confidence: "high",
    hasWeatherData: true,
  });
  assert.equal(trace.selectedForecastKey, "open-meteo");
  assert.equal(trace.forecastSource, "open-meteo");
  assert.equal(trace.status, "live");
  assert.deepEqual(trace.degradedSources, []);
  assert.equal(sources["met-norway"].usable, false);
});

test("Agregação com contingência MET Norway: forecastSource=met-norway, provider MET Norway, status degraded", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", false),
    makeProvider("met-norway", true),
  );
  const sources = makeSources(baseline);
  const trace = deriveTraceability({
    baseline,
    sources,
    confidence: "high",
    hasWeatherData: true,
  });
  assert.equal(trace.selectedForecastKey, "met-norway");
  assert.equal(trace.usingContingency, true);
  assert.equal(trace.forecastSource, "met-norway");
  assert.equal(trace.forecastProvider, "MET Norway");
  assert.equal(trace.status, "degraded");
  // Open-Meteo indisponível deve aparecer como degradada
  assert.ok(trace.degradedSources.includes("open-meteo"));
});

test("Procedência da baseline MET Norway contém met-norway e nunca open-meteo", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", false),
    makeProvider("met-norway", true),
  );
  const provenance = baselineProvenance(baseline.current, baseline.source.key);
  const values = Object.values(provenance);
  assert.ok(values.length > 0);
  assert.ok(values.every((v) => v === "met-norway"));
  assert.ok(!values.includes("open-meteo"));
});

test("Procedência da baseline Open-Meteo contém open-meteo e nunca met-norway", () => {
  const baseline = selectBaseline(
    makeProvider("open-meteo", true),
    makeProvider("met-norway", true),
  );
  const provenance = baselineProvenance(baseline.current, baseline.source.key);
  const values = Object.values(provenance);
  assert.ok(values.every((v) => v === "open-meteo"));
  assert.ok(!values.includes("met-norway"));
});
