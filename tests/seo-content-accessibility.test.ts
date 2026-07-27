import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editorialRouteFiles = [
  "src/routes/previsao-7-dias-pelotas.tsx",
  "src/routes/chuva-em-pelotas.tsx",
  "src/routes/vento-em-pelotas.tsx",
  "src/routes/radar-e-satelite-pelotas.tsx",
  "src/routes/meteograma-pelotas.tsx",
  "src/routes/estacao-embrapa-pelotas.tsx",
  "src/routes/historico-climatico-pelotas.tsx",
  "src/routes/cameras-ao-vivo-pelotas.tsx",
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

test("editorial WebPage schema remains answer-engine friendly", () => {
  const source = read("src/lib/structured-data.ts");

  assert.match(source, /isAccessibleForFree:\s*true/);
  assert.match(source, /"@type": "ReadAction"/);
  assert.match(source, /keywords:\s*about\.join/);
  assert.match(source, /SpeakableSpecification/);
});

test("below-fold editorial content uses delayed rendering", () => {
  const source = read("src/components/content/EditorialContentSection.css");

  assert.match(source, /content-visibility:\s*auto/);
  assert.match(source, /contain-intrinsic-size:\s*auto 900px/);
});
