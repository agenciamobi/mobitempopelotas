import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const shellCss = readFileSync("src/production/styles/home-editorial-shell.css", "utf8");
const heroCss = readFileSync("src/production/components/weather-hero-direction.css", "utf8");
const alertPageCss = readFileSync("src/production/components/inmet-alerts-page.css", "utf8");
const brandCss = readFileSync("src/production/styles/brand-palette-theme.css", "utf8");
const mobileUsabilityCss = readFileSync(
  "src/production/styles/mobile-usability-refinement.css",
  "utf8",
);
const topicReadableCss = readFileSync("src/production/styles/topic-readable.css", "utf8");
const waterSemanticCss = readFileSync(
  "src/production/styles/water-level-semantic-colors.css",
  "utf8",
);
const forecastCss = readFileSync(
  "src/production/components/home-forecast-editorial.css",
  "utf8",
);
const radarCss = readFileSync(
  "src/production/components/home-radar-editorial.css",
  "utf8",
);
const observationCss = readFileSync(
  "src/production/components/home-observation-editorial.css",
  "utf8",
);
const waterCss = readFileSync(
  "src/production/components/home-water-editorial.css",
  "utf8",
);
const exploreCss = readFileSync("src/components/weather/HomeExplorePortal.css", "utf8");
const guideCss = readFileSync("src/production/components/home-data-guide.css", "utf8");

test("the homepage uses one minimal late shell instead of global visual override layers", () => {
  const removedLegacyLayers = [
    "theme-refinement.css",
    "theme-polish.css",
    "project-refinement.css",
    "editorial-readable-final.css",
    "editorial-readable-v2.css",
    "home.css",
    "home-lagoon-card.css",
    "home-location-and-level.css",
    "home-flow-footer-refinement.css",
    "home-cppmet-layout-water-audit.css",
    "home-cppmet-final-fixes.css",
    "home-hero-curve-fixes.css",
    "home-hero-alert-states.css",
    "home-hero-composition.css",
    "home-first-fold-refinement.css",
    "home-first-fold-editorial-light.css",
    "home-first-fold-editorial-light-refinement.css",
    "home-first-fold-editorial-light-v2.css",
    "home-first-fold-editorial-light-v2-responsive.css",
    "home-first-fold-operational-v3.css",
    "home-hero-stripe-adaptation.css",
    "home-alert-flow-v7.css",
    "home-alert-flow-v9.css",
    "home-detail-navigation-v10.css",
    "home-detail-content-v10.css",
    "home-cohesion-v12.css",
    "home-cohesion-v12-content.css",
    "home-navigation-v13.css",
    "home-final-cohesion-v20.css",
    "home-operational-bridge-v21.css",
    "home-operational-bridge-v21-fix.css",
    "home-tomorrow-focus-v25.css",
    "home-hero-condition-v29.css",
    "home-hero-editorial-v34.css",
    "home-hero-now-label-v35.css",
    "home-supporting-editorial-v37.css",
    "home-hero-edge-to-edge-v43.css",
    "home-hero-live-camera-v54.css",
    "home-information-reorganization-v61.css",
    "home-hero-proportional-v62.css",
    "home-live-camera-native-scale-v63.css",
    "home-live-camera-exact-geometry-v64.css",
    "home-advisory-color-scope-v65.css",
    "home-hero-alignment-v66.css",
    "home-first-fold-magazine-v69.css",
    "home-first-fold-editorial-v70.css",
    "home-first-fold-editorial-v71.css",
    "home-page-reorganization.css",
    "home-editorial-theme.css",
    "home-editorial-refinement-v2.css",
    "home-editorial-responsive-fix.css",
    "home-editorial-alignment-readable.css",
    "home-editorial-clarity-v3.css",
    "home-visitor-copy-v4.css",
    "home-journey-refinement-v5.css",
    "home-grid-alignment-v6.css",
    "home-cleanup-v39.css",
    "home-editorial-current.css",
    "home-editorial-ux.css",
    "home-editorial-forecast.css",
    "home-editorial-layout.css",
    "home-radar-editorial-v45.css",
    "home-weekly-radar-usability-v47.css",
    "home-water-editorial-v49.css",
    "home-closing-editorial-v50.css",
    "home-explore-refinement-v19.css",
  ];

  for (const entry of [cssEntry, tsEntry]) {
    assert.match(entry, /home-editorial-shell\.css/);
    assert.match(entry, /topic-readable\.css/);
    for (const layer of removedLegacyLayers) {
      assert.doesNotMatch(entry, new RegExp(layer.replaceAll(".", "\\.")));
    }
  }
});

