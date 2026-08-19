import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const manager = readFileSync("src/components/pwa/PwaManager.tsx", "utf8");
const managerCss = readFileSync("src/components/pwa/pwa-manager.css", "utf8");
const experience = readFileSync("src/components/pwa/PwaAppExperience.tsx", "utf8");
const experienceCss = readFileSync("src/components/pwa/pwa-app-experience.css", "utf8");
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");
const footerLegacyCss = readFileSync("src/production/styles/footer-editorial-v51-fix.css", "utf8");
const mobileUsabilityCss = readFileSync("src/production/styles/mobile-usability-refinement.css", "utf8");
const mobileWidthGuardCss = readFileSync("src/production/styles/mobile-width-guard.css", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const offlinePage = readFileSync("public/offline.html", "utf8");
const manifest = readFileSync("public/manifest.webmanifest", "utf8");

test("PWA is mounted with manifest and mobile metadata", () => {
  assert.match(rootRoute, /import \{ PwaAppExperience \}/);
  assert.match(rootRoute, /import \{ PwaManager \}/);
  assert.match(rootRoute, /<PwaAppExperience \/>/);
  assert.match(rootRoute, /<PwaManager \/>/);
  assert.match(rootRoute, /rel: "manifest", href: "\/manifest\.webmanifest"/);
  assert.match(rootRoute, /mobile-web-app-capable/);
  assert.match(rootRoute, /apple-mobile-web-app-capable/);
  assert.match(rootRoute, /apple-mobile-web-app-status-bar-style/);
  assert.match(rootRoute, /viewport-fit=cover/);
  assert.doesNotMatch(rootRoute, /PWA_EMERGENCY_RESET_SCRIPT/);
  assert.doesNotMatch(rootRoute, /getRegistrations\(\)/);
  assert.doesNotMatch(rootRoute, /caches\.keys\(\)/);
});

test("installer no longer mutates persistent document scroll state", () => {
  assert.match(manager, /navigator\.serviceWorker\.register\("\/sw\.js"/);
  assert.match(manager, /scope:\s*"\/"/);
  assert.match(manager, /updateViaCache:\s*"none"/);
  assert.match(manager, /aria-expanded=\{isOpen\}/);
  assert.match(manager, /event\.key === "Escape"/);
  assert.match(manager, /event\.key !== "Tab"/);
  assert.doesNotMatch(manager, /document\.body\.style\.overflow/);
  assert.doesNotMatch(manager, /style\.removeProperty\("overflow"\)/);
});

test("PWA visual experience is component-owned and editorial", () => {
  assert.match(experience, /import "\.\/pwa-app-experience\.css"/);
  assert.match(managerCss, /PWA — instalação e atualização em linguagem editorial/);
  assert.match(managerCss, /\.pwa-option-card\s*\{[\s\S]*border-top:/);
  assert.match(managerCss, /\.pwa-dialog\s*\{[\s\S]*border-radius:\s*14px/);
  assert.doesNotMatch(managerCss, /backdrop-filter/);
  assert.doesNotMatch(managerCss, /linear-gradient/);
  assert.match(experienceCss, /@media \(display-mode: standalone\), \(display-mode: fullscreen\)/);
  assert.match(experienceCss, /env\(safe-area-inset-top\)/);
  assert.match(experienceCss, /env\(safe-area-inset-bottom\)/);
  assert.match(experienceCss, /\.pwa-connectivity-notice/);
});

test("installed app tracks connectivity and economizes the live camera", () => {
  assert.match(experience, /data\.pwaMode/);
  assert.match(experience, /data\.saveData/);
  assert.match(experience, /data\.effectiveConnection/);
  assert.match(experience, /data\.network/);
  assert.match(experience, /window\.addEventListener\("online"/);
  assert.match(experience, /window\.addEventListener\("offline"/);
  assert.match(experience, /visibilitychange/);
  assert.match(experience, /getRegistration\("\/"\)/);
  assert.match(experience, /Sem conexão/);
  assert.match(experience, /Conexão restabelecida/);
  assert.match(experienceCss, /data-save-data="true"/);
  assert.match(experienceCss, /data-effective-connection="slow-2g"/);
  assert.match(experienceCss, /data-effective-connection="2g"/);
  assert.match(experienceCss, /data-network="offline"/);
  assert.match(experienceCss, /\.tp-home-hero__live-camera iframe[\s\S]*display:\s*none/);
});

test("legacy PWA layers and unrelated global styles cannot restyle the installer", () => {
  for (const entry of [styleImports, globalStyles]) {
    assert.doesNotMatch(entry, /styles\/pwa\.css/);
    assert.doesNotMatch(entry, /pwa-fullscreen-refinement\.css/);
    assert.doesNotMatch(entry, /pwa-app-refinement-v60\.css/);
  }

  for (const stylesheet of [footerLegacyCss, mobileUsabilityCss, mobileWidthGuardCss]) {
    assert.doesNotMatch(stylesheet, /\.pwa-launcher/);
    assert.doesNotMatch(stylesheet, /\.pwa-dialog/);
  }
});

test("service worker keeps live pages network-first and caches only application assets", () => {
  assert.match(serviceWorker, /tempo-pelotas-v6/);
  assert.match(serviceWorker, /navigationPreload\?\.enable\(\)/);
  assert.match(serviceWorker, /event\.preloadResponse/);
  assert.match(serviceWorker, /onlineOnlyNavigation\(event\)/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/assets\/"\)/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/brand\/"\)/);
  assert.doesNotMatch(serviceWorker, /url\.pathname\.endsWith\("\.png"\)/);
  assert.doesNotMatch(serviceWorker, /url\.pathname\.endsWith\("\.webp"\)/);
  assert.doesNotMatch(serviceWorker, /url\.pathname\.endsWith\("\.jpg"\)/);
});

test("manifest favors local utility and allows radar in landscape", () => {
  assert.match(manifest, /"name": "Tempo Pelotas"/);
  assert.match(manifest, /"orientation": "any"/);
  assert.match(manifest, /"name": "Tempo agora em Pelotas"/);
  assert.match(manifest, /"name": "Radar e satélite"/);
  assert.match(manifest, /"name": "Situação das águas"/);
  assert.match(manifest, /"name": "Avisos meteorológicos"/);
  assert.match(manifest, /tempo-pelotas-maskable\.png/);
});

test("offline page is explicit that it does not show current conditions", () => {
  assert.match(offlinePage, /viewport-fit=cover/);
  assert.match(offlinePage, /Aplicativo Tempo Pelotas/);
  assert.match(offlinePage, /Aguardando conexão/);
  assert.match(offlinePage, /Esta tela não representa a situação meteorológica atual/);
  assert.match(offlinePage, /window\.addEventListener\("online"/);
  assert.match(offlinePage, /env\(safe-area-inset-bottom\)/);
});
