import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeFiles = [
  "src/routes/previsao-7-dias-pelotas.tsx",
  "src/routes/chuva-em-pelotas.tsx",
  "src/routes/vento-em-pelotas.tsx",
] as const;

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("content forecast routes expose visible answers and FAQ structured data", () => {
  for (const path of routeFiles) {
    const source = read(path);

    assert.match(source, /EditorialContentSection/);
    assert.match(source, /createFaqPageJsonLd/);
    assert.match(source, /about:\s*\[/);
  }
});

test("editorial links preserve visible names and attach descriptions", () => {
  const source = read("src/components/content/EditorialContentSection.tsx");

  assert.match(source, /aria-describedby=\{descriptionId\}/);
  assert.doesNotMatch(source, /aria-label=\{`\$\{link\.label\}/);
});

test("external operational links identify new tabs safely", () => {
  const alerts = read("src/components/weather/WeatherAlertsPage.tsx");
  const footer = read("src/components/layout/Footer.tsx");

  assert.match(alerts, /target="_blank"[\s\S]*rel="noopener noreferrer"/);
  assert.match(alerts, /site do INMET, em nova aba/);
  assert.match(footer, /target="_blank"[\s\S]*rel="noopener noreferrer"/);
  assert.match(footer, /tempo-pelotas-purple\.svg/);
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
