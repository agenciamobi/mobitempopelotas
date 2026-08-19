import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const shellCss = readFileSync("src/production/styles/home-editorial-shell.css", "utf8");
const forecastCss = readFileSync(
  "src/production/components/home-forecast-editorial.css",
  "utf8",
);
const radarCss = readFileSync(
  "src/production/components/home-radar-editorial.css",
  "utf8",
);
const observationCss = readFileSync(
  "src/production/components/home-observation-editorial.css",
  "utf8",
);
const waterCss = readFileSync(
  "src/production/components/home-water-editorial.css",
  "utf8",
);
const exploreCss = readFileSync("src/components/weather/HomeExplorePortal.css", "utf8");
const guideCss = readFileSync("src/production/components/home-data-guide.css", "utf8");

test("the homepage uses one minimal late shell instead of global visual override layers", () => {
  const removedLegacyLayers = [
    "home-alert-flow-v7.css",
    "home-alert-flow-v9.css",
    "home-detail-navigation-v10.css",
    "home-detail-content-v10.css",
    "home-cohesion-v12.css",
    "home-cohesion-v12-content.css",
    "home-navigation-v13.css",
    "home-editorial-current.css",
    "home-editorial-ux.css",
    "home-editorial-forecast.css",
    "home-editorial-layout.css",
    "home-radar-editorial-v45.css",
    "home-weekly-radar-usability-v47.css",
    "home-water-editorial-v49.css",
    "home-closing-editorial-v50.css",
    "home-explore-refinement-v19.css",
  ];

  for (const entry of [cssEntry, tsEntry]) {
    assert.match(entry, /home-editorial-shell\.css/);
    for (const layer of removedLegacyLayers) {
      assert.doesNotMatch(entry, new RegExp(layer.replaceAll(".", "\\.")));
    }
  }
});

test("the late homepage shell contains only transversal behavior", () => {
  assert.match(shellCss, /Home — shell editorial mínimo/);
  assert.match(shellCss, /\.site-shell--home-editorial\s*\{/);
  assert.match(shellCss, /\.home-editorial-main/);
  assert.match(shellCss, /scroll-margin-top:\s*92px/);
  assert.match(shellCss, /:focus-visible/);
  assert.match(shellCss, /prefers-reduced-motion/);
  assert.doesNotMatch(shellCss, /\.tp-home-(forecast|radar|observation|water|explore|guide|inmet|hero|alert)/);
  assert.doesNotMatch(shellCss, /!important/);
  assert.doesNotMatch(shellCss, /box-shadow/);
});

test("public homepage chapters are open and locally owned", () => {
  for (const css of [forecastCss, observationCss, waterCss, exploreCss, guideCss]) {
    assert.doesNotMatch(css, /!important/);
    assert.doesNotMatch(css, /box-shadow/);
  }

  assert.match(forecastCss, /\.tp-home-forecast\s*\{/);
  assert.match(observationCss, /\.tp-home-observation\s*\{/);
  assert.match(waterCss, /\.tp-home-water\s*\{/);
  assert.match(exploreCss, /\.tp-home-explore\s*\{/);
  assert.match(guideCss, /\.tp-home-guide\s*\{/);
});

test("the interactive radar keeps one scientific frame instead of a chapter card", () => {
  assert.match(radarCss, /\.tp-home-radar\s*\{[\s\S]*border-top:\s*1px solid/);
  assert.match(radarCss, /\.tp-home-radar__frame\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(radarCss, /border-radius:\s*8px/);
  assert.doesNotMatch(radarCss, /box-shadow/);
  assert.doesNotMatch(radarCss, /!important/);
});

test("isolated chapters include explicit mobile composition", () => {
  assert.match(forecastCss, /@media \(max-width: 700px\)/);
  assert.match(radarCss, /@media \(max-width: 700px\)/);
  assert.match(observationCss, /@media \(max-width: 700px\)/);
  assert.match(waterCss, /@media \(max-width: 720px\)/);
  assert.match(exploreCss, /@media \(max-width: 640px\)/);
  assert.match(guideCss, /@media \(max-width: 640px\)/);
});
