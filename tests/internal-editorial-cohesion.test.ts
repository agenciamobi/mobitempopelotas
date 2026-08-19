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
const homeCurrentCss = readFileSync("src/production/styles/home-editorial-current.css", "utf8");
const homeUxCss = readFileSync("src/production/styles/home-editorial-ux.css", "utf8");
const homeForecastCss = readFileSync(
  "src/production/components/home-forecast-editorial.css",
  "utf8",
);
const homeLayoutCss = readFileSync("src/production/styles/home-editorial-layout.css", "utf8");
const homeDirectionCss = readFileSync(
  "src/production/components/home-editorial-dashboard-direction.css",
  "utf8",
);
const homeFooterCss = readFileSync(
  "src/production/components/site-footer-home.css",
  "utf8",
);
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const semanticDashboard = readFileSync(
  "src/production/components/home-editorial-dashboard-semantic.tsx",
  "utf8",
);

test("stable homepage layers preserve the canonical final global cascade", () => {
  const stableHomeLayers = [
    "home-editorial-current.css",
    "home-editorial-ux.css",
    "home-editorial-layout.css",
  ];

  for (const entry of [cssEntry, tsEntry]) {
    for (const layer of stableHomeLayers) {
      assert.match(entry, new RegExp(layer.replace(".", "\\.")));
    }

    assert.doesNotMatch(entry, /home-editorial-forecast\.css/);

    for (let index = 1; index < stableHomeLayers.length; index += 1) {
      assert.ok(
        entry.indexOf(stableHomeLayers[index - 1]) < entry.indexOf(stableHomeLayers[index]),
      );
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

test("homepage replaces the embedded legacy directory with the complete portal directory", () => {
  const explorePortalUsages = [...productionHome.matchAll(/<HomeExplorePortal\s*\/>/g)];

  assert.ok(explorePortalUsages.length >= 2, "normal and unavailable states must expose navigation");
  assert.match(semanticDashboard, /hasClass\(className, "home-explore-story"\)/);
  assert.match(semanticDashboard, /home-explore-story"\)\)\s*\{\s*return null;/);
});

test("Lagoa homepage is civic-tech data on an open editorial canvas", () => {
  assert.match(homeDirectionCss, /Lagoa dos Patos — Civic Tech local/);
  assert.match(homeDirectionCss, /\.home-water-table__rows article[\s\S]*border-bottom:/);
  assert.match(homeLayoutCss, /\.home-story--water,[\s\S]*border:\s*0 !important/);
  assert.match(homeLayoutCss, /\.home-water-story__layout[\s\S]*border-top:\s*1px solid var\(--home-open-line\) !important/);
  assert.match(homeLayoutCss, /\.home-water-focus,[\s\S]*\.home-water-table[\s\S]*background:\s*transparent !important/);
});

test("homepage directory is editorial navigation instead of a promotional card grid", () => {
  assert.match(homeCurrentCss, /Diretório do portal/);
  assert.match(homeLayoutCss, /\.home-explore-portal,[\s\S]*border:\s*0 !important/);
  assert.match(homeLayoutCss, /\.home-explore-portal::before,[\s\S]*display:\s*none !important/);
  assert.match(homeLayoutCss, /\.home-explore-portal-groups[\s\S]*border-top-color:\s*var\(--home-open-line\)/);
});

test("homepage answer section closes as an open editorial chapter", () => {
  assert.match(homeCurrentCss, /Metodologia, transparência e FAQ/);
  assert.match(
    homeLayoutCss,
    /#como-interpretar-o-tempo\.editorial-answer-section[\s\S]*border-top:\s*1px solid var\(--home-open-line\) !important/,
  );
  assert.match(
    homeLayoutCss,
    /\.editorial-answer-section::before,[\s\S]*\.editorial-answer-section::after[\s\S]*display:\s*none !important/,
  );
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
  assert.match(homeUxCss, /:focus-visible/);
  assert.match(homeLayoutCss, /@media \(max-width: 980px\)/);
  assert.match(homeLayoutCss, /@media \(max-width: 720px\)/);
  assert.match(homeLayoutCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(homeForecastCss, /@media \(max-width: 1040px\)/);
  assert.match(homeForecastCss, /@media \(max-width: 700px\)/);
});
