import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("src/production/ProductionHome.tsx", "utf8");
const water = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const refinements = readFileSync(
  "src/production/styles/home-editorial-status-refinements.css",
  "utf8",
);

test("the INMET home alert and page index share one bounded surface only while an alert is visible", () => {
  assert.match(home, /const hasHomeInmetAlert = inmetAlerts\.status === "live" && inmetAlerts\.alerts\.length > 0/);
  assert.match(home, /hasHomeInmetAlert \? \(/);
  assert.match(home, /className="tp-home-alert-index-shell"/);
  assert.match(
    home,
    /tp-home-alert-index-shell[\s\S]*<InmetAlertsPanel[\s\S]*<HomeSectionNavigation/,
  );
  assert.match(home, /\) : \(\s*<HomeSectionNavigation \/>/);
  assert.match(refinements, /\.tp-home-alert-index-shell\s*\{[\s\S]*border-radius:\s*16px/);
  assert.match(refinements, /\.tp-home-alert-index-shell\s*\{[\s\S]*background:\s*#fff/);
});

test("the radar chapter uses a soft bounded editorial surface without nested shadow", () => {
  assert.match(refinements, /\.tp-home-radar\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(refinements, /\.tp-home-radar\s*\{[\s\S]*border-radius:\s*16px/);
  assert.match(refinements, /\.tp-home-radar\s*\{[\s\S]*background:\s*#fff/);
  assert.match(refinements, /\.tp-home-radar__frame\s*\{[\s\S]*box-shadow:\s*none/);
});

test("the Laranjal level and regional rows expose trend semantics visually and textually", () => {
  assert.match(water, /tp-home-water__level-card is-\$\{laranjalTrend\.direction\}/);
  assert.match(water, /tp-home-water__trend-mark is-\$\{trend\.direction\}/);
  assert.match(water, /tp-home-water__trend-mark is-\$\{guaibaTrend\.direction\}/);
  assert.match(refinements, /\.tp-home-water__level-card\.is-rising\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level-card\.is-falling\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level-card\.is-stable\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level-card \.tp-home-water__trend[\s\S]*color:\s*#fff/);
});

test("the Laranjal freshness keeps the public label and colors the last-reading metric", () => {
  assert.match(water, /<b className=\{`is-\$\{laranjalReading\.state\}`\}>\{laranjalReading\.label\}<\/b>/);
  assert.match(water, /<dt>Última leitura<\/dt>/);
  assert.match(water, /Leitura atualizada/);
  assert.match(water, /Leitura atrasada/);
  assert.match(water, /tp-home-water__reading is-\$\{laranjalReading\.state\}/);
  assert.doesNotMatch(water, /pontos exibidos/);
  assert.doesNotMatch(water, /de \{lagoon\.total\} disponíveis/);
  assert.match(refinements, /\.tp-home-water__focus-topline b\.is-live,/);
  assert.match(refinements, /\.tp-home-water__reading\.is-live dt/);
  assert.match(refinements, /\.tp-home-water__reading\.is-stale dt/);
});
