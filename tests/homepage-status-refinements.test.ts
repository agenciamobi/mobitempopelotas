import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("src/production/ProductionHome.tsx", "utf8");
const water = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const refinements = readFileSync(
  "src/production/styles/home-editorial-status-refinements.css",
  "utf8",
);

test("the INMET home alert and page index share one bounded surface", () => {
  assert.match(home, /className="tp-home-alert-index-shell"/);
  assert.match(
    home,
    /tp-home-alert-index-shell[\s\S]*<InmetAlertsPanel[\s\S]*<HomeSectionNavigation/,
  );
  assert.match(refinements, /\.tp-home-alert-index-shell\s*\{[\s\S]*border-radius:\s*16px/);
  assert.match(refinements, /\.tp-home-alert-index-shell\s*\{[\s\S]*background:\s*#fff/);
});

test("the radar chapter uses the same soft bounded editorial surface", () => {
  assert.match(refinements, /\.tp-home-radar\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(refinements, /\.tp-home-radar\s*\{[\s\S]*border-radius:\s*16px/);
  assert.match(refinements, /\.tp-home-radar\s*\{[\s\S]*background:\s*#fff/);
});

test("the Laranjal level and regional rows expose trend semantics visually and textually", () => {
  assert.match(water, /tp-home-water__level is-\$\{laranjalTrend\.direction\}/);
  assert.match(water, /tp-home-water__trend-mark is-\$\{trend\.direction\}/);
  assert.match(water, /tp-home-water__trend-mark is-\$\{guaibaTrend\.direction\}/);
  assert.match(refinements, /\.tp-home-water__level\.is-rising\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level\.is-falling\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level\.is-stable\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level strong,[\s\S]*color:\s*#fff/);
});

test("the Laranjal last-reading metric communicates freshness without the old availability counter", () => {
  assert.match(water, /Leitura atualizada/);
  assert.match(water, /Leitura atrasada/);
  assert.match(water, /tp-home-water__reading is-\$\{laranjalReading\.state\}/);
  assert.doesNotMatch(water, /pontos exibidos/);
  assert.doesNotMatch(water, /de \{lagoon\.total\} disponíveis/);
  assert.match(refinements, /\.tp-home-water__reading\.is-live dt/);
  assert.match(refinements, /\.tp-home-water__reading\.is-stale dt/);
});
