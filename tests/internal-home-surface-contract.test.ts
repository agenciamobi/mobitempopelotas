import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const siteHeader = readFileSync("src/production/components/site-header.tsx", "utf8");
const siteFooter = readFileSync("src/production/components/site-footer.tsx", "utf8");
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
const regionalDirectory = readFileSync(
  "src/components/regional/RegionalCitiesDirectory.tsx",
  "utf8",
);
const regionalDirectoryCss = readFileSync(
  "src/components/regional/RegionalCitiesDirectory.module.css",
  "utf8",
);
const cppmetNewsPage = readFileSync("src/components/blog/CppmetNewsPage.tsx", "utf8");
const cppmetNewsCss = readFileSync("src/components/blog/CppmetNewsPage.css", "utf8");
const officialDataCss = readFileSync(
  "src/components/content/OfficialDataAccessNotice.css",
  "utf8",
);
const forecastAccuracyCss = readFileSync(
  "src/components/methodology/ForecastAccuracyPanel.css",
  "utf8",
);
const iconRoute = readFileSync(
  "src/routes/brand/tempo-pelotas-icon[.]png.ts",
  "utf8",
);
const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const manifest = readFileSync("public/manifest.webmanifest", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const offlinePage = readFileSync("public/offline.html", "utf8");
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const internalVisualSmoke = readFileSync("scripts/internal-route-visual-smoke.mjs", "utf8");
const visualParityWorkflow = readFileSync(".github/workflows/visual-parity.yml", "utf8");

test("public pages reuse the Home editorial header instead of the legacy header", () => {
  assert.match(siteHeader, /HomeEditorialHeader/);
  assert.doesNotMatch(siteHeader, /components\/layout\/Header/);
  assert.match(internalShell, /officialAlertSeverity=\{primaryOfficialSeverity\}/);
  assert.match(internalShell, /variant="hero"/);
});

test("flood history is standalone and shared chrome cannot be duplicated", () => {
  assert.match(siteLayout, /"\/enchente-2024-pelotas-laranjal"/);
  assert.match(siteLayout, /<SiteHeader advisoryLevel="normal" variant="hero" \/>/);
  assert.match(siteLayout, /<SiteFooter \/>/);
  assert.match(siteFooter, /variant="home"/);
  assert.match(siteFooter, /site-footer-home\.css/);
});

test("internal weather shell uses the same 1440px rail and soft surfaces as the Home", () => {
  assert.match(internalShellCss, /--internal-weather-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(internalShellCss, /--internal-weather-frame-gutter:\s*var\(--tp-home-container-gutter, 48px\)/);
  assert.match(internalShellCss, /--internal-weather-radius:\s*16px/);
  assert.match(internalShellCss, /--internal-weather-radius-mobile:\s*12px/);
  assert.match(internalShellCss, /\.internal-weather-hero-frame/);
  assert.doesNotMatch(internalShellCss, /radial-gradient/);
});

test("topic pages use the same responsive rail contract as the Home", () => {
  assert.match(surfaceCss, /--tp-home-container-max, 1440px/);
  assert.match(surfaceCss, /--tp-home-container-gutter, 48px/);
  assert.match(surfaceCss, /--tp-home-container-compact-max, 1180px/);
  assert.match(surfaceCss, /--tp-home-container-compact-gutter, 32px/);
  assert.match(surfaceCss, /--tp-home-container-mobile-gutter, 20px/);
  assert.match(surfaceCss, /\.methodology-chapter-nav/);
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

test("regional directory and CPPMet content do not create nested main landmarks", () => {
  assert.doesNotMatch(regionalDirectory, /<main\b/);
  assert.doesNotMatch(cppmetNewsPage, /<main\b/);
  assert.match(regionalDirectory, /regional-cities-directory/);
  assert.match(cppmetNewsPage, /<div className="cppmet-blog">/);
});

test("dedicated regional, blog and methodology support surfaces follow the Home visual language", () => {
  for (const css of [regionalDirectoryCss, cppmetNewsCss, officialDataCss, forecastAccuracyCss]) {
    assert.doesNotMatch(css, /radial-gradient|linear-gradient/);
    assert.match(css, /box-shadow:\s*none/);
    assert.match(css, /border-radius:\s*(?:var\([^)]*\)|16px|14px|12px)/);
  }
  assert.match(regionalDirectoryCss, /width:\s*100%/);
  assert.match(cppmetNewsCss, /width:\s*100%/);
  assert.match(officialDataCss, /width:\s*100%/);
  assert.match(forecastAccuracyCss, /width:\s*100%/);
});

test("canonical PNG icon is served by the app and reused by favicon, PWA, offline and push", () => {
  assert.match(iconRoute, /createFileRoute\("\/brand\/tempo-pelotas-icon\.png"\)/);
  assert.match(iconRoute, /"Content-Type":\s*"image\/png"/);
  assert.match(iconRoute, /"X-Content-Type-Options":\s*"nosniff"/);
  for (const source of [rootRoute, manifest, serviceWorker, offlinePage]) {
    assert.match(source, /\/brand\/tempo-pelotas-icon\.png/);
  }
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

test("visual parity workflow captures critical internal routes on desktop and narrow mobile", () => {
  for (const route of [
    "/tempo-hoje-pelotas",
    "/chuva-em-pelotas",
    "/vento-em-pelotas",
    "/clima-em-pelotas",
    "/meteograma-pelotas",
    "/historico-climatico-pelotas",
    "/enchente-2024-pelotas-laranjal",
    "/estacao-embrapa-pelotas",
    "/situacao-hidrologica-pelotas",
  ]) {
    assert.ok(internalVisualSmoke.includes(route));
  }

  assert.match(internalVisualSmoke, /desktop-1280/);
  assert.match(internalVisualSmoke, /mobile-320/);
  assert.match(internalVisualSmoke, /horizontalOverflow/);
  assert.match(internalVisualSmoke, /page\.screenshot/);
  assert.match(internalVisualSmoke, /rain-hourly-volume-context/);
  assert.match(internalVisualSmoke, /wind-direction-context/);
  assert.ok(visualParityWorkflow.includes("scripts/internal-route-visual-smoke.mjs"));
  assert.ok(visualParityWorkflow.includes("node scripts/internal-route-visual-smoke.mjs"));
});
