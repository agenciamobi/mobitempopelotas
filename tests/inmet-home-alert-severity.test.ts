import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(
  "src/production/components/inmet-alerts-panel.tsx",
  "utf8",
);
const baseStyles = readFileSync(
  "src/production/styles/inmet-alerts.css",
  "utf8",
);
const editorialStyles = readFileSync(
  "src/production/styles/home-alert-flow-v7.css",
  "utf8",
);

test("homepage chooses the active, most relevant and most severe INMET alert", () => {
  assert.match(component, /const severityRank/);
  assert.match(component, /const relevanceRank/);
  assert.match(component, /const periodRank/);
  assert.match(component, /severityRank\[second\.severity\] - severityRank\[first\.severity\]/);
  assert.match(component, /primaryHomeAlert\(data\)/);
  assert.match(component, /className={`home-inmet-alerts severity-\$\{primary\.severity\}`}/);
  assert.match(component, /data-alert-severity=\{primary\.severity\}/);
});

test("homepage INMET bar maps official severities to yellow, orange and red", () => {
  for (const styles of [baseStyles, editorialStyles]) {
    assert.match(styles, /home-inmet-alerts\.severity-potential\s*\{[\s\S]*--risk:\s*#d6ae00/);
    assert.match(styles, /home-inmet-alerts\.severity-danger\s*\{[\s\S]*--risk:\s*#ef7d2f/);
    assert.match(styles, /home-inmet-alerts\.severity-great-danger\s*\{[\s\S]*--risk:\s*#d93636/);
  }

  assert.match(editorialStyles, /home-inmet-alerts__mark\s*\{[\s\S]*background:\s*var\(--risk\)/);
  assert.match(editorialStyles, /background:\s*linear-gradient\(135deg,\s*color-mix\(in srgb,\s*var\(--risk\)/);
  assert.match(editorialStyles, /border:\s*1px solid color-mix\(in srgb,\s*var\(--risk\)/);
});
