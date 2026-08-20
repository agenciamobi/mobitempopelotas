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
  const cssBarrier = productionCss.indexOf("internal-editorial-precedence-barrier.css");
  const cssPrevious = productionCss.indexOf("internal-dedicated-page-stabilization.css");
  const tsBarrier = productionManifest.indexOf("internal-editorial-precedence-barrier.css");
  const tsPrevious = productionManifest.indexOf("internal-dedicated-page-stabilization.css");

  assert.ok(cssBarrier > cssPrevious);
  assert.ok(tsBarrier > tsPrevious);
  assert.equal(productionCss.slice(cssBarrier).includes("@import"), true);
  assert.equal(productionManifest.slice(tsBarrier).includes("import"), true);
});

test("lazy internal weather sections cannot restore legacy gradients or shadows", () => {
  assert.match(barrier, /site-shell--home-editorial\.internal-weather-shell/);
  assert.match(barrier, /> \[class\$="-page"\]/);
  assert.match(barrier, /background-image:\s*none !important/);
  assert.match(barrier, /box-shadow:\s*none !important/);
  assert.match(barrier, /border-radius:\s*var\(--route-editorial-radius\) !important/);
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
