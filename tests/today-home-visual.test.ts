import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const refinement = readFileSync(
  "src/components/weather/TodayForecastPageV4Refinement.css",
  "utf8",
);
const widthRefinement = readFileSync(
  "src/components/weather/TodayForecastPageV4WidthRefinement.css",
  "utf8",
);

test("today forecast reuses the homepage editorial shell", () => {
  assert.match(todayRoute, /SiteHeader/);
  assert.match(todayRoute, /WeatherHero/);
  assert.match(todayRoute, /SiteFooter/);
  assert.match(todayRoute, /site-shell--home-editorial/);
  assert.match(todayRoute, /home-editorial-main today-v4-home-main/);
  assert.match(todayRoute, /TodayForecastPageV4WidthRefinement\.css/);
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
});

test("today sections use one homepage width rail without a second horizontal inset", () => {
  assert.match(widthRefinement, /width:\s*min\(var\(--editorial-max\), calc\(100% - 56px\)\)/);
  assert.match(widthRefinement, /padding:\s*clamp\(24px, 3vw, 44px\) 0 0/);
  assert.match(widthRefinement, /> \.today-v4-page/);
  assert.match(widthRefinement, /> \.editorial-answer-section/);
  assert.match(widthRefinement, /width:\s*100%/);
  assert.match(widthRefinement, /max-width:\s*none/);
  assert.match(widthRefinement, /justify-self:\s*stretch/);
  assert.match(widthRefinement, /width:\s*min\(780px, calc\(100% - 40px\)\)/);
});

test("scrollable chapters and hourly data stay inside the shared section width", () => {
  assert.match(widthRefinement, /@media \(max-width: 820px\)/);
  assert.match(widthRefinement, /\.today-v4-chapters[\s\S]*margin-right:\s*0[\s\S]*padding-right:\s*0/);
  assert.match(widthRefinement, /@media \(max-width: 680px\)/);
  assert.match(widthRefinement, /\.today-v4-hourly-track[\s\S]*margin-right:\s*0[\s\S]*padding-right:\s*0/);
});

test("remaining today blocks follow the homepage editorial navigation and section rhythm", () => {
  assert.match(refinement, /Índice de capítulos no mesmo padrão editorial da home/);
  assert.match(refinement, /\.today-v4-home-main \.today-v4-chapters\s*\{[\s\S]*border-top:\s*1px solid var\(--today-home-line\)/);
  assert.match(refinement, /\.today-v4-home-main \.today-v4-alert\s*\{[\s\S]*background:\s*transparent/);
  assert.match(refinement, /Seções contínuas: ritmo, tipografia e linhas da homepage/);
  assert.match(refinement, /font-size:\s*clamp\(2\.65rem, 5vw, 5\.35rem\)/);
  assert.match(refinement, /Linha horária inspirada diretamente na leitura compacta da homepage/);
  assert.match(refinement, /Conteúdo explicativo e FAQ deixam o card genérico/);
  assert.match(refinement, /@media \(max-width: 820px\)/);
  assert.match(refinement, /@media \(max-width: 680px\)/);
  assert.match(refinement, /@media \(max-width: 520px\)/);
  assert.match(refinement, /@media \(prefers-reduced-motion: reduce\)/);
});
