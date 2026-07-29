import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const experience = readFileSync("src/components/pwa/PwaAppExperience.tsx", "utf8");
const styles = readFileSync("src/production/styles/pwa-app-refinement-v60.css", "utf8");
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const offlinePage = readFileSync("public/offline.html", "utf8");

test("temporarily disables PWA mounting and clears persistent browser state", () => {
  assert.doesNotMatch(rootRoute, /import \{ PwaAppExperience \}/);
  assert.doesNotMatch(rootRoute, /import \{ PwaManager \}/);
  assert.doesNotMatch(rootRoute, /<PwaAppExperience \/>/);
  assert.doesNotMatch(rootRoute, /<PwaManager \/>/);
  assert.doesNotMatch(rootRoute, /rel: "manifest"/);
  assert.match(rootRoute, /PWA_EMERGENCY_RESET_SCRIPT/);
  assert.match(rootRoute, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(rootRoute, /registration\.unregister\(\)/);
  assert.match(rootRoute, /caches\.keys\(\)/);
  assert.match(rootRoute, /caches\.delete\(cacheName\)/);
  assert.match(rootRoute, /element\.style\.removeProperty\("overflow"\)/);
  assert.match(rootRoute, /viewport-fit=cover/);
});

test("installed app implementation remains available for later reactivation", () => {
  assert.match(experience, /data\.pwaMode/);
  assert.match(experience, /data\.saveData/);
  assert.match(experience, /data\.effectiveConnection/);
  assert.match(experience, /data\.network/);
  assert.match(experience, /window\.addEventListener\("online"/);
  assert.match(experience, /window\.addEventListener\("offline"/);
  assert.match(experience, /visibilitychange/);
  assert.match(experience, /getRegistration\("\/"\)/);
  assert.match(experience, /Você está sem conexão/);
  assert.match(experience, /Conexão restabelecida/);
});

test("PWA visual layer remains preserved but inactive", () => {
  assert.match(styles, /@media \(display-mode: standalone\), \(display-mode: fullscreen\)/);
  assert.match(styles, /--pwa-app-header-height/);
  assert.match(styles, /--pwa-app-nav-height/);
  assert.match(styles, /env\(safe-area-inset-top\)/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /\.production-mobile-navigation/);
  assert.match(styles, /\.pwa-connectivity-notice/);
  assert.match(styles, /\.pwa-dialog::before/);
});

test("live camera fallback styles remain available for future PWA reactivation", () => {
  assert.match(styles, /data-save-data="true"/);
  assert.match(styles, /data-effective-connection="slow-2g"/);
  assert.match(styles, /data-effective-connection="2g"/);
  assert.match(styles, /data-network="offline"/);
  assert.match(styles, /\.weather-hero-live-camera iframe[\s\S]*display:\s*none/);
});

test("PWA refinement remains the final production style layer", () => {
  const tsCamera = styleImports.indexOf("home-hero-live-camera-v54.css");
  const tsPwa = styleImports.indexOf("pwa-app-refinement-v60.css");
  const cssCamera = globalStyles.indexOf("home-hero-live-camera-v54.css");
  const cssPwa = globalStyles.indexOf("pwa-app-refinement-v60.css");

  assert.ok(tsCamera >= 0 && tsPwa > tsCamera);
  assert.ok(cssCamera >= 0 && cssPwa > cssCamera);
});

test("service worker source remains versioned for later reactivation", () => {
  assert.match(serviceWorker, /tempo-pelotas-v5/);
  assert.match(serviceWorker, /navigationPreload\?\.enable\(\)/);
  assert.match(serviceWorker, /event\.preloadResponse/);
  assert.match(serviceWorker, /onlineOnlyNavigation\(event\)/);
});

test("offline page remains preserved for later reactivation", () => {
  assert.match(offlinePage, /viewport-fit=cover/);
  assert.match(offlinePage, /Aplicativo Tempo Pelotas/);
  assert.match(offlinePage, /Aguardando conexão/);
  assert.match(offlinePage, /window\.addEventListener\("online"/);
  assert.match(offlinePage, /env\(safe-area-inset-bottom\)/);
});
