import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const internalCss = readFileSync(
  "src/production/styles/internal-home-cohesion-v48.css",
  "utf8",
);
const internalFixCss = readFileSync(
  "src/production/styles/internal-home-cohesion-v48-fix.css",
  "utf8",
);
const headerMegaCss = readFileSync(
  "src/production/styles/header-megamenu-editorial-v52.css",
  "utf8",
);
const homeShellCss = readFileSync("src/production/styles/home-editorial-shell.css", "utf8");
const homeForecastCss = readFileSync(
  "src/production/components/home-forecast-editorial.css",
  "utf8",
);
const homeRadarCss = readFileSync(
  "src/production/components/home-radar-editorial.css",
  "utf8",
);
const homeObservationCss = readFileSync(
  "src/production/components/home-observation-editorial.css",
  "utf8",
);
const homeWaterCss = readFileSync(
  "src/production/components/home-water-editorial.css",
  "utf8",
);
const homeExploreCss = readFileSync("src/components/weather/HomeExplorePortal.css", "utf8");
const homeGuideCss = readFileSync("src/production/components/home-data-guide.css", "utf8");
const homeFooterCss = readFileSync(
  "src/production/components/site-footer-home.css",
  "utf8",
);
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");

test("homepage has left the old global override architecture", () => {
  const removedLayers = [
    "home-editorial-current.css",
    "home-editorial-ux.css",
    "home-editorial-forecast.css",
    "home-editorial-layout.css",
    "home-radar-editorial-v45.css",
    "home-weekly-radar-usability-v47.css",
    "home-water-editorial-v49.css",
    "home-water-semantic-v53.css",
    "home-closing-editorial-v50.css",
    "home-explore-refinement-v19.css",
  ];

  for (const entry of [cssEntry, tsEntry]) {
    assert.match(entry, /home-editorial-shell\.css/);
    for (const layer of removedLayers) {
      assert.doesNotMatch(entry, new RegExp(layer.replaceAll(".", "\\.")));
    }
  }
});

test("internal pages keep their established frame and delayed rendering", () => {
  assert.match(internalCss, /--portal-frame-max:\s*1760px/);
  assert.match(internalCss, /\.site-shell--topic \.site-container--topic\s*\{[\s\S]*width:\s*100%/);
  assert.match(internalCss, /content-visibility:\s*auto/);
  assert.match(internalCss, /contain-intrinsic-size:\s*auto 620px/);
});

test("internal footer preserves compact operational links", () => {
  assert.match(internalFixCss, /\.editorial-footer__operational\s*\{[\s\S]*display:\s*grid/);
  assert.match(internalFixCss, /grid-template-columns:\s*repeat\(2/);
});

test("homepage narrative is composed from isolated public chapters", () => {
  assert.doesNotMatch(productionHome, /HomeEditorialDashboard/);
  assert.match(productionHome, /<HomeForecastEditorial/);
  assert.match(productionHome, /<HomeRadarEditorial/);
  assert.match(productionHome, /<HomeObservationEditorial/);
  assert.match(productionHome, /<HomeWaterEditorial/);
  assert.match(productionHome, /<HomeExplorePortal/);
  assert.match(productionHome, /<HomeDataGuide/);
});

test("homepage chapters use local namespaces without important overrides", () => {
  const componentLayers = [
    [homeForecastCss, /\.tp-home-forecast/],
    [homeRadarCss, /\.tp-home-radar/],
    [homeObservationCss, /\.tp-home-observation/],
    [homeWaterCss, /\.tp-home-water/],
    [homeExploreCss, /\.tp-home-explore/],
    [homeGuideCss, /\.tp-home-guide/],
  ] as const;

  for (const [css, namespace] of componentLayers) {
    assert.match(css, namespace);
    assert.doesNotMatch(css, /!important/);
  }
});

test("Lagoa homepage is civic-tech data on an open editorial canvas", () => {
  assert.match(homeWaterCss, /Home — Lagoa dos Patos em linguagem Civic Tech local/);
  assert.match(homeWaterCss, /\.tp-home-water__layout\s*\{[\s\S]*border-top:/);
  assert.match(homeWaterCss, /\.tp-home-water__rows article/);
  assert.doesNotMatch(homeWaterCss, /box-shadow/);
});

test("homepage directory is editorial navigation instead of a promotional card grid", () => {
  assert.match(homeExploreCss, /diretório editorial autocontido/i);
  assert.match(homeExploreCss, /\.tp-home-explore__groups\s*\{[\s\S]*border-top:/);
  assert.doesNotMatch(homeExploreCss, /border-radius/);
  assert.doesNotMatch(homeExploreCss, /box-shadow/);
});

test("homepage guide closes as an open transparency chapter", () => {
  assert.match(homeGuideCss, /guia de leitura e transparência editorial/i);
  assert.match(homeGuideCss, /\.tp-home-guide\s*\{[\s\S]*border-top:/);
  assert.match(homeGuideCss, /\.tp-home-guide__details\s*\{[\s\S]*border-top:/);
  assert.doesNotMatch(homeGuideCss, /box-shadow/);
});

test("forecast keeps data-journalism hierarchy in its isolated component", () => {
  assert.match(homeForecastCss, /Home — previsão editorial autocontida/);
  assert.match(homeForecastCss, /\.tp-home-forecast\s*\{[\s\S]*background:\s*transparent/);
  assert.match(homeForecastCss, /\.tp-home-forecast__hours\s*\{[\s\S]*border-bottom:/);
  assert.match(homeForecastCss, /\.tp-home-forecast-week__list\s*\{[\s\S]*border-top:/);
  assert.doesNotMatch(homeForecastCss, /!important/);
});

test("homepage footer remains compact, transparent about sources and responsive", () => {
  assert.match(homeFooterCss, /Footer da Home — fechamento editorial e funcional/);
  assert.match(homeFooterCss, /\.editorial-footer-transparency/);
  assert.match(homeFooterCss, /box-shadow:\s*none/);
  assert.match(homeFooterCss, /@media \(max-width: 880px\)/);
  assert.match(homeFooterCss, /@media \(max-width: 720px\)/);
  assert.match(homeFooterCss, /@media \(max-width: 460px\)/);
});

test("desktop megamenu is opaque, compact and visibly interactive", () => {
  assert.match(headerMegaCss, /@media \(min-width: 901px\)/);
  assert.match(headerMegaCss, /\.mega-navigation-surface\s*\{[\s\S]*background:\s*#fff !important/);
  assert.match(headerMegaCss, /backdrop-filter:\s*none !important/);
  assert.match(headerMegaCss, /min-height:\s*210px !important/);
  assert.match(headerMegaCss, /\.mega-navigation-columns a::after/);
  assert.match(headerMegaCss, /content:\s*"→"/);
  assert.match(headerMegaCss, /a\[aria-current="page"\]/);
});

test("stable homepage composition covers tablet, mobile, focus and reduced motion", () => {
  assert.match(homeShellCss, /:focus-visible/);
  assert.match(homeShellCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(homeForecastCss, /@media \(max-width: 700px\)/);
  assert.match(homeRadarCss, /@media \(max-width: 700px\)/);
  assert.match(homeObservationCss, /@media \(max-width: 700px\)/);
  assert.match(homeWaterCss, /@media \(max-width: 720px\)/);
  assert.match(homeExploreCss, /@media \(max-width: 640px\)/);
  assert.match(homeGuideCss, /@media \(max-width: 640px\)/);
});
