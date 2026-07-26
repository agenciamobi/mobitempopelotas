import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigationStyles = readFileSync(
  "src/production/styles/map-navigation-standard-v67.css",
  "utf8",
);
const mapModuleStyles = readFileSync(
  "src/production/components/weather-map.module.css",
  "utf8",
);
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");

test("primary map modes keep three equal columns in every state", () => {
  assert.match(navigationStyles, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(navigationStyles, /width:\s*min\(330px/);
  assert.match(navigationStyles, /\.map-layer-switcher button\s*\{[\s\S]*width:\s*100%/);
});

test("mobile map navigation uses the full safe width without horizontal overflow", () => {
  assert.match(navigationStyles, /@media \(max-width:\s*640px\)/);
  assert.match(navigationStyles, /right:\s*12px/);
  assert.match(navigationStyles, /left:\s*12px/);
  assert.match(navigationStyles, /overflow:\s*visible/);
});

test("satellite submodes use the same equal-width navigation model", () => {
  assert.match(mapModuleStyles, /\.satelliteSwitcher\s*\{[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(mapModuleStyles, /width:\s*min\(330px/);
  assert.match(mapModuleStyles, /\.satelliteSwitcher button\s*\{[\s\S]*width:\s*100%/);
});

test("city tags stay compact on smaller maps", () => {
  assert.match(mapModuleStyles, /\.locationMarker\s*\{[\s\S]*max-width:\s*150px/);
  assert.match(mapModuleStyles, /@media \(max-width:\s*900px\)[\s\S]*\.locationMarker span\s*\{[\s\S]*display:\s*none/);
});

test("map navigation standard is loaded after previous visual refinements", () => {
  const previous = styleImports.indexOf("home-hero-alignment-v66.css");
  const current = styleImports.indexOf("map-navigation-standard-v67.css");
  assert.ok(previous >= 0 && current > previous);
});
