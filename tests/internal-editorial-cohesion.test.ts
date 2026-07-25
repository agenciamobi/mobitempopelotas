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

test("internal editorial layers are loaded last in both style entries", () => {
  assert.match(cssEntry, /internal-home-cohesion-v48\.css/);
  assert.match(cssEntry, /internal-home-cohesion-v48-fix\.css/);
  assert.match(tsEntry, /internal-home-cohesion-v48\.css/);
  assert.match(tsEntry, /internal-home-cohesion-v48-fix\.css/);

  assert.ok(
    cssEntry.indexOf("internal-home-cohesion-v48.css") <
      cssEntry.indexOf("internal-home-cohesion-v48-fix.css"),
  );
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
