import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync("src/production/styles/header-navigation-legibility-v68.css", "utf8");
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");

test("desktop navigation receives larger type and touch targets", () => {
  assert.match(styles, /font-size:\s*clamp\(0\.73rem/);
  assert.match(styles, /min-height:\s*52px/);
  assert.match(styles, /font-weight:\s*810/);
});

test("header refinement scales down before navigation overflows", () => {
  assert.match(styles, /@media \(max-width:\s*1260px\)/);
  assert.match(styles, /@media \(max-width:\s*1080px\)/);
});

test("header legibility is the last global style layer", () => {
  assert.ok(styleImports.indexOf("header-navigation-legibility-v68.css") > styleImports.indexOf("map-navigation-standard-v67.css"));
  assert.ok(globalStyles.indexOf("header-navigation-legibility-v68.css") > globalStyles.indexOf("map-navigation-standard-v67.css"));
});
