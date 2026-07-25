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
  assert.match(radarEditorialCss, /content-visibility:\s*auto/);
  assert.match(radarEditorialCss, /contain-intrinsic-size:/);
});
