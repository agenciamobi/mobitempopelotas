import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const geometryStyles = readFileSync(
  "src/production/styles/home-live-camera-exact-geometry-v64.css",
  "utf8",
);

test("live camera media box keeps four rounded corners on desktop and tablet", () => {
  assert.match(
    geometryStyles,
    /@media \(min-width:\s*1181px\)[\s\S]*border-radius:\s*clamp\(22px, 1\.7vw, 28px\)\s*;/,
  );
  assert.match(
    geometryStyles,
    /@media \(max-width:\s*1180px\) and \(min-width:\s*901px\)[\s\S]*border-radius:\s*clamp\(20px, 1\.7vw, 26px\)\s*;/,
  );
  assert.doesNotMatch(geometryStyles, /border-radius:\s*0 0 clamp\(/);
});

test("mobile camera media box also keeps uniform corner radii", () => {
  assert.match(geometryStyles, /@media \(max-width:\s*900px\)[\s\S]*border-radius:\s*14px/);
  assert.match(geometryStyles, /@media \(max-width:\s*620px\)[\s\S]*border-radius:\s*12px/);
});