test("the late homepage shell contains only transversal behavior", () => {
  assert.match(shellCss, /Home — shell editorial mínimo/);
  assert.match(shellCss, /\.site-shell--home-editorial\s*\{/);
  assert.match(shellCss, /\.home-editorial-main/);
  assert.match(shellCss, /scroll-margin-top:\s*92px/);
  assert.match(shellCss, /:focus-visible/);
  assert.match(shellCss, /prefers-reduced-motion/);
  assert.doesNotMatch(shellCss, /\.tp-home-(forecast|radar|observation|water|explore|guide|inmet|hero|alert)/);
  assert.doesNotMatch(shellCss, /!important/);
  assert.doesNotMatch(shellCss, /box-shadow/);
});

test("the shared brand palette no longer styles obsolete homepage structures", () => {
  assert.match(brandCss, /--brand-cyan:\s*#18bdcd/);
  assert.match(brandCss, /\.site-shell--topic\[data-topic=/);
  assert.doesNotMatch(brandCss, /\.weather-hero/);
  assert.doesNotMatch(brandCss, /\.site-header--hero/);
  assert.doesNotMatch(brandCss, /\.dashboard-layout--after-hero/);
  assert.doesNotMatch(brandCss, /\.hydrology-home/);
});

test("shared mobile usability does not restyle the isolated homepage", () => {
  assert.match(mobileUsabilityCss, /Usabilidade mobile compartilhada/);
  assert.match(mobileUsabilityCss, /\.mobile-tab-bar/);
  assert.match(mobileUsabilityCss, /\.pwa-launcher/);
  assert.doesNotMatch(mobileUsabilityCss, /\.site-shell--home\s+\.weather-hero/);
  assert.doesNotMatch(mobileUsabilityCss, /\.site-shell--home\s*>\s*\.site-header--hero/);
  assert.doesNotMatch(mobileUsabilityCss, /\.embrapa-observation-home/);
});

test("internal reading scale is isolated from the homepage", () => {
  assert.match(topicReadableCss, /Páginas internas — escala de leitura compartilhada/);
  assert.match(topicReadableCss, /\.site-shell--topic/);
  assert.doesNotMatch(topicReadableCss, /\.site-shell--home/);
  assert.doesNotMatch(topicReadableCss, /\.tp-home-/);
  assert.doesNotMatch(topicReadableCss, /!important/);
});

test("the homepage hero is fully owned by its local namespace", () => {
  assert.match(heroCss, /Hero da Home — fonte autônoma de verdade/);
  assert.match(heroCss, /\.tp-home-hero-shell\s*\{/);
  assert.match(heroCss, /\.tp-home-hero\s*\{/);
  assert.match(heroCss, /\.tp-home-hero__live-camera/);
  assert.match(heroCss, /@media \(max-width: 720px\)/);
  assert.doesNotMatch(heroCss, /\.weather-hero/);
  assert.doesNotMatch(heroCss, /!important/);
});

test("the INMET alerts page owns refinements outside the homepage cascade", () => {
  assert.match(alertPageCss, /Página de avisos do INMET/);
  assert.match(alertPageCss, /\.inmet-alert-card\s*\{/);
  assert.match(alertPageCss, /\.inmet-alert-area/);
  assert.match(alertPageCss, /@media \(max-width: 560px\)/);
  assert.doesNotMatch(alertPageCss, /\.site-shell--home-editorial/);
  assert.doesNotMatch(alertPageCss, /!important/);
});

test("shared water states no longer depend on the legacy homepage widgets", () => {
  assert.match(waterSemanticCss, /\.guaiba-level-card\.level-state--stable::before/);
  assert.match(waterSemanticCss, /\.guaiba-level-card\.level-state--unavailable::before/);
  assert.match(waterSemanticCss, /\.lagoon-monitoring-card\.level-state--stable/);
  assert.match(waterSemanticCss, /\.lagoon-monitoring-card\.level-state--unavailable/);
  assert.doesNotMatch(waterSemanticCss, /\.home-water-/);
});

test("public homepage chapters are open and locally owned", () => {
  for (const css of [forecastCss, observationCss, waterCss, exploreCss, guideCss]) {
    assert.doesNotMatch(css, /!important/);
    assert.doesNotMatch(css, /box-shadow/);
  }

  assert.match(forecastCss, /\.tp-home-forecast\s*\{/);
  assert.match(observationCss, /\.tp-home-observation\s*\{/);
  assert.match(waterCss, /\.tp-home-water\s*\{/);
  assert.match(exploreCss, /\.tp-home-explore\s*\{/);
  assert.match(guideCss, /\.tp-home-guide\s*\{/);
});

test("the interactive radar keeps one scientific frame instead of a chapter card", () => {
  assert.match(radarCss, /\.tp-home-radar\s*\{[\s\S]*border-top:\s*1px solid/);
  assert.match(radarCss, /\.tp-home-radar__frame\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(radarCss, /border-radius:\s*8px/);
  assert.doesNotMatch(radarCss, /box-shadow/);
  assert.doesNotMatch(radarCss, /!important/);
});

test("isolated chapters include explicit mobile composition", () => {
  assert.match(forecastCss, /@media \(max-width: 700px\)/);
  assert.match(radarCss, /@media \(max-width: 700px\)/);
  assert.match(observationCss, /@media \(max-width: 700px\)/);
  assert.match(waterCss, /@media \(max-width: 720px\)/);
  assert.match(exploreCss, /@media \(max-width: 640px\)/);
  assert.match(guideCss, /@media \(max-width: 640px\)/);
});
