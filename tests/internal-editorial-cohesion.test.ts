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
const homeWaterCss = readFileSync(
  "src/production/styles/home-water-editorial-v49.css",
  "utf8",
);
const homeClosingCss = readFileSync(
  "src/production/styles/home-closing-editorial-v50.css",
  "utf8",
);
const footerCss = readFileSync(
  "src/production/styles/footer-editorial-v51.css",
  "utf8",
);
const footerFixCss = readFileSync(
  "src/production/styles/footer-editorial-v51-fix.css",
  "utf8",
);
const headerMegaCss = readFileSync(
  "src/production/styles/header-megamenu-editorial-v52.css",
  "utf8",
);
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const semanticDashboard = readFileSync(
  "src/production/components/home-editorial-dashboard-semantic.tsx",
  "utf8",
);

test("final editorial layers preserve their cascade order", () => {
  const finalLayers = [
    "internal-home-cohesion-v48.css",
    "internal-home-cohesion-v48-fix.css",
    "home-water-editorial-v49.css",
    "home-closing-editorial-v50.css",
    "footer-editorial-v51.css",
    "footer-editorial-v51-fix.css",
    "header-megamenu-editorial-v52.css",
  ];

  for (const layer of finalLayers) {
    assert.match(cssEntry, new RegExp(layer.replace(".", "\\.")));
    assert.match(tsEntry, new RegExp(layer.replace(".", "\\.")));
  }

  for (let index = 1; index < finalLayers.length; index += 1) {
    assert.ok(cssEntry.indexOf(finalLayers[index - 1]) < cssEntry.indexOf(finalLayers[index]));
    assert.ok(tsEntry.indexOf(finalLayers[index - 1]) < tsEntry.indexOf(finalLayers[index]));
  }
});

