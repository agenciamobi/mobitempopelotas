import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("src/components/weather/TodayRetailHeroRefinement.css", "utf8");

test("Today hero refinement cannot leak into shared weekly hero classes", () => {
  assert.match(css, /chunks CSS podem continuar montados após navegação SPA/);
  assert.doesNotMatch(css, /(^|\n)\s*\.today-retail-hero/m);
  assert.match(css, /\.internal-weather-shell--today \.today-retail-hero__inner/);
  assert.match(css, /\.internal-weather-shell--today \.today-retail-hero__current-metrics/);
});

test("Today hero keeps usable narrow-screen typography and touch targets", () => {
  assert.match(css, /\.today-retail-hero__badges > a\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.today-retail-hero__current-metrics > div:last-child\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.doesNotMatch(css, /font-size:\s*0\.(?:4\d|5[0-7])rem/);
});
