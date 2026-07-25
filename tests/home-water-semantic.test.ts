import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const semanticDashboard = readFileSync(
  "src/production/components/home-editorial-dashboard-semantic.tsx",
  "utf8",
);
const waterCss = readFileSync("src/production/styles/home-water-semantic-v53.css", "utf8");

test("water semantic layer loads after the previous editorial layers", () => {
  for (const entry of [cssEntry, tsEntry]) {
    assert.match(entry, /home-water-semantic-v53\.css/);
    assert.ok(entry.indexOf("header-megamenu-editorial-v52.css") < entry.indexOf("home-water-semantic-v53.css"));
  }
});

test("Guaíba context card follows its calculated trend instead of a fixed reference color", () => {
  assert.match(semanticDashboard, /waterLevelStateClass\(waterStates\.guaiba\)/);
  assert.match(waterCss, /\.home-water-context\.level-state--falling/);
  assert.match(waterCss, /\.home-water-context\.level-state--rising/);
  assert.match(waterCss, /\.home-water-context\.level-state--stable/);
  assert.match(waterCss, /\.home-water-context\.level-state--flood/);
  assert.match(waterCss, /box-shadow:\s*inset 4px 0 0 var\(--water-level-falling\)/);
  assert.match(waterCss, /box-shadow:\s*inset 4px 0 0 var\(--water-level-rising\)/);
});

test("water trend legend exposes falling, rising and stable references", () => {
  assert.match(semanticDashboard, /className="home-water-trend-legend"/);
  assert.match(semanticDashboard, />\s*Baixando\s*</);
  assert.match(semanticDashboard, />\s*Subindo\s*</);
  assert.match(semanticDashboard, />\s*Estável\s*</);
  assert.match(semanticDashboard, /aria-label="Legenda das tendências do nível da água"/);
  assert.match(waterCss, /span\.is-falling > i/);
  assert.match(waterCss, /span\.is-rising > i/);
  assert.match(waterCss, /span\.is-stable > i/);
});

test("stable water state uses the shared gray semantic color", () => {
  assert.match(waterCss, /--water-level-stable:\s*#b7bec2/);
  assert.match(waterCss, /--water-level-stable-ink:\s*#61717a/);
  assert.match(waterCss, /\.home-water-focus\.level-state--stable::before/);
  assert.match(waterCss, /article\.level-state--stable::before/);
  assert.match(waterCss, /\.guaiba-level-card\.level-state--stable::before/);
  assert.match(waterCss, /\.lagoon-monitoring-card\.level-state--stable/);
  assert.match(waterCss, /\.regional-water-trend\.is-stable/);
});
