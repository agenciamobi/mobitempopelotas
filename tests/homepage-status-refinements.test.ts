import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("src/production/ProductionHome.tsx", "utf8");
const water = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const refinements = readFileSync(
  "src/production/styles/home-editorial-status-refinements.css",
  "utf8",
);
const emergencyCss = readFileSync("src/components/layout/EmergencyFooterStrip.css", "utf8");

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

test("the Laranjal level keeps the trend inside the solid semantic surface with a large arrow", () => {
  assert.match(water, /tp-home-water__level-card is-\$\{laranjalTrend\.direction\}/);
  assert.match(water, /<b aria-hidden="true">\{laranjalTrend\.symbol\}<\/b>/);
  assert.match(refinements, /\.tp-home-water__level-card\.is-rising\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level-card\.is-falling\s*\{[\s\S]*background:/);
  assert.match(refinements, /\.tp-home-water__level-card\.is-stable\s*\{[\s\S]*background:/);
  assert.match(
    refinements,
    /\.tp-home-water__level-card \.tp-home-water__trend b\s*\{[\s\S]*font-size:\s*2\.45rem/,
  );
});

test("the Laranjal freshness is communicated only in the last-reading metric", () => {
  assert.doesNotMatch(water, /\{laranjalReading\.label\}/);
  assert.match(water, /<dt>Última leitura<\/dt>/);
  assert.match(water, /aria-label=\{`Última leitura \$\{laranjalReading\.accessibleLabel\}`\}/);
  assert.match(water, /tp-home-water__reading is-\$\{laranjalReading\.state\}/);
  assert.match(refinements, /\.tp-home-water__reading\.is-live dt/);
  assert.match(refinements, /\.tp-home-water__reading\.is-stale dt/);
});

test("the regional water list is no longer limited to three points and starts with Porto Alegre gauges", () => {
  assert.match(water, /"sao-lourenco-do-sul"[\s\S]*"furg-ccmar"[\s\S]*"arambare"[\s\S]*"sao-jose-do-norte"[\s\S]*"itapua"/);
  assert.doesNotMatch(water, /\.slice\(0, 3\)/);
  assert.match(water, /const guaibaRows = guaibaReferences\(guaiba\)/);
  assert.match(water, /guaibaRows\.map/);
  assert.match(water, /Nível do Guaíba — Porto Alegre \/ RS/);
  assert.match(water, /Cais Mauá \/ RS/);
  assert.match(water, /Pontos para acompanhar a Lagoa dos Patos/);
  assert.doesNotMatch(water, /Três referências para entender a Lagoa/);
  assert.doesNotMatch(water, /Contexto ao norte/);
});

test("each regional row carries the low-opacity color of its own trend", () => {
  assert.match(water, /is-trend-\$\{trend\.direction\}/);
  assert.match(refinements, /article\.is-trend-rising\s*\{[\s\S]*background:\s*rgb\(155 82 96 \/ 10%\)/);
  assert.match(refinements, /article\.is-trend-falling\s*\{[\s\S]*background:\s*rgb\(35 114 134 \/ 10%\)/);
  assert.match(refinements, /article\.is-trend-stable\s*\{[\s\S]*background:\s*rgb\(102 123 134 \/ 9%\)/);
  assert.match(refinements, /\.tp-home-water__trend-mark\s*\{[\s\S]*font-size:\s*2\.45rem/);
});

test("the useful phone heading is black while the Tempo Pelotas purple remains as its accent", () => {
  assert.match(
    emergencyCss,
    /\.tp-public-service-phones h2\s*\{[\s\S]*color:\s*var\(--tp-public-service-ink\)/,
  );
  assert.match(
    emergencyCss,
    /\.tp-public-service-phones h2::after\s*\{[\s\S]*background:\s*var\(--tp-public-service-phone\)/,
  );
});
