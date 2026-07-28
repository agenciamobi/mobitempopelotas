import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/estacao-embrapa-pelotas.tsx", "utf8");
const page = readFileSync("src/components/embrapa/EmbrapaStationPageV2.tsx", "utf8");
const styles = readFileSync("src/components/embrapa/EmbrapaStationPageV2.css", "utf8");
const refinement = readFileSync(
  "src/components/embrapa/EmbrapaStationPageV2Refinement.css",
  "utf8",
);

const stationSource = `${route}\n${page}`;

test("Embrapa route uses the shared shell and source-aware page", () => {
  assert.match(route, /createFileRoute\("\/estacao-embrapa-pelotas"\)/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /EmbrapaStationHero/);
  assert.match(route, /EmbrapaStationPageV2/);
  assert.match(route, /EmbrapaStationPageV2Refinement\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--embrapa"/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /staleTime: 60 \* 1_000/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, EMBRAPA_PAGE_CONTENT\.faqs\)/);
});

test("station page distinguishes live, partial, stale and unavailable source states", () => {
  assert.match(page, /live:[\s\S]*Fonte respondendo/);
  assert.match(page, /partial:[\s\S]*Leitura parcial/);
  assert.match(page, /stale:[\s\S]*Leitura atrasada/);
  assert.match(page, /unavailable:[\s\S]*Fonte indisponível/);
  assert.match(page, /Última temperatura reconhecida/);
  assert.match(page, /Nenhum valor é preenchido artificialmente/);
  assert.match(page, /health\.reason \?\? statusCopy\[status\]\.description/);
  assert.match(page, /role="status"/);
  assert.doesNotMatch(page, /status === "stale"[^\n]{0,160}Temperatura atual/);
});

test("measurement time, query time and observation age remain separate", () => {
  assert.match(page, /observation\.source\.observationTime/);
  assert.match(page, /observation\.source\.fetchedAt/);
  assert.match(page, /quality\.observationAgeMinutes/);
  assert.match(page, /Horário publicado pela estação/);
  assert.match(page, /Consulta do portal/);
  assert.match(page, /Idade calculada/);
  assert.match(page, /Medição ≠ consulta/);
  assert.match(route, /Uma consulta recente pode encontrar uma medição antiga/);
});

test("page exposes the full local observation set without replacing missing values", () => {
  assert.match(page, /observation\.current\.temperature/);
  assert.match(page, /observation\.current\.humidity/);
  assert.match(page, /observation\.current\.pressure/);
  assert.match(page, /observation\.current\.windSpeed/);
  assert.match(page, /observation\.current\.windDirection/);
  assert.match(page, /observation\.current\.dewPoint/);
  assert.match(page, /observation\.current\.sunrise/);
  assert.match(page, /observation\.current\.sunset/);
  assert.match(page, /Não informado/);
  assert.doesNotMatch(stationSource, /\|\|\s*0[^-9]/);
});

test("rain, evapotranspiration and daily extremes preserve station scope", () => {
  assert.match(page, /rainDaily/);
  assert.match(page, /rainMonthly/);
  assert.match(page, /rainAnnual/);
  assert.match(page, /evapotranspirationDaily/);
  assert.match(page, /evapotranspirationMonthly/);
  assert.match(page, /evapotranspirationAnnual/);
  assert.match(page, /temperatureMin/);
  assert.match(page, /temperatureMax/);
  assert.match(page, /humidityMin/);
  assert.match(page, /humidityMax/);
  assert.match(page, /windSpeedMax/);
  assert.match(page, /Pancadas isoladas podem gerar acumulados/);
  assert.match(route, /O acumulado descreve o pluviômetro da estação/);
});

test("field-level provenance explains how Embrapa enters the current condition", () => {
  assert.match(page, /currentProvenance/);
  assert.match(page, /source === "embrapa"/);
  assert.match(page, /Campos usados nesta atualização/);
  assert.match(page, /quality\.currentSource === "embrapa"/);
  assert.match(page, /O portal decide campo a campo/);
  assert.match(route, /A condição consolidada é montada campo a campo/);
  assert.match(route, /Campos ausentes permanecem indisponíveis/);
});

test("station links and dataset metadata remain transparent and safe", () => {
  assert.match(page, /const datasetSchema = available/);
  assert.match(page, /"@type": "Dataset"/);
  assert.match(page, /GeoCoordinates/);
  assert.match(page, /observation\.source\.latitude/);
  assert.match(page, /observation\.source\.longitude/);
  assert.match(page, /observation\.source\.altitude/);
  assert.match(page, /isBasedOn: observation\.source\.url/);
  assert.doesNotMatch(page, /temporalCoverage:/);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  assert.match(page, /Monitor da Embrapa/);
});

test("unavailable state removes links to absent measurement sections", () => {
  assert.match(page, /className=\{`embrapa-v2-chapters\$\{available \? "" : " is-compact"\}`\}/);
  assert.match(page, /\{available \? \([\s\S]*href="#leitura-observada"/);
  assert.match(page, /<span>\{available \? "05" : "02"\}<\/span>/);
  assert.match(refinement, /embrapa-v2-chapters\.is-compact/);
  assert.match(refinement, /repeat\(2, minmax\(0, 1fr\)\)/);
});

test("Embrapa page follows the current responsive retail system", () => {
  assert.match(styles, /internal-weather-shell--embrapa \.embrapa-v2-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /scroll-margin-top:\s*8rem/);
  assert.match(styles, /@media \(max-width: 1280px\)/);
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[0-6][0-9]rem/);
});