test("internal pages share the homepage frame and fullwidth hero", () => {
  assert.match(internalCss, /--portal-frame-max:\s*1760px/);
  assert.match(internalCss, /\.site-shell--topic \.site-container--topic\s*\{[\s\S]*width:\s*100%/);
  assert.match(internalCss, /border-radius:\s*0 0 clamp\(/);
  assert.match(internalCss, /max\(\s*var\(--portal-content-gutter\)/);
});

test("internal chapters use delayed offscreen rendering", () => {
  assert.match(internalCss, /content-visibility:\s*auto/);
  assert.match(internalCss, /contain-intrinsic-size:\s*auto 620px/);
});

test("internal footer preserves compact operational links", () => {
  assert.match(internalFixCss, /\.editorial-footer__operational\s*\{[\s\S]*display:\s*grid/);
  assert.match(internalFixCss, /grid-template-columns:\s*repeat\(2/);
});

test("Lagoa homepage section uses the current light editorial composition", () => {
  assert.match(homeWaterCss, /\.home-story--water\s*\{[\s\S]*content-visibility:\s*auto/);
  assert.match(homeWaterCss, /linear-gradient\(155deg, #f9fcfb/);
  assert.match(homeWaterCss, /\.home-water-focus\s*\{[\s\S]*rgba\(255, 255, 255, 0\.92\)/);
  assert.match(homeWaterCss, /\.home-water-table__rows article\s*\{[\s\S]*border-radius:\s*17px/);
  assert.match(homeWaterCss, /level-state--rising::before/);
  assert.match(homeWaterCss, /level-state--falling::before/);
  assert.match(homeWaterCss, /level-state--flood::before/);
});

test("homepage replaces the embedded legacy directory with the complete portal directory", () => {
  const explorePortalUsages = [...productionHome.matchAll(/<HomeExplorePortal\s*\/>/g)];

  assert.ok(explorePortalUsages.length >= 2, "normal and unavailable states must expose navigation");
  assert.match(semanticDashboard, /hasClass\(className, "home-explore-story"\)/);
  assert.match(semanticDashboard, /home-explore-story"\)\)\s*\{\s*return null;/);
});

test("homepage closing directory uses the framed editorial composition", () => {
  assert.match(homeClosingCss, /\.home-explore-portal\s*\{[\s\S]*content-visibility:\s*auto/);
  assert.match(homeClosingCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(homeClosingCss, /\.home-explore-portal-group::before/);
  assert.match(homeClosingCss, /\.home-explore-portal-group\.is-weather::before/);
  assert.match(homeClosingCss, /\.home-explore-portal-group\.is-monitoring::before/);
  assert.match(homeClosingCss, /\.home-explore-portal-group\.is-water::before/);
});

test("homepage answer section closes with an accessible institutional surface", () => {
  assert.match(homeClosingCss, /#como-interpretar-o-tempo\.editorial-answer-section/);
  assert.match(homeClosingCss, /linear-gradient\(142deg, #061a2a/);
  assert.match(homeClosingCss, /counter-reset:\s*home-editorial-fact/);
  assert.match(homeClosingCss, /details\[open\][\s\S]*summary::after/);
  assert.match(homeClosingCss, /outline:\s*3px solid rgba\(120, 230, 238, 0\.45\)/);
});

test("footer follows the portal frame without restarting at hero scale", () => {
  assert.match(footerCss, /#como-interpretar-o-tempo\.editorial-answer-section\{margin-bottom:0!important\}/);
  assert.match(footerCss, /\.editorial-footer-shell\{margin-top:clamp\(12px,1\.7vw,24px\)!important/);
  assert.match(footerCss, /\.editorial-footer-brand-logo\{width:clamp\(170px,17vw,240px\)!important/);
  assert.match(footerCss, /font-size:clamp\(2\.35rem,3\.65vw,4\.35rem\)!important/);
  assert.doesNotMatch(footerCss, /6\.45rem/);
});

test("footer organizes navigation, sources and status as operational information", () => {
  assert.match(footerCss, /counter-reset:footer-group/);
  assert.match(footerCss, /counter\(footer-group,decimal-leading-zero\)/);
  assert.match(footerCss, /\.editorial-footer-transparency\{grid-template-columns:minmax\(0,1\.08fr\)/);
  assert.match(footerCss, /linear-gradient\(135deg,#061a2a,#082b3e 66%,#09394b\)/);
  assert.match(footerCss, /aria-current=page/);
  assert.match(footerFixCss, /box-shadow:inset 3px 0 0 #18bdcd/);
  assert.match(footerFixCss, /display:none!important;content:none!important/);
});

test("developer credit stays centered and the PWA launcher does not cover it", () => {
  assert.match(
    footerFixCss,
    /\.editorial-footer-base\{grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)!important\}/,
  );
  assert.match(footerFixCss, /\.editorial-footer-base>p\{grid-column:2;justify-self:center/);
  assert.match(footerFixCss, /background:linear-gradient\(135deg,#061a2a,#0a4054\)!important/);
  assert.match(footerFixCss, /\.pwa-launcher\{[\s\S]*color:#fff!important/);
  assert.match(footerFixCss, /backdrop-filter:none!important/);
  assert.match(footerFixCss, /body:has\(\.pwa-launcher\) \.site-shell/);
  assert.match(footerFixCss, /var\(--mobile-tab-height,68px\) \+ 76px/);
  assert.match(footerFixCss, /left:50%!important/);
  assert.match(footerFixCss, /transform:translateX\(-50%\)!important/);
});

test("desktop megamenu is opaque, compact and visibly interactive", () => {
  assert.match(headerMegaCss, /@media \(min-width: 901px\)/);
  assert.match(headerMegaCss, /\.mega-navigation-surface\s*\{[\s\S]*background:\s*#fff !important/);
  assert.match(headerMegaCss, /backdrop-filter:\s*none !important/);
  assert.match(headerMegaCss, /min-height:\s*210px !important/);
  assert.match(headerMegaCss, /\.mega-navigation-feature b i/);
  assert.match(headerMegaCss, /\.mega-navigation-columns section \+ section/);
  assert.match(headerMegaCss, /\.mega-navigation-columns a::after/);
  assert.match(headerMegaCss, /content:\s*"→"/);
  assert.match(headerMegaCss, /a\[aria-current="page"\]/);
});

test("homepage final visual layers remain usable on tablet and mobile", () => {
  assert.match(homeWaterCss, /@media \(max-width: 980px\)/);
  assert.match(homeWaterCss, /@media \(max-width: 720px\)/);
  assert.match(homeClosingCss, /@media \(max-width: 1080px\)/);
  assert.match(homeClosingCss, /@media \(max-width: 820px\)/);
  assert.match(homeClosingCss, /@media \(max-width: 520px\)/);
  assert.match(homeClosingCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(footerCss, /@media\(max-width:1080px\)/);
  assert.match(footerCss, /@media\(max-width:880px\)/);
  assert.match(footerCss, /@media\(max-width:620px\)/);
  assert.match(footerCss, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(headerMegaCss, /@media \(min-width: 901px\) and \(max-width: 1080px\)/);
  assert.match(headerMegaCss, /@media \(prefers-reduced-motion: reduce\)/);
});