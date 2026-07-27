import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const widgets = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const containment = readFileSync(
  "src/components/weather/InternalWeatherWidgetsContainment.css",
  "utf8",
);

test("reusable weather widgets always load their containment layer", () => {
  assert.match(widgets, /InternalWeatherWidgets\.css/);
  assert.match(widgets, /InternalWeatherWidgetsContainment\.css/);
});

test("the reused homepage observation cannot escape the internal editorial rail", () => {
  assert.match(containment, /Keep homepage-derived widgets inside the internal editorial rail/);
  assert.match(
    containment,
    /\.site-shell--home-editorial \.home-editorial-main \.internal-observation-widget\s*\{[\s\S]*width:\s*100% !important/,
  );
  assert.match(containment, /max-width:\s*none !important/);
  assert.match(containment, /margin:\s*0 !important/);
  assert.match(containment, /transform:\s*none !important/);
  assert.match(containment, /grid-template-columns:[\s\S]*!important/);
});

test("observation source labels remain secondary and do not inherit the main value style", () => {
  assert.match(
    widgets,
    /<dd>[\s\S]*<span>\{metric\.value\}<\/span>[\s\S]*<small>\{metric\.source\}<\/small>/,
  );
  assert.match(containment, /dd\s*>\s*small[\s\S]*font-size:\s*0\.49rem/);
  assert.match(containment, /internal-observation-updated::before[\s\S]*content:\s*none/);
  assert.match(containment, /internal-observation-updated[\s\S]*background:\s*transparent/);
});

test("contained observation remains responsive without negative or full-bleed offsets", () => {
  assert.match(containment, /@media \(max-width: 980px\)/);
  assert.match(containment, /grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(containment, /@media \(max-width: 700px\)/);
  assert.match(containment, /@media \(max-width: 520px\)/);
  assert.doesNotMatch(containment, /translateX\(-50%\)/);
  assert.doesNotMatch(containment, /margin-left:\s*50%/);
  assert.doesNotMatch(containment, /100vw/);
});
