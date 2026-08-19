import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(
  "src/production/components/inmet-official-forecast-panel.tsx",
  "utf8",
);
const homeCss = readFileSync(
  "src/production/components/inmet-official-forecast-home.css",
  "utf8",
);

test("official INMET forecast keeps a clear institutional heading", () => {
  assert.match(component, /<h2 id="inmet-official-title">Previsão oficial do INMET<\/h2>/);
  assert.match(component, /Previsão municipal oficial para Pelotas/);
  assert.doesNotMatch(component, /inmet-official-reference/);
});

test("official INMET forecast is isolated from the historical homepage cascade", () => {
  assert.match(component, /import "\.\/inmet-official-forecast-home\.css"/);
  assert.match(component, /className="tp-home-inmet"/);
  assert.match(component, /tp-home-inmet__featured/);
  assert.match(component, /tp-home-inmet__next/);
  assert.doesNotMatch(component, /className="inmet-official-panel"/);
  assert.doesNotMatch(component, /inmet-official-forecast-panel-refinement\.css/);
});

test("official INMET forecast uses data-journalism hierarchy without cascade overrides", () => {
  assert.match(homeCss, /\.tp-home-inmet\s*\{[\s\S]*border-top:\s*1px solid/);
  assert.match(homeCss, /\.tp-home-inmet__layout\s*\{[\s\S]*grid-template-columns:/);
  assert.match(homeCss, /\.tp-home-inmet__featured\s*\{[\s\S]*border-right:/);
  assert.match(homeCss, /\.tp-home-inmet__next article\s*\{[\s\S]*border-bottom:/);
  assert.match(homeCss, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(homeCss, /!important/);
  assert.doesNotMatch(homeCss, /box-shadow:/);
  assert.doesNotMatch(homeCss, /border-radius:/);
});
