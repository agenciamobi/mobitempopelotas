import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const dedicatedCss = readFileSync(
  "src/production/styles/internal-dedicated-page-stabilization.css",
  "utf8",
);
const shellCss = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const shell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");

test("dedicated stabilization is the final production visual layer", () => {
  assert.match(cssEntry, /standalone-home-surface-contract\.css";\s*@import "\.\/styles\/internal-dedicated-page-stabilization\.css";\s*$/);
  assert.match(tsEntry, /standalone-home-surface-contract\.css";\s*import "\.\/styles\/internal-dedicated-page-stabilization\.css";\s*$/);
});

test("dedicated weather pages share the Home rail and shell", () => {
  assert.match(shell, /site-shell--home-editorial/);
  assert.match(shell, /<SiteHeader/);
  assert.match(shell, /<SiteFooter/);
  assert.match(shellCss, /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(shellCss, /--internal-weather-frame-gutter:\s*var\(--tp-home-container-gutter, 48px\)/);
  assert.match(shellCss, /--internal-weather-radius:\s*16px/);
  assert.match(shellCss, /--internal-weather-radius-mobile:\s*12px/);
});

test("camera, frost, meteogram, Embrapa and history heroes use one light Home surface", () => {
  for (const namespace of [
    "internal-weather-shell--cameras",
    "internal-weather-shell--frost",
    "internal-weather-shell--meteogram",
    "internal-weather-shell--embrapa",
    "internal-weather-shell--history",
  ]) {
    assert.match(dedicatedCss, new RegExp(`\\.${namespace}`));
  }

  assert.match(dedicatedCss, /grid-template-columns:\s*minmax\(0, 1\.12fr\) minmax\(320px, 0\.66fr\)/);
  assert.match(dedicatedCss, /background:\s*var\(--dedicated-surface\)/);
  assert.match(dedicatedCss, /\.camera-v2-hero__content,[\s\S]*\.history-hero__content[\s\S]*background:\s*#fff/);
  assert.match(dedicatedCss, /\.camera-v2-featured,[\s\S]*\.history-period-card[\s\S]*border-left:\s*1px solid var\(--dedicated-line\)/);
});

test("major dedicated sections use Home borders, radii and no decorative shadows", () => {
  assert.match(dedicatedCss, /--dedicated-radius:\s*16px/);
  assert.match(dedicatedCss, /--dedicated-inner-radius:\s*14px/);
  assert.match(dedicatedCss, /\.camera-v2-status,[\s\S]*\.camera-v2-empty[\s\S]*box-shadow:\s*none/);
  assert.match(dedicatedCss, /\.frost-v2-source,[\s\S]*\.frost-v2-actions[\s\S]*box-shadow:\s*none/);
  assert.match(dedicatedCss, /\.meteogram-overview,[\s\S]*\.meteogram-unavailable[\s\S]*box-shadow:\s*none/);
  assert.match(dedicatedCss, /\.embrapa-v2-source,[\s\S]*\.embrapa-v2-actions[\s\S]*box-shadow:\s*none/);
  assert.match(dedicatedCss, /\.history-summary-section,[\s\S]*\.history-unavailable[\s\S]*box-shadow:\s*none/);
});

test("functional media remains distinct while mobile collapses heroes cleanly", () => {
  assert.match(dedicatedCss, /\.internal-weather-shell--cameras \.camera-v2-frame\s*\{[\s\S]*overflow:\s*hidden[\s\S]*box-shadow:\s*none/);
  assert.match(dedicatedCss, /@media \(max-width: 720px\)/);
  assert.match(dedicatedCss, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(dedicatedCss, /--dedicated-radius:\s*12px/);
  assert.match(dedicatedCss, /border-top:\s*1px solid var\(--dedicated-line\)/);
  assert.doesNotMatch(dedicatedCss, /!important/);
});
