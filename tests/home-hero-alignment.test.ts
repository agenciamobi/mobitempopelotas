import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const alignmentStyles = readFileSync(
  "src/production/styles/home-hero-alignment-v66.css",
  "utf8",
);
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");

test("hero reasons share a stable left edge and keep markers in normal flow", () => {
  assert.match(alignmentStyles, /\.weather-hero-reasons\s*\{[\s\S]*width:\s*min\(100%, 620px\)/);
  assert.match(alignmentStyles, /\.weather-hero-reasons span\s*\{[\s\S]*display:\s*flex/);
  assert.match(alignmentStyles, /align-items:\s*flex-start/);
  assert.match(alignmentStyles, /gap:\s*0\.68rem/);
  assert.match(alignmentStyles, /\.weather-hero-reasons span::before\s*\{[\s\S]*position:\s*static/);
  assert.match(alignmentStyles, /flex:\s*0 0 auto/);
});

test("hero actions follow the same content width and stack cleanly on mobile", () => {
  assert.match(alignmentStyles, /\.weather-hero-actions\s*\{[\s\S]*width:\s*min\(100%, 620px\)/);
  assert.match(alignmentStyles, /justify-content:\s*flex-start/);
  assert.match(alignmentStyles, /@media \(max-width:\s*680px\)[\s\S]*flex-direction:\s*column/);
  assert.match(alignmentStyles, /\.weather-hero-primary\s*\{[\s\S]*width:\s*100%/);
});

test("hero alignment layer is loaded after advisory color scoping", () => {
  const tsColor = styleImports.indexOf("home-advisory-color-scope-v65.css");
  const tsAlignment = styleImports.indexOf("home-hero-alignment-v66.css");
  const cssColor = globalStyles.indexOf("home-advisory-color-scope-v65.css");
  const cssAlignment = globalStyles.indexOf("home-hero-alignment-v66.css");

  assert.ok(tsColor >= 0 && tsAlignment > tsColor);
  assert.ok(cssColor >= 0 && cssAlignment > cssColor);
});
