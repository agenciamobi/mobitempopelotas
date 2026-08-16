import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editorialRouteFiles = [
  "src/routes/alertas.tsx",
  "src/routes/previsao-7-dias-pelotas.tsx",
  "src/routes/chuva-em-pelotas.tsx",
  "src/routes/vento-em-pelotas.tsx",
  "src/routes/radar-e-satelite-pelotas.tsx",
  "src/routes/meteograma-pelotas.tsx",
  "src/routes/clima-em-pelotas.tsx",
  "src/routes/estacao-embrapa-pelotas.tsx",
  "src/routes/historico-climatico-pelotas.tsx",
  "src/routes/cameras-ao-vivo-pelotas.tsx",
  "src/routes/mapa-de-geadas-rio-grande-do-sul.tsx",
  "src/routes/situacao-hidrologica-pelotas.tsx",
  "src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx",
] as const;

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("content routes expose visible answers and FAQ structured data", () => {
  for (const path of editorialRouteFiles) {
    const source = read(path);

    assert.match(source, /EditorialContentSection/);
    assert.match(source, /createFaqPageJsonLd/);
    assert.match(source, /about:\s*\[/);
  }
});

test("monitoring content distinguishes observation, imagery, history and telemetry", () => {
  const source = read("src/lib/editorial-content.ts");

  assert.match(source, /RADAR_EDITORIAL_CONTENT/);
  assert.match(source, /EMBRAPA_EDITORIAL_CONTENT/);
  assert.match(source, /HISTORY_EDITORIAL_CONTENT/);
  assert.match(source, /CAMERAS_EDITORIAL_CONTENT/);
  assert.match(source, /HYDROLOGY_EDITORIAL_CONTENT/);
  assert.match(source, /LARANJAL_LEVEL_EDITORIAL_CONTENT/);
  assert.match(source, /não substituem alertas oficiais/i);
  assert.match(source, /normal climatológica/i);
  assert.match(source, /não deve ser interpretada isoladamente/i);
});

test("alert page distinguishes unavailable INMET data from an all-clear state", () => {
  const route = read("src/routes/alertas.tsx");
  const page = read("src/components/weather/WeatherAlertsPage.tsx");
  const refinements = read("src/components/weather/WeatherAlertsRefinements.css");

  assert.match(route, /Alertas meteorológicos em Pelotas e região/);
  assert.match(route, /createFaqPageJsonLd/);
  assert.match(route, /como-interpretar-alertas/);
  assert.match(page, /Não foi possível confirmar os alertas do INMET/);
  assert.match(page, /Não interprete a falha como ausência de risco/);
  assert.match(page, /sourceAvailable/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /Última consulta ao INMET/);
  assert.match(refinements, /alerts-clear-state\.is-unavailable/);
  assert.match(refinements, /@media \(max-width: 760px\)/);
});

test("editorial links preserve visible names and attach descriptions", () => {
  const source = read("src/components/content/EditorialContentSection.tsx");

  assert.match(source, /aria-describedby=\{descriptionId\}/);
  assert.doesNotMatch(source, /aria-label=\{`\$\{link\.label\}/);
});

test("external operational links identify new tabs safely", () => {
  const alerts = read("src/components/weather/WeatherAlertsPage.tsx");
  const footer = read("src/components/layout/Footer.tsx");
  const redemet = read("src/components/redemet/RedemetOverview.tsx");
  const cameras = read("src/components/cameras/CameraExplorer.tsx");

  assert.match(alerts, /target="_blank"[\s\S]*rel="noopener noreferrer"/);
  assert.match(alerts, /site do INMET, em nova aba/);
  assert.match(footer, /target="_blank"[\s\S]*rel="noopener noreferrer"/);
  assert.match(footer, /tempo-pelotas-purple\.svg/);
  assert.match(redemet, /rel="noopener noreferrer"/);
  assert.match(redemet, /site do \$\{sourceName\}, em nova aba/);
  assert.match(cameras, /rel="noopener noreferrer"/);
  assert.match(cameras, /provedor externo, em nova aba/);
});

test("radar and camera images avoid unnecessary synchronous decoding", () => {
  const redemet = read("src/components/redemet/RedemetOverview.tsx");
  const cameras = read("src/components/cameras/CameraExplorer.tsx");

  assert.match(redemet, /decoding="async"/);
  assert.match(redemet, /fetchPriority=\{kind === "radar" \? "high" : "auto"\}/);
  assert.match(cameras, /loading="lazy"[\s\S]*decoding="async"/);
});

test("editorial WebPage schema remains aligned with visible page semantics", () => {
  const source = read("src/lib/structured-data.ts");
  const frost = read("src/routes/mapa-de-geadas-rio-grande-do-sul.tsx");
  const regionalDirectory = read("src/routes/tempo-na-regiao-sul-rs.tsx");

  assert.match(source, /isAccessibleForFree:\s*true/);
  assert.match(source, /"@type": "ReadAction"/);
  assert.match(source, /keywords:\s*about\.join/);
  assert.match(source, /const location = options\.location \?\? createPelotasPlaceJsonLd\(\)/);
  assert.match(source, /contentLocation:\s*location/);
  assert.match(source, /"@type": "BreadcrumbList"/);
  assert.doesNotMatch(source, /SpeakableSpecification/);
  assert.match(frost, /location:\s*RIO_GRANDE_DO_SUL_LOCATION/);
  assert.match(frost, /\{ geo: null \}/);
  assert.match(regionalDirectory, /location:\s*SOUTHERN_RS_LOCATION/);
  assert.match(regionalDirectory, /\{ geo: null \}/);
});

test("below-fold editorial content uses delayed rendering", () => {
  const source = read("src/components/content/EditorialContentSection.css");

  assert.match(source, /content-visibility:\s*auto/);
  assert.match(source, /contain-intrinsic-size:\s*auto 900px/);
});
