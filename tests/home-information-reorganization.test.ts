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
const proportionalHero = readFileSync(
  "src/production/styles/home-hero-proportional-v62.css",
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

test("homepage hero follows the camera proportion and uses a compact weather card", () => {
  assert.match(proportionalHero, /min-height:\s*clamp\(430px,\s*25vw,\s*640px\)/);
  assert.match(proportionalHero, /grid-template-columns:\s*minmax\(0,\s*1\.12fr\)\s*minmax\(350px,\s*0\.88fr\)/);
  assert.match(proportionalHero, /\.weather-hero-now\s*\{[\s\S]*width:\s*min\(100%,\s*370px\)/);
  assert.match(proportionalHero, /--home-live-camera-crop:\s*1\.28/);
  assert.match(proportionalHero, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(proportionalHero, /@media \(max-width:\s*900px\)/);
  assert.match(proportionalHero, /@media \(max-width:\s*620px\)/);
});

test("proportional hero refinement is the last production style layer", () => {
  const tsInformation = styleImports.indexOf("home-information-reorganization-v61.css");
  const tsProportional = styleImports.indexOf("home-hero-proportional-v62.css");
  const cssInformation = globalStyles.indexOf("home-information-reorganization-v61.css");
  const cssProportional = globalStyles.indexOf("home-hero-proportional-v62.css");

  assert.ok(tsInformation >= 0 && tsProportional > tsInformation);
  assert.ok(cssInformation >= 0 && cssProportional > cssInformation);
});
