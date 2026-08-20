import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const siteHeader = readFileSync("src/production/components/site-header.tsx", "utf8");
const internalShell = readFileSync("src/components/layout/InternalWeatherPageShell.tsx", "utf8");
const internalShellCss = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const surfaceCss = readFileSync(
  "src/production/styles/internal-home-surface-contract.css",
  "utf8",
);
const standaloneCss = readFileSync(
  "src/production/styles/standalone-home-surface-contract.css",
  "utf8",
);
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("public pages reuse the Home editorial header instead of the legacy header", () => {
  assert.match(siteHeader, /HomeEditorialHeader/);
  assert.doesNotMatch(siteHeader, /components\/layout\/Header/);
  assert.match(internalShell, /officialAlertSeverity=\{primaryOfficialSeverity\}/);
  assert.match(internalShell, /variant="hero"/);
});

test("flood history is standalone and cannot receive a duplicate global header/footer", () => {
  assert.match(siteLayout, /"\/enchente-2024-pelotas-laranjal"/);
  assert.match(siteLayout, /<SiteHeader advisoryLevel="normal" variant="hero" \/>/);
  assert.match(siteLayout, /<Footer variant="home" \/>/);
});

test("internal weather shell uses the same 1440px rail and soft surfaces as the Home", () => {
  assert.match(internalShellCss, /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(internalShellCss, /--internal-weather-frame-gutter:\s*var\(--tp-home-container-gutter, 48px\)/);
  assert.match(internalShellCss, /--internal-weather-radius:\s*16px/);
  assert.match(internalShellCss, /--internal-weather-radius-mobile:\s*12px/);
  assert.match(internalShellCss, /\.internal-weather-hero-frame/);
  assert.doesNotMatch(internalShellCss, /radial-gradient/);
});

test("final internal surface contract neutralizes old full-bleed topic styling", () => {
  assert.match(surfaceCss, /canvas claro, rail de 1440px/);
  assert.match(surfaceCss, /border:\s*1px solid var\(--internal-line\)/);
  assert.match(surfaceCss, /border-radius:\s*var\(--internal-radius\)/);
  assert.match(surfaceCss, /background:\s*var\(--internal-surface\)/);
  assert.match(surfaceCss, /box-shadow:\s*none/);
  assert.match(surfaceCss, /internal-weather-shell--flood-history/);
  assert.match(surfaceCss, /\.tp-flood-hero h1/);
  assert.match(surfaceCss, /@media \(max-width: 720px\)/);
});

test("standalone status and privacy pages share Home containers and radii", () => {
  assert.match(standaloneCss, /\.data-status-page/);
  assert.match(standaloneCss, /\.privacy-page/);
  assert.match(standaloneCss, /--tp-home-container-max, 1440px/);
  assert.match(standaloneCss, /--tp-home-container-gutter, 48px/);
  assert.match(standaloneCss, /--internal-radius:\s*16px/);
  assert.match(standaloneCss, /--internal-radius-mobile:\s*12px/);
});

test("new surface contracts are loaded after the Home shell in both production entries", () => {
  for (const entry of [cssEntry, tsEntry]) {
    const homeIndex = entry.indexOf("home-editorial-shell.css");
    const internalIndex = entry.indexOf("internal-home-surface-contract.css");
    const standaloneIndex = entry.indexOf("standalone-home-surface-contract.css");
    assert.ok(homeIndex >= 0);
    assert.ok(internalIndex > homeIndex);
    assert.ok(standaloneIndex > internalIndex);
  }
});
