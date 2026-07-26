import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const weatherHero = readFileSync("src/production/components/weather-hero.tsx", "utf8");
const astronomyPortal = readFileSync(
  "src/production/components/hero-astronomy-portal.tsx",
  "utf8",
);
const inmetPanel = readFileSync(
  "src/production/components/inmet-official-forecast-panel.tsx",
  "utf8",
);
const refinement = readFileSync(
  "src/production/styles/home-information-reorganization-v61.css",
  "utf8",
);
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");

test("duplicate daily summary is removed from the homepage hero", () => {
  assert.match(weatherHero, /weather-hero-daily-facts/);
  assert.match(refinement, /\.weather-hero-daily-facts\s*\{[\s\S]*display:\s*none/);
  assert.match(refinement, /\.weather-hero-copy \.weather-hero-actions/);
});

test("astronomy is rendered inside the hourly forecast heading instead of the current card", () => {
  assert.match(astronomyPortal, /\.home-story--forecast > \.home-story-heading/);
  assert.doesNotMatch(astronomyPortal, /document\.querySelector<HTMLElement>\("\.weather-hero-now"\)/);
  assert.match(astronomyPortal, /home-forecast-astronomy/);
  assert.match(astronomyPortal, /home-forecast-astronomy-grid/);
  assert.match(astronomyPortal, /Nascer do sol/);
  assert.match(astronomyPortal, /Pôr do sol/);
  assert.match(astronomyPortal, /Lua/);
  assert.match(astronomyPortal, /Estação/);
});

test("hourly forecast heading reserves a second right-side row for astronomy", () => {
  assert.match(refinement, /grid-template-rows:\s*auto auto/);
  assert.match(refinement, /\.home-today-facts\s*\{[\s\S]*grid-column:\s*2[\s\S]*grid-row:\s*1/);
  assert.match(refinement, /\.home-forecast-astronomy\s*\{[\s\S]*grid-column:\s*2[\s\S]*grid-row:\s*2/);
  assert.match(refinement, /\.home-forecast-astronomy-grid[\s\S]*repeat\(4/);
  assert.match(refinement, /@media \(max-width:\s*700px\)/);
});

test("INMET wind description is complemented by hourly model speed", () => {
  assert.match(productionHome, /function strongestHourlyWindSpeed/);
  assert.match(productionHome, /forecastWindSpeedKmh=\{forecastWindSpeedKmh\}/);
  assert.match(inmetPanel, /forecastWindSpeedKmh/);
  assert.match(inmetPanel, /km\/h previstos pelo modelo horário/);
  assert.match(inmetPanel, /className="is-wind"/);
  assert.match(refinement, /\.inmet-official-metrics \.is-wind dd/);
});

test("homepage information refinement is the last production style layer", () => {
  const tsPwa = styleImports.indexOf("pwa-app-refinement-v60.css");
  const tsInformation = styleImports.indexOf("home-information-reorganization-v61.css");
  const cssPwa = globalStyles.indexOf("pwa-app-refinement-v60.css");
  const cssInformation = globalStyles.indexOf("home-information-reorganization-v61.css");

  assert.ok(tsPwa >= 0 && tsInformation > tsPwa);
  assert.ok(cssPwa >= 0 && cssInformation > cssPwa);
});
