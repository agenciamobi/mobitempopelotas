import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayPage = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const typography = readFileSync(
  "src/components/weather/TodayTypographyRefinement.css",
  "utf8",
);

test("tempo hoje loads an isolated readable typography layer", () => {
  assert.match(todayPage, /TodayTypographyRefinement\.css/);
  assert.match(typography, /\.internal-weather-shell--today/);
  assert.doesNotMatch(typography, /\.internal-weather-shell--tomorrow/);
  assert.match(typography, /--today-type-micro:\s*clamp\(0\.75rem/);
  assert.match(typography, /--today-type-caption:\s*clamp\(0\.8rem/);
  assert.match(typography, /--today-type-body:\s*clamp\(0\.88rem/);
});

test("chapter and hourly forecast microcopy use the readable scale", () => {
  assert.match(
    typography,
    /\.internal-page-chapters strong[\s\S]*font-size:\s*0\.84rem/,
  );
  assert.match(
    typography,
    /\.internal-page-chapters small[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /\.home-forecast-facts dt[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /\.home-hourly-topline > span[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /\.home-hourly-rain span,[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /\.home-hourly-wind[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(typography, /home-hourly-cards article[\s\S]*min-height:\s*210px/);
});

test("hero resources observation and practical reading no longer rely on tiny labels", () => {
  assert.match(
    typography,
    /today-retail-hero__current-metrics small,[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /today-retail-hero__tiles article > span,[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /today-resources__periods dt[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /internal-observation-status,[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /internal-practical-widget__intro small[\s\S]*font-size:\s*var\(--today-type-micro\)/,
  );
  assert.match(
    typography,
    /editorial-answer-faq-list summary,[\s\S]*font-size:\s*var\(--today-type-body\)/,
  );
});

test("mobile keeps readable labels and gives hourly cards enough width", () => {
  assert.match(typography, /@media \(max-width: 760px\)/);
  assert.match(typography, /--today-type-micro:\s*0\.78rem/);
  assert.match(typography, /repeat\(7, minmax\(10rem, 1fr\)\)/);
  assert.match(typography, /@media \(max-width: 520px\)/);
  assert.match(typography, /min-width:\s*10\.2rem/);
});
