import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const barrier = readFileSync(
  "src/production/styles/internal-editorial-precedence-barrier.css",
  "utf8",
);
const productionCss = readFileSync("src/production/production-styles.css", "utf8");
const productionManifest = readFileSync("src/production/production-styles.ts", "utf8");

test("editorial precedence barrier is the final production style layer", () => {
  const cssImports = productionCss
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@import "));
  const tsImports = productionManifest
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("import "));

  assert.equal(
    cssImports.at(-2),
    '@import "./styles/internal-dedicated-page-stabilization.css";',
  );
  assert.equal(
    cssImports.at(-1),
    '@import "./styles/internal-editorial-precedence-barrier.css";',
  );
  assert.equal(
    tsImports.at(-2),
    'import "./styles/internal-dedicated-page-stabilization.css";',
  );
  assert.equal(
    tsImports.at(-1),
    'import "./styles/internal-editorial-precedence-barrier.css";',
  );
});

test("lazy internal weather sections cannot restore legacy gradients or shadows", () => {
  assert.match(barrier, /site-shell--home-editorial\.internal-weather-shell/);
  assert.match(barrier, /> \[class\$="-page"\]/);
  assert.match(barrier, /background-image:\s*none !important/);
  assert.match(barrier, /box-shadow:\s*none !important/);
  assert.match(barrier, /border-radius:\s*var\(--route-editorial-radius\) !important/);
});

test("retail forecast heroes keep the Home surface after lazy route CSS loads", () => {
  for (const namespace of [
    "internal-weather-shell--today",
    "internal-weather-shell--tomorrow",
    "internal-weather-shell--seven-day",
    "internal-weather-shell--rain",
  ]) {
    assert.match(barrier, new RegExp(`\\.${namespace}`));
  }

  for (const hero of [
    "today-retail-hero",
    "tomorrow-retail-hero",
    "seven-day-retail-hero",
    "rain-retail-hero",
  ]) {
    assert.match(barrier, new RegExp(`\\.${hero}`));
  }

  assert.match(
    barrier,
    /:is\(\.today-retail-hero, \.tomorrow-retail-hero, \.seven-day-retail-hero, \.rain-retail-hero\)[\s\S]*?background-image:\s*none !important[\s\S]*?box-shadow:\s*none !important/,
  );
  assert.match(
    barrier,
    /:is\(\.today-retail-hero, \.tomorrow-retail-hero, \.seven-day-retail-hero, \.rain-retail-hero\)::before,[\s\S]*?::after[\s\S]*?display:\s*none !important/,
  );
});

test("topic and dedicated pages receive the same Home surface protection", () => {
  assert.match(barrier, /\.site-shell--topic/);
  assert.match(barrier, /\.hydrology-editorial-route > section/);
  assert.match(barrier, /\.radar-satellite-page > section/);
  assert.match(barrier, /\.redemet-page > section/);
  assert.match(barrier, /internal-weather-shell--cameras/);
  assert.match(barrier, /internal-weather-shell--meteogram/);
  assert.match(barrier, /internal-weather-shell--embrapa/);
  assert.match(barrier, /internal-weather-shell--history/);
});

test("functional visualizations are not flattened by the editorial barrier", () => {
  assert.match(barrier, /maplibregl-map/);
  assert.match(barrier, /iframe/);
  assert.match(barrier, /video/);
  assert.match(barrier, /canvas/);
  assert.match(barrier, /svg\[data-chart\]/);
});
