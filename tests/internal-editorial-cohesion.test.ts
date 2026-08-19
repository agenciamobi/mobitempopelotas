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
const homeTrendCss = readFileSync(
  "src/production/components/home-forecast-trend.css",
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
const homeExplore = readFileSync("src/components/weather/HomeExplorePortal.tsx", "utf8");
const homeExploreCss = readFileSync("src/components/weather/HomeExplorePortal.css", "utf8");
const homeGuide = readFileSync("src/production/components/home-data-guide.tsx", "utf8");
const homeGuideCss = readFileSync("src/production/components/home-data-guide.css", "utf8");
const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");
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
  assert.match(productionHome, /<HomeForecastTrend/);
  assert.match(productionHome, /<HomeRadarEditorial/);
  assert.match(productionHome, /<HomeObservationEditorial/);
  assert.match(productionHome, /<HomeWaterEditorial/);
  assert.match(productionHome, /<HomeExplorePortal/);
  assert.match(productionHome, /<HomeDataGuide/);
});

test("homepage chapters use local namespaces without important overrides", () => {
  const componentLayers = [
    [homeForecastCss, /\.tp-home-forecast/],
    [homeTrendCss, /\.tp-home-trend/],
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

test("Lagoa homepage is civic-tech local-first data on an open editorial canvas", () => {
  assert.match(homeWaterCss, /Home — Lagoa dos Patos em linguagem Civic Tech local-first/);
  assert.match(homeWaterCss, /\.tp-home-water__layout\s*\{[\s\S]*border-top:/);
  assert.match(homeWaterCss, /\.tp-home-water__station/);
  assert.match(homeWaterCss, /\.tp-home-water__network-note/);
  assert.doesNotMatch(homeWaterCss, /box-shadow/);
});

test("homepage directory is editorial navigation instead of a promotional card grid", () => {
  assert.match(homeExplore, /Aprofunde o que importa para você/);
  assert.match(homeExplore, /className="tp-home-explore__group"/);
  assert.doesNotMatch(homeExplore, /group\.description/);
  assert.match(homeExploreCss, /diretório editorial autocontido/i);
  assert.match(homeExploreCss, /\.tp-home-explore__groups\s*\{[\s\S]*border-top:/);
  assert.doesNotMatch(homeExploreCss, /border-radius/);
  assert.doesNotMatch(homeExploreCss, /box-shadow/);
});

test("homepage guide explains observation, forecast, official warning and monitoring separately", () => {
  assert.match(homeGuide, /const dataTypes/);
  assert.match(homeGuide, /label: "Observação"/);
  assert.match(homeGuide, /label: "Previsão"/);
  assert.match(homeGuide, /label: "Aviso oficial"/);
  assert.match(homeGuide, /label: "Radar e satélite"/);
  assert.match(homeGuideCss, /guia de leitura e transparência editorial/i);
  assert.match(homeGuideCss, /\.tp-home-guide__types\s*\{[\s\S]*grid-template-columns:/);
  assert.match(homeGuideCss, /\.tp-home-guide__details\s*\{[\s\S]*border-top:/);
  assert.doesNotMatch(homeGuideCss, /counter-reset/);
  assert.doesNotMatch(homeGuideCss, /box-shadow/);
});

test("forecast and weekly trend keep data-journalism hierarchy in isolated chapters", () => {
  assert.match(homeForecastCss, /Home — próximas horas autocontidas/);
  assert.match(homeForecastCss, /\.tp-home-forecast\s*\{[\s\S]*background:\s*transparent/);
  assert.match(homeForecastCss, /\.tp-home-forecast__hours\s*\{[\s\S]*border-bottom:/);
  assert.match(homeTrendCss, /Home — tendência semanal autocontida/);
  assert.match(homeTrendCss, /\.tp-home-trend__list\s*\{[\s\S]*border-top:/);
  assert.doesNotMatch(homeForecastCss, /!important/);
  assert.doesNotMatch(homeTrendCss, /!important/);
});

test("homepage radar is a scientific monitor instead of a floating dashboard", () => {
  assert.match(homeRadarCss, /Civic Tech \/ Scientific/);
  assert.match(homeRadarCss, /\.tp-home-radar \.map-layer-switcher\s*\{[\s\S]*box-shadow:\s*none/);
  assert.match(homeRadarCss, /\.tp-home-radar \.radar-player\s*\{[\s\S]*background:\s*#f8faf9/);
  assert.match(homeRadarCss, /\.tp-home-radar__guide-items/);
  assert.doesNotMatch(homeRadarCss, /!important/);
});

test("homepage footer is a dedicated editorial close without promotional CTA chrome", () => {
  assert.match(footer, /if \(variant === "home"\)/);
  assert.match(footer, /const homeFooterGroups/);
  assert.match(footer, /className="tp-home-footer-top"/);
  assert.match(footer, /Tempo e água de Pelotas, com fonte visível/);
  assert.match(homeFooterCss, /Footer da Home — fonte autônoma de verdade/);
  assert.match(homeFooterCss, /\.tp-home-footer-shell\s*\{[\s\S]*background:\s*#f5f7f6/);
  assert.match(homeFooterCss, /\.tp-home-footer-transparency/);
  assert.doesNotMatch(homeFooterCss, /tp-home-footer-actions/);
  assert.doesNotMatch(homeFooterCss, /tp-home-footer-brand-line/);
  assert.doesNotMatch(homeFooterCss, /!important/);
  assert.match(homeFooterCss, /@media \(max-width: 720px\)/);
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
  assert.match(homeTrendCss, /@media \(max-width: 700px\)/);
  assert.match(homeRadarCss, /@media \(max-width: 760px\)/);
  assert.match(homeObservationCss, /@media \(max-width: 700px\)/);
  assert.match(homeWaterCss, /@media \(max-width: 720px\)/);
  assert.match(homeExploreCss, /@media \(max-width: 640px\)/);
  assert.match(homeGuideCss, /@media \(max-width: 640px\)/);
  assert.match(homeFooterCss, /@media \(max-width: 720px\)/);
});
