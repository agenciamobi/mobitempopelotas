import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const server = readFileSync("src/lib/hydrology/sace-guaiba.server.ts", "utf8");
const serverFunction = readFileSync("src/lib/hydrology/sace-guaiba.functions.ts", "utf8");
const context = readFileSync("src/components/hydrology/SaceGuaibaContext.tsx", "utf8");
const map = readFileSync("src/components/hydrology/SaceGuaibaMap.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/SaceGuaibaContext.css", "utf8");
const refinement = readFileSync("src/components/hydrology/SaceGuaibaRefinement.css", "utf8");
const mapStyles = readFileSync("src/components/hydrology/SaceGuaibaMap.module.css", "utf8");
const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");

const integrationSource = `${server}\n${serverFunction}\n${context}\n${map}\n${route}`;

test("SACE integration only consumes the public structured resources identified in the HAR", () => {
  assert.match(server, /\/guaiba\/api\/geojson\/point/);
  assert.match(server, /\/guaiba\/rest\/alertas/);
  assert.match(server, /\/guaiba\/api\/geojson\/bounds/);
  assert.match(server, /\/guaiba\/wms-config/);
  assert.match(server, /stationsSchema/);
  assert.match(server, /alertLegendSchema/);
  assert.match(server, /boundsSchema/);
  assert.match(server, /wmsConfigSchema/);
  assert.match(server, /prioridade: finiteNumber\.nullable\(\)\.optional\(\)/);
  assert.match(server, /hostname\.endsWith\("sgb\.gov\.br"\)/);
  assert.doesNotMatch(integrationSource, /dwr/i);
  assert.doesNotMatch(integrationSource, /plaincall/i);
  assert.doesNotMatch(integrationSource, /scriptSessionId/i);
  assert.doesNotMatch(integrationSource, /exportarSensores/i);
  assert.doesNotMatch(integrationSource, /senha|passwordHint|credencial/i);
});

test("SACE server preserves official station categories without predicting Pelotas", () => {
  assert.match(server, /SEM_INFORMACAO/);
  assert.match(server, /Cota de Atenção/);
  assert.match(server, /Cota de Alerta/);
  assert.match(server, /Cota de Inundação/);
  assert.match(server, /stationIsAboveNormal/);
  assert.match(server, /withoutTransmission/);
  assert.match(server, /Guaíba e Delta/);
  assert.match(server, /Taquari-Antas/);
  assert.match(server, /Jacuí/);
  assert.match(server, /Caí/);
  assert.match(server, /Sinos/);
  assert.match(server, /Gravataí/);
  assert.doesNotMatch(server, /previs[aã]o.*Laranjal/i);
});

test("hydrology page identifies SACE as upstream context and keeps local refresh cadence", () => {
  assert.match(route, /getSaceGuaibaData/);
  assert.match(route, /<SaceGuaibaContext data=\{data\.sace\}/);
  assert.match(route, /staleTime: 60 \* 1_000/);
  assert.match(route, /SACE Guaíba do Serviço Geológico do Brasil/);
  assert.match(route, /Uma estação elevada no SACE significa que o Laranjal vai subir/);
  assert.match(route, /sem transformá-la em risco para Pelotas/);
  assert.match(route, /Ausência de transmissão significa que o rio está normal/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, HYDROLOGY_PAGE_CONTENT\.faqs\)/);
});

test("SACE experience offers map filters, source transparency and explicit interpretation limits", () => {
  assert.match(context, /O que acontece nos rios que alimentam o Guaíba/);
  assert.match(context, /Leitura regional, não previsão para o Laranjal/);
  assert.match(context, /Ausência de dado não significa nível normal/);
  assert.match(context, /Acima de normal/);
  assert.match(context, /Transmitindo/);
  assert.match(context, /SaceGuaibaMap/);
  assert.match(context, /data\.legend/);
  assert.match(context, /data\.highlightedStations/);
  assert.match(context, /Abrir SACE Guaíba/);
  assert.match(context, /sem conversão para risco local em[\s\S]*Pelotas/);
});

test("SACE map uses official WMS and safe popup text", () => {
  assert.match(map, /void import\("maplibre-gl"\)/);
  assert.match(map, /bbox-epsg-3857/);
  assert.match(map, /type: "raster"/);
  assert.match(map, /attribution: "Serviço Geológico do Brasil — SACE Guaíba"/);
  assert.match(map, /circle-color/);
  assert.match(map, /setText\(/);
  assert.doesNotMatch(map, /setHTML\(/);
  assert.match(map, /cooperativeGestures: true/);
  assert.match(map, /map\.dragRotate\.disable\(\)/);
});

test("SACE layout remains readable and responsive", () => {
  assert.match(styles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 1180px\)/);
  assert.match(styles, /@media \(max-width: 860px\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(refinement, /font-size:\s*0\.75rem/);
  assert.match(refinement, /scroll-margin-top:\s*8rem/);
  assert.match(mapStyles, /@media \(max-width: 720px\)/);
  assert.match(mapStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("SACE response is cached separately from the local hydrology page", () => {
  assert.match(serverFunction, /max-age=300/);
  assert.match(serverFunction, /stale-while-revalidate=600/);
  assert.match(serverFunction, /CDN-Cache-Control/);
});
