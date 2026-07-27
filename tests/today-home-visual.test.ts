import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const todayComponent = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const todayStyles = readFileSync("src/components/weather/TodayForecastPageV5.css", "utf8");
const internalWidgets = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const internalWidgetStyles = readFileSync(
  "src/components/weather/InternalWeatherWidgets.css",
  "utf8",
);
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");

test("today forecast reuses the complete homepage shell and official alert widget", () => {
  assert.match(todayRoute, /SiteHeader/);
  assert.match(todayRoute, /WeatherHero/);
  assert.match(todayRoute, /InmetAlertsPanel/);
  assert.match(todayRoute, /variant="home"/);
  assert.match(todayRoute, /SiteFooter/);
  assert.match(todayRoute, /site-shell--home-editorial/);
  assert.match(todayRoute, /home-editorial-main today-v5-home-main/);
  assert.match(todayRoute, /TodayForecastPageV5/);
  assert.match(todayRoute, /toProductionWeatherData/);
  assert.match(todayRoute, /toProductionAlerts/);
  assert.match(todayRoute, /hasVerifiedInmetAlertSemantics/);
});

test("today forecast owns its shell without duplicated global header and footer", () => {
  assert.match(siteLayout, /"\/tempo-hoje-pelotas"/);
  assert.match(siteLayout, /standaloneRoutes/);
});

test("the internal page no longer renders a second hero", () => {
  assert.doesNotMatch(todayComponent, /WeatherHero/);
  assert.doesNotMatch(todayComponent, /today-v4-hero/);
  assert.doesNotMatch(todayComponent, /<h1/);
  assert.match(todayComponent, /InternalForecastStory/);
  assert.match(todayComponent, /InternalObservationWidget/);
  assert.match(todayComponent, /InternalPracticalSummary/);
});

test("forecast and observation widgets are derived from homepage components", () => {
  assert.match(internalWidgets, /HomeForecastStory/);
  assert.match(internalWidgets, /daily:\s*data\.weather\.daily\.slice\(0, 1\)/);
  assert.match(internalWidgets, /home-observation-story internal-observation-widget/);
  assert.match(internalWidgets, /home-observation-story__reading/);
  assert.match(internalWidgets, /home-observation-temperature/);
  assert.match(internalWidgets, /Abrir estação Embrapa/);
});

test("today content is concise and keeps measurement provenance explicit", () => {
  assert.match(internalWidgets, /currentProvenance\.humidity/);
  assert.match(internalWidgets, /currentProvenance\.windSpeed/);
  assert.match(internalWidgets, /currentProvenance\.pressure/);
  assert.match(internalWidgets, /currentProvenance\.sunset/);
  assert.match(internalWidgets, /highlights\.slice\(0, 3\)/);
  assert.match(internalWidgets, /cautions\.slice\(0, 3\)/);
  assert.match(internalWidgets, /Observação local operacional/);
  assert.match(internalWidgets, /Condição atual complementada por modelo/);
});

test("today sections use one homepage width rail without a nested inset", () => {
  assert.match(todayStyles, /width:\s*min\(var\(--editorial-max\), calc\(100% - 56px\)\)/);
  assert.match(todayStyles, /padding:\s*clamp\(24px, 3vw, 44px\) 0 0/);
  assert.match(todayStyles, /> \.today-v5-page/);
  assert.match(todayStyles, /> \.editorial-answer-section/);
  assert.match(todayStyles, /width:\s*100%/);
  assert.match(todayStyles, /max-width:\s*none/);
  assert.match(todayStyles, /justify-self:\s*stretch/);
  assert.match(todayStyles, /width:\s*min\(780px, calc\(100% - 40px\)\)/);
});

test("reusable widgets preserve the homepage card language on desktop and mobile", () => {
  assert.match(internalWidgetStyles, /Reusable internal weather widgets derived from the homepage editorial system/);
  assert.match(internalWidgetStyles, /\.internal-forecast-widget \.home-forecast-story/);
  assert.match(internalWidgetStyles, /\.internal-page-chapters/);
  assert.match(internalWidgetStyles, /\.internal-practical-widget__cards/);
  assert.match(internalWidgetStyles, /content-visibility:\s*auto/);
  assert.match(internalWidgetStyles, /@media \(max-width: 980px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 760px\)/);
  assert.match(internalWidgetStyles, /@media \(max-width: 520px\)/);
  assert.match(internalWidgetStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(internalWidgetStyles, /@media \(forced-colors: active\)/);
});
