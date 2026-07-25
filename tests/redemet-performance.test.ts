import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const radarRoute = readFileSync("src/routes/api/redemet/radar.ts", "utf8");
const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");
const stormsRoute = readFileSync("src/routes/api/redemet/storms.ts", "utf8");
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const radarEditorialCss = readFileSync(
  "src/production/styles/home-radar-editorial-v45.css",
  "utf8",
);
const radarCohesionCss = readFileSync(
  "src/production/styles/home-radar-embrapa-cohesion-v46.css",
  "utf8",
);
const radarUsabilityCss = readFileSync(
  "src/production/styles/home-weekly-radar-usability-v47.css",
  "utf8",
);

const weeklyPortal = readFileSync(
  "src/production/components/home-trend-editorial-portal.tsx",
  "utf8",
);

 test("REDEMET limits animation payloads", () => {
  assert.match(radarRoute, /const MAX_FRAMES = 8;/);
  assert.match(satelliteRoute, /const MAX_FRAMES = 8;/);
  assert.match(stormsRoute, /const MAX_FRAMES = 12;/);
  assert.match(radarRoute, /Math\.min\(MAX_FRAMES/);
  assert.match(satelliteRoute, /Math\.min\(MAX_FRAMES/);
  assert.match(stormsRoute, /Math\.min\(MAX_FRAMES/);
});

test("radar editorial section skips offscreen rendering", () => {
  assert.match(cssEntry, /home-radar-editorial-v45\.css/);
  assert.match(cssEntry, /home-radar-embrapa-cohesion-v46\.css/);
  assert.match(cssEntry, /home-weekly-radar-usability-v47\.css/);
  assert.match(radarEditorialCss, /content-visibility:\s*auto/);
  assert.match(radarEditorialCss, /contain-intrinsic-size:/);
  assert.match(radarCohesionCss, /contain:\s*layout paint style/);
});

test("radar final layers reduce expensive effects and preserve map gestures", () => {
  assert.match(radarCohesionCss, /backdrop-filter:\s*none\s*!important/);
  assert.match(radarCohesionCss, /grid-template-columns:\s*minmax\(300px, 0\.58fr\)/);
  assert.match(radarUsabilityCss, /\.radar-player\s*\{[\s\S]*pointer-events:\s*none/);
  assert.match(radarUsabilityCss, /map-canvas--satellite[\s\S]*width:\s*min\(680px/);
  assert.match(radarUsabilityCss, /maplibregl-ctrl-bottom-right[\s\S]*top:\s*82px/);
});

test("weekly cards receive adaptive summaries for all visible days", () => {
  assert.match(weeklyPortal, /weather\.daily\.slice\(1, 5\)/);
  assert.match(weeklyPortal, /home-next-days__day-summary/);
  assert.match(radarUsabilityCss, /home-next-days__day-summary/);
});
