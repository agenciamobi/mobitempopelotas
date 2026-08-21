import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const meteogramRoute = readFileSync("src/routes/meteograma-pelotas.tsx", "utf8");
const simagro = readFileSync("src/components/weather/SimagroModelProducts.tsx", "utf8");
const simagroStyles = readFileSync("src/components/weather/SimagroModelProducts.css", "utf8");
const radarRoute = readFileSync("src/routes/radar-e-satelite-pelotas.tsx", "utf8");
const radarDerived = readFileSync("src/components/redemet/RedemetDerivedContext.tsx", "utf8");
const radarDerivedStyles = readFileSync("src/components/redemet/RedemetDerivedContext.css", "utf8");
const alertsRoute = readFileSync("src/routes/alertas.tsx", "utf8");
const alertCoverage = readFileSync("src/components/weather/InmetAlertCoverageDetails.tsx", "utf8");
const alertCoverageStyles = readFileSync("src/components/weather/InmetAlertCoverageDetails.css", "utf8");

test("meteogram exposes SIMAGRO model graphics without treating PNGs as numeric data", () => {
  assert.match(meteogramRoute, /<SimagroModelProducts \/>/);
  assert.match(meteogramRoute, /SIMAGRO RS/);
  assert.match(meteogramRoute, /Meteograma WRF para Pelotas/);
  assert.match(meteogramRoute, /Meteograma GFS para Pelotas/);
  assert.match(simagro, /meteograma_wrf_4914\.png/);
  assert.match(simagro, /meteograma_gfs_4914\.png/);
  assert.match(simagro, /agrometeograma_gfs_4914\.png/);
  assert.match(simagro, /não usa OCR nem leitura de[\s\S]*pixels/i);
  assert.match(simagro, /const \[selectedId/);
  assert.match(simagro, /selected\.imageUrl/);
  assert.doesNotMatch(simagro, /Promise\.all|fetch\(/);
  assert.match(simagroStyles, /min-height:\s*58px/);
  assert.match(simagroStyles, /@media \(max-width: 620px\)/);
});

test("REDEMET public detail layer derives timeline depth and storm proximity from existing frames", () => {
  assert.match(radarRoute, /<RedemetDerivedContext data=\{data\.redemet\} \/>/);
  assert.match(radarRoute, /cadência observada/i);
  assert.match(radarRoute, /distância das trovoadas/i);
  assert.match(radarDerived, /isUsableRedemetObservedAt/);
  assert.match(radarDerived, /medianCadence/);
  assert.match(radarDerived, /timelineWindow/);
  assert.match(radarDerived, /EARTH_RADIUS_KM/);
  assert.match(radarDerived, /distanceFromPelotas/);
  assert.match(radarDerived, /Até 50 km/);
  assert.match(radarDerived, /50–150 km/);
  assert.match(radarDerived, /150–450 km/);
  assert.match(radarDerived, /não mede intensidade, trajetória nem[\s\S]*substitui aviso meteorológico/i);
  assert.match(radarDerivedStyles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(radarDerivedStyles, /@media \(max-width: 560px\)/);
});

test("INMET detail layer preserves official publication and full territorial coverage progressively", () => {
  assert.match(alertsRoute, /<InmetAlertCoverageDetails data=\{weather\} \/>/);
  assert.match(alertsRoute, /lista territorial recebida do aviso oficial/);
  assert.match(alertCoverage, /alert\.sentAt/);
  assert.match(alertCoverage, /alert\.startsAt/);
  assert.match(alertCoverage, /alert\.expiresAt/);
  assert.match(alertCoverage, /alert\.municipalities\.join\(", "\)/);
  assert.match(alertCoverage, /alert\.areas\.join\(" · "\)/);
  assert.match(alertCoverage, /<details/);
  assert.match(alertCoverage, /Conferir aviso no INMET/);
  assert.match(alertCoverageStyles, /min-height:\s*58px/);
  assert.match(alertCoverageStyles, /min-height:\s*44px/);
  assert.match(alertCoverageStyles, /@media \(max-width: 560px\)/);
});
