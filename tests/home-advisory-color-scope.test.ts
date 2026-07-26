import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const advisoryStyles = readFileSync(
  "src/production/styles/home-advisory-color-scope-v65.css",
  "utf8",
);
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");

test("hero title keeps the MOBI purple identity during attention and warning states", () => {
  assert.match(advisoryStyles, /\.weather-hero--attention \.weather-hero-headline/);
  assert.match(advisoryStyles, /\.weather-hero--warning \.weather-hero-headline/);
  assert.match(advisoryStyles, /color:\s*#5e2ced/);
});

test("ordinary hero actions stay neutral while the alert CTA keeps the risk token", () => {
  assert.match(advisoryStyles, /\.weather-hero-primary\s*\{[\s\S]*background:\s*#071e2f/);
  assert.match(
    advisoryStyles,
    /\.weather-hero-primary\[href="\/alertas"\]\s*\{[\s\S]*background:\s*var\(--hero-accent\)/,
  );
  assert.match(advisoryStyles, /\.weather-hero-secondary\s*\{[\s\S]*color:\s*#16384a/);
});

test("advisory color scope is the last production style layer", () => {
  const tsGeometry = styleImports.indexOf("home-live-camera-exact-geometry-v64.css");
  const tsAdvisory = styleImports.indexOf("home-advisory-color-scope-v65.css");
  const cssGeometry = globalStyles.indexOf("home-live-camera-exact-geometry-v64.css");
  const cssAdvisory = globalStyles.indexOf("home-advisory-color-scope-v65.css");

  assert.ok(tsGeometry >= 0 && tsAdvisory > tsGeometry);
  assert.ok(cssGeometry >= 0 && cssAdvisory > cssGeometry);
});
