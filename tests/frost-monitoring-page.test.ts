import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/mapa-de-geadas-rio-grande-do-sul.tsx", "utf8");
const page = readFileSync("src/components/inmet/FrostMapPageV2.tsx", "utf8");
const styles = readFileSync("src/components/inmet/FrostMapPageV2.css", "utf8");

const frostSource = `${route}\n${page}`;

test("frost route uses shared shell and parallel official data loaders", () => {
  assert.match(route, /createFileRoute\("\/mapa-de-geadas-rio-grande-do-sul"\)/);
  assert.match(route, /getInmetFrostOverview\(\)/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /FrostMapHero/);
  assert.match(route, /FrostMapPageV2/);
  assert.match(route, /pageClassName="internal-weather-shell--frost"/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /staleTime: 15 \* 60 \* 1_000/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, FROST_PAGE_CONTENT\.faqs\)/);
});

test("frost monitoring explicitly distinguishes observation from forecast", () => {
  assert.match(page, /Cada ponto representa uma estação e uma data[\s\S]*passada/);
  assert.match(page, /Compare os registros passados com a previsão/);
  assert.match(route, /O mapa mostra registros passados e não prevê geada/);
  assert.match(route, /O mapa mostra previsão de geada\?/);
  assert.doesNotMatch(frostSource, /previsão confirmada de geada/i);
});

test("absence of returned observations is never equated with absence of frost", () => {
  assert.match(page, /Nenhum registro foi encontrado para estes filtros/);
  assert.match(page, /Isso não comprova ausência de geada/);
  assert.match(page, /Ausência de ponto não significa ausência de geada/);
  assert.match(route, /Quando nenhum registro aparece/);
  assert.match(route, /Nenhum ponto no mapa significa que não houve geada/);
  assert.doesNotMatch(frostSource, /não houve geada no Rio Grande do Sul/i);
});

test("period and station type filters update through abortable internal requests", () => {
  assert.match(page, /const PERIOD_OPTIONS = \[1, 5, 10, 15, 20, 30\] as const/);
  assert.match(page, /FrostStationType/);
  assert.match(page, /aria-pressed=\{days === option\}/);
  assert.match(page, /aria-pressed=\{stationType === type\}/);
  assert.match(page, /fetch\(`\/api\/inmet\/geadas\?days=\$\{days\}&stationType=\$\{stationType\}&uf=RS`/);
  assert.match(page, /new AbortController\(\)/);
  assert.match(page, /signal: controller\.signal/);
  assert.match(page, /return \(\) => controller\.abort\(\)/);
  assert.match(page, /Os últimos dados válidos continuam na tela/);
});

test("map remains lazy, clustered and resilient when tiles fail", () => {
  assert.match(page, /IntersectionObserver/);
  assert.match(page, /rootMargin: "260px"/);
  assert.match(page, /await import\("maplibre-gl"\)/);
  assert.match(page, /cluster: true/);
  assert.match(page, /clusterMaxZoom: 8/);
  assert.match(page, /clusterRadius: 44/);
  assert.match(page, /FullscreenControl/);
  assert.match(page, /cooperativeGestures: true/);
  assert.match(page, /Mapa temporariamente indisponível/);
  assert.match(page, /A lista continua disponível abaixo/);
});

test("conventional and automatic stations preserve distinct interpretation", () => {
  assert.match(page, /type === "CONVENCIONAL" \? "Convencional" : "Automática"/);
  assert.match(page, /As estações convencionais podem mostrar intensidade forte, moderada ou fraca/);
  assert.match(page, /Estações convencionais/);
  assert.match(page, /Estações automáticas/);
  assert.match(route, /Nas estações automáticas/);
  assert.match(route, /Nas estações convencionais/);
});

test("map clusters are not presented as territorial frost coverage", () => {
  assert.match(page, /Os círculos com números apenas juntam pontos próximos/);
  assert.match(page, /não mostram o tamanho da área/);
  assert.match(route, /Os círculos com números apenas juntam estações próximas/);
  assert.match(route, /Os círculos agrupados mostram o tamanho da área com geada\?/);
});

test("accessible table preserves the exact returned observations", () => {
  assert.match(page, /<caption>Registros de geada encontrados/);
  assert.match(page, /<th scope="col">Estação<\/th>/);
  assert.match(page, /<th scope="row">/);
  assert.match(page, /observation\.stationName/);
  assert.match(page, /observation\.stationCode/);
  assert.match(page, /observation\.minimumTemperature/);
  assert.match(page, /observation\.intensityLabel/);
  assert.match(page, /\.slice\(0, 60\)/);
  assert.match(page, /até 60 registros recentes/);
});

test("frost page follows responsive retail and accessibility contracts", () => {
  assert.match(styles, /internal-weather-shell--frost \.frost-v2-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
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
