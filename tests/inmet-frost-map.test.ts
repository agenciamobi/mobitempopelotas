import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const server = readFileSync("src/lib/inmet/frost.server.ts", "utf8");
const apiRoute = readFileSync("src/routes/api/inmet/geadas.ts", "utf8");
const pageRoute = readFileSync("src/routes/mapa-de-geadas-rio-grande-do-sul.tsx", "utf8");
const component = readFileSync("src/components/inmet/FrostMapPage.tsx", "utf8");
const styles = readFileSync("src/components/inmet/FrostMapPage.module.css", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("INMET frost integration uses the official endpoint and published intensity thresholds", () => {
  assert.match(server, /https:\/\/apitempo\.inmet\.gov\.br\/geada/);
  assert.match(server, /temperature < 1/);
  assert.match(server, /temperature < 3/);
  assert.match(server, /Possível ocorrência/);
  assert.match(server, /stationType === "AUTOMATICA"/);
});

test("frost API validates filters, limits the interval and caches responses", () => {
  assert.match(apiRoute, /Math\.min\(30, Math\.max\(1/);
  assert.match(apiRoute, /stationType/);
  assert.match(apiRoute, /Cache-Control/);
  assert.match(server, /CACHE_TTL_MS/);
  assert.match(server, /STALE_TTL_MS/);
});

test("frost map clusters points instead of rendering permanent city labels", () => {
  assert.match(component, /cluster:\s*true/);
  assert.match(component, /clusterMaxZoom/);
  assert.match(component, /CLUSTERS_LAYER_ID/);
  assert.match(component, /POINTS_LAYER_ID/);
  assert.match(component, /setDOMContent\(createPopupContent/);
  assert.doesNotMatch(component, /new maplibregl\.Marker/);
});

test("frost controls keep equal widths and reorganize for mobile", () => {
  assert.match(styles, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width:\s*700px\)[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("frost page is public, indexable and identifies observations rather than forecasts", () => {
  assert.match(pageRoute, /mapa-de-geadas-rio-grande-do-sul/);
  assert.match(pageRoute, /registros do INMET/);
  assert.match(component, /observações passadas, não previsão/i);
  assert.match(publicRoutes, /mapa-de-geadas-rio-grande-do-sul/);
});
