import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("src/production/components/inmet-alerts-panel.tsx", "utf8");
const homeStyles = readFileSync("src/production/components/inmet-alerts-home.css", "utf8");

test("homepage chooses the active, most relevant and most severe INMET alert", () => {
  assert.match(component, /const severityRank/);
  assert.match(component, /const relevanceRank/);
  assert.match(component, /const periodRank/);
  assert.match(component, /severityRank\[second\.severity\] - severityRank\[first\.severity\]/);
  assert.match(component, /primaryHomeAlert\(data\)/);
  assert.match(component, /className={`tp-home-alert \$\{colorClass\}/);
  assert.match(component, /data-alert-severity=\{primary\.severity\}/);
});

test("homepage INMET bar owns the official yellow orange and red semantics locally", () => {
  assert.match(homeStyles, /\.tp-home-alert\.is-officially-classified\.severity-potential\s*\{[\s\S]*--risk:\s*#d6ae00/);
  assert.match(homeStyles, /\.tp-home-alert\.is-officially-classified\.severity-danger\s*\{[\s\S]*--risk:\s*#ef7d2f/);
  assert.match(homeStyles, /\.tp-home-alert\.is-officially-classified\.severity-great-danger\s*\{[\s\S]*--risk:\s*#d93636/);
  assert.match(homeStyles, /border:\s*1px solid color-mix\(in srgb, var\(--risk\)/);
  assert.match(homeStyles, /background:\s*color-mix\(in srgb, var\(--risk\)/);
});

test("homepage alert styling is isolated from historical home-inmet selectors", () => {
  assert.match(component, /import "\.\/inmet-alerts-home\.css"/);
  assert.doesNotMatch(component, /className={`home-inmet-alerts/);
  assert.doesNotMatch(homeStyles, /\.home-inmet-alerts/);
  assert.match(homeStyles, /@media \(max-width: 720px\)/);
});
