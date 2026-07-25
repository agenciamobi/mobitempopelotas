import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const internalCss = readFileSync(
  "src/production/styles/internal-home-cohesion-v48.css",
  "utf8",
);
const internalFixCss = readFileSync(
  "src/production/styles/internal-home-cohesion-v48-fix.css",
  "utf8",
);
const homeWaterCss = readFileSync(
  "src/production/styles/home-water-editorial-v49.css",
  "utf8",
);

test("final editorial layers preserve their cascade order", () => {
  const finalLayers = [
    "internal-home-cohesion-v48.css",
    "internal-home-cohesion-v48-fix.css",
    "home-water-editorial-v49.css",
  ];

  for (const layer of finalLayers) {
    assert.match(cssEntry, new RegExp(layer.replace(".", "\\.")));
    assert.match(tsEntry, new RegExp(layer.replace(".", "\\.")));
  }

  assert.ok(cssEntry.indexOf(finalLayers[0]) < cssEntry.indexOf(finalLayers[1]));
  assert.ok(cssEntry.indexOf(finalLayers[1]) < cssEntry.indexOf(finalLayers[2]));
  assert.ok(tsEntry.indexOf(finalLayers[0]) < tsEntry.indexOf(finalLayers[1]));
  assert.ok(tsEntry.indexOf(finalLayers[1]) < tsEntry.indexOf(finalLayers[2]));
});

test("internal pages share the homepage frame and fullwidth hero", () => {
  assert.match(internalCss, /--portal-frame-max:\s*1760px/);
  assert.match(internalCss, /\.site-shell--topic \.site-container--topic\s*\{[\s\S]*width:\s*100%/);
  assert.match(internalCss, /border-radius:\s*0 0 clamp\(/);
  assert.match(internalCss, /max\(\s*var\(--portal-content-gutter\)/);
});

test("internal chapters use delayed offscreen rendering", () => {
  assert.match(internalCss, /content-visibility:\s*auto/);
  assert.match(internalCss, /contain-intrinsic-size:\s*auto 620px/);
});

test("internal footer preserves compact operational links", () => {
  assert.match(internalFixCss, /\.editorial-footer__operational\s*\{[\s\S]*display:\s*grid/);
  assert.match(internalFixCss, /grid-template-columns:\s*repeat\(2/);
});

test("Lagoa homepage section uses the current light editorial composition", () => {
  assert.match(homeWaterCss, /\.home-story--water\s*\{[\s\S]*content-visibility:\s*auto/);
  assert.match(homeWaterCss, /linear-gradient\(155deg, #f9fcfb/);
  assert.match(homeWaterCss, /\.home-water-focus\s*\{[\s\S]*rgba\(255, 255, 255, 0\.92\)/);
  assert.match(homeWaterCss, /\.home-water-table__rows article\s*\{[\s\S]*border-radius:\s*17px/);
  assert.match(homeWaterCss, /level-state--rising::before/);
  assert.match(homeWaterCss, /level-state--falling::before/);
  assert.match(homeWaterCss, /level-state--flood::before/);
});

test("Lagoa visual remains usable on tablet and mobile", () => {
  assert.match(homeWaterCss, /@media \(max-width: 980px\)/);
  assert.match(homeWaterCss, /@media \(max-width: 720px\)/);
  assert.match(homeWaterCss, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(homeWaterCss, /\.home-water-table__columns\s*\{[\s\S]*display:\s*none !important/);
  assert.match(homeWaterCss, /@media \(prefers-reduced-motion: reduce\)/);
});
