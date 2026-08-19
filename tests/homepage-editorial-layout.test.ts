import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const layoutCss = readFileSync("src/production/styles/home-editorial-layout.css", "utf8");
const forecastCss = readFileSync(
  "src/production/components/home-forecast-editorial.css",
  "utf8",
);
const radarCss = readFileSync(
  "src/production/components/home-radar-editorial.css",
  "utf8",
);

test("the open-canvas homepage layer remains the final global home layer", () => {
  for (const entry of [cssEntry, tsEntry]) {
    assert.match(entry, /home-editorial-layout\.css/);
    assert.doesNotMatch(entry, /home-editorial-forecast\.css/);
    assert.doesNotMatch(entry, /home-radar-editorial-v45\.css/);
    assert.doesNotMatch(entry, /home-weekly-radar-usability-v47\.css/);
  }
});

test("public information chapters stay open while the interactive radar owns one scientific frame", () => {
  assert.match(
    layoutCss,
    /\.home-observation-story,[\s\S]*\.home-story--water,[\s\S]*\.home-explore-portal,[\s\S]*\.editorial-answer-section[\s\S]*border:\s*0 !important/,
  );
  assert.match(radarCss, /\.tp-home-radar\s*\{[\s\S]*border-top:\s*1px solid/);
  assert.match(radarCss, /\.tp-home-radar__frame\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(radarCss, /border-radius:\s*8px/);
  assert.doesNotMatch(radarCss, /box-shadow/);
});

test("legacy decorative chapter bars do not return on open homepage sections", () => {
  assert.match(
    layoutCss,
    /\.home-observation-story::before,[\s\S]*\.home-explore-portal::before,[\s\S]*\.editorial-answer-section::before[\s\S]*display:\s*none !important/,
  );
  assert.match(layoutCss, /Remove marcadores de capítulo herdados das versões antigas/);
});

test("forecast is owned by its isolated component rather than the global cascade", () => {
  assert.match(forecastCss, /\.tp-home-forecast\s*\{/);
  assert.match(forecastCss, /\.tp-home-forecast__hours\s*\{/);
  assert.match(forecastCss, /\.tp-home-forecast-week__list\s*\{/);
  assert.doesNotMatch(forecastCss, /!important/);
});

test("open homepage chapters have an explicit mobile composition", () => {
  assert.match(layoutCss, /@media \(max-width: 720px\)/);
  assert.match(layoutCss, /width:\s*calc\(100% - 16px\) !important/);
  assert.match(layoutCss, /\.home-explore-portal\s*\{[\s\S]*grid-template-columns:\s*1fr !important/);
  assert.match(layoutCss, /#como-interpretar-o-tempo\.editorial-answer-section/);
  assert.match(radarCss, /@media \(max-width: 700px\)/);
});
