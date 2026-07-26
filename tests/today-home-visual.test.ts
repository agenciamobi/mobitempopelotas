import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const refinement = readFileSync(
  "src/components/weather/TodayForecastPageV4Refinement.css",
  "utf8",
);

test("today forecast reuses the homepage editorial shell", () => {
  assert.match(todayRoute, /SiteHeader/);
  assert.match(todayRoute, /WeatherHero/);
  assert.match(todayRoute, /SiteFooter/);
  assert.match(todayRoute, /site-shell--home-editorial/);
  assert.match(todayRoute, /home-editorial-main today-v4-home-main/);
  assert.match(todayRoute, /toProductionWeatherData/);
  assert.match(todayRoute, /toProductionAlerts/);
  assert.match(todayRoute, /hasVerifiedInmetAlertSemantics/);
});

test("today forecast owns its shell without duplicated global header and footer", () => {
  assert.match(siteLayout, /"\/tempo-hoje-pelotas"/);
  assert.match(siteLayout, /standaloneRoutes/);
});

test("today visual removes redundant first-fold content and preserves data provenance", () => {
  assert.match(refinement, /\.today-v4-home-shell \.weather-hero-primary\s*\{[\s\S]*display:\s*none/);
  assert.match(refinement, /\.today-v4-home-main \.today-v4-hero-copy/);
  assert.match(refinement, /\.today-v4-home-main \.today-v4-now-reading/);
  assert.match(refinement, /\.today-v4-home-main \.today-v4-now-source/);
  assert.match(refinement, /content-visibility:\s*auto/);
  assert.match(refinement, /@media \(max-width: 680px\)/);
  assert.match(refinement, /@media \(max-width: 520px\)/);
  assert.match(refinement, /@media \(prefers-reduced-motion: reduce\)/);
});
