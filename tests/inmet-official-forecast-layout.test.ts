import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(
  "src/production/components/inmet-official-forecast-panel.tsx",
  "utf8",
);
const refinement = readFileSync(
  "src/production/components/inmet-official-forecast-panel-refinement.css",
  "utf8",
);

test("official INMET forecast heading keeps only the essential title and description", () => {
  assert.match(component, /<h2 id="inmet-official-title">Previsão oficial para Pelotas<\/h2>/);
  assert.doesNotMatch(component, />INMET<\/strong>/);
  assert.doesNotMatch(component, /Previsão municipal oficial/);
  assert.doesNotMatch(component, /Município monitorado/);
  assert.doesNotMatch(component, /Pelotas, RS/);
  assert.doesNotMatch(component, /Código IBGE 4314407/);
  assert.doesNotMatch(component, /inmet-official-reference/);
});

test("official alert and forecast sections connect without an intermediate gap", () => {
  assert.match(component, /inmet-official-forecast-panel-refinement\.css/);
  assert.match(refinement, /\.inmet-official-panel\s*\{[\s\S]*margin-top:\s*0/);
  assert.match(
    refinement,
    /\.home-inmet-alerts \+ \.inmet-official-panel\s*\{[\s\S]*margin-top:\s*0/,
  );
  assert.match(refinement, /grid-template-columns:\s*minmax\(0, 1fr\)/);
});
