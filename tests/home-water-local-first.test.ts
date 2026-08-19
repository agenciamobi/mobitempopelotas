import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const water = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const waterCss = readFileSync("src/production/components/home-water-editorial.css", "utf8");

test("homepage water chapter treats Laranjal as the local reference", () => {
  assert.match(water, /Nível da Lagoa no Laranjal e referências regionais/);
  assert.match(water, /Praia do Laranjal/);
  assert.match(water, /Fonte local/);
  assert.match(water, /laranjal\.source\.name/);
  assert.match(water, /Mudança em 6 h/);
  assert.match(water, /Mudança em 24 h/);
  assert.match(water, /formatSignedCentimeters/);
});

test("regional network is contextual instead of a raw comparison table", () => {
  assert.match(water, /Três referências para entender a Lagoa/);
  assert.match(water, /Cada estação usa sua própria referência local de medição/);
  assert.match(water, /station\.station\.role/);
  assert.match(water, /is-risk-\$\{station\.risk\}/);
  assert.match(water, /Contexto ao norte/);
  assert.match(water, /lagoon\.source\.organizations/);
});

test("water chapter stays open, responsive and free of dashboard chrome", () => {
  assert.match(waterCss, /Civic Tech local-first/);
  assert.match(waterCss, /Laranjal domina a leitura/);
  assert.match(waterCss, /\.tp-home-water__level strong\s*\{[\s\S]*8rem/);
  assert.match(waterCss, /\.tp-home-water__rows article/);
  assert.match(waterCss, /\.tp-home-water__station\.is-risk-attention::before/);
  assert.match(waterCss, /@media \(max-width: 720px\)/);
  assert.match(waterCss, /@media \(max-width: 460px\)/);
  assert.doesNotMatch(waterCss, /box-shadow/);
  assert.doesNotMatch(waterCss, /!important/);
});
