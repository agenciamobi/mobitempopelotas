import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const types = readFileSync("src/lib/weather/types.ts", "utf8");
const openMeteo = readFileSync("src/lib/weather/open-meteo.server.ts", "utf8");
const today = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const atmosphere = readFileSync("src/components/weather/TodayAtmosphericSignals.tsx", "utf8");
const atmosphereStyles = readFileSync(
  "src/components/weather/TodayAtmosphericSignals.css",
  "utf8",
);

const remValues = [...atmosphereStyles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("hourly weather model carries atmospheric profile without breaking fallbacks", () => {
  assert.match(types, /timestamp\?: string/);
  assert.match(types, /relativeHumidity\?: number \| null/);
  assert.match(types, /dewPoint\?: number \| null/);
  assert.match(types, /pressure\?: number \| null/);
  assert.match(types, /visibilityKm\?: number \| null/);
  assert.match(types, /cloudCoverLow\?: number \| null/);
  assert.match(types, /cloudCoverMid\?: number \| null/);
  assert.match(types, /cloudCoverHigh\?: number \| null/);
  assert.match(types, /cape\?: number \| null/);
  assert.match(types, /boundaryLayerHeight\?: number \| null/);
  assert.match(types, /model\?: string \| null/);
});

test("Open-Meteo requests and normalizes atmospheric variables", () => {
  assert.match(openMeteo, /HOURLY_FORECAST_LIMIT = 24/);
  assert.match(openMeteo, /dew_point_2m/);
  assert.match(openMeteo, /relative_humidity_2m/);
  assert.match(openMeteo, /pressure_msl/);
  assert.match(openMeteo, /cloud_cover_low/);
  assert.match(openMeteo, /cloud_cover_mid/);
  assert.match(openMeteo, /cloud_cover_high/);
  assert.match(openMeteo, /boundary_layer_height/);
  assert.match(openMeteo, /cape/);
  assert.match(openMeteo, /timestamp,/);
  assert.match(openMeteo, /visibilityKm:/);
  assert.match(openMeteo, /model: "Open-Meteo Best Match"/);
  assert.match(openMeteo, /temporalResolutionMinutes: 60/);
});

test("today page exposes atmospheric interpretation without replacing observed values", () => {
  assert.match(today, /TodayAtmosphericSignals/);
  assert.match(today, /href: "#atmosfera-hoje"/);
  assert.match(today, /Neblina e nuvens/);
  assert.match(today, /Orvalho e visibilidade/);
  assert.match(today, /<TodayAtmosphericSignals data=\{data\}/);
  assert.doesNotMatch(today, /<TodayAtmosphericSignals data=\{recoveredData\}/);
  assert.match(atmosphere, /data\.weather\.observation\.current\.dewPoint/);
  assert.match(atmosphere, /buildFogSignal/);
  assert.match(atmosphere, /Ponto de orvalho medido/);
  assert.match(atmosphere, /Possibilidade de neblina/);
  assert.match(atmosphere, /Menor visibilidade prevista/);
  assert.match(atmosphere, /Possibilidade de tempestade/);
  assert.match(atmosphere, /Esse valor sozinho não confirma temporal/);
  assert.match(atmosphere, /Camadas de nuvens nas próximas horas/);
  assert.match(atmosphere, /Previsão horária: Open-Meteo/);
  assert.doesNotMatch(atmosphere, /Sinal ainda não calculável/);
  assert.doesNotMatch(atmosphere, /Energia convectiva/);
  assert.doesNotMatch(atmosphere, /Tendência de pressão não calculável/);
});

test("atmospheric section stays readable and responsive", () => {
  assert.match(atmosphereStyles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(atmosphereStyles, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(atmosphereStyles, /@media \(max-width: 1180px\)/);
  assert.match(atmosphereStyles, /@media \(max-width: 860px\)/);
  assert.match(atmosphereStyles, /@media \(max-width: 680px\)/);
  assert.match(atmosphereStyles, /content-visibility:\s*auto/);
  assert.match(atmosphereStyles, /@media \(forced-colors: active\)/);
  assert.ok(remValues.every((value) => value >= 0.74), "atmospheric microtext must remain readable");
});