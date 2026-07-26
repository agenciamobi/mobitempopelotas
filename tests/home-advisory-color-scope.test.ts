import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const advisoryStyles = readFileSync(
  "src/production/styles/home-advisory-color-scope-v65.css",
  "utf8",
);
const alertPanel = readFileSync("src/production/components/inmet-alerts-panel.tsx", "utf8");
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");

test("hero title keeps the MOBI purple identity during attention and warning states", () => {
  assert.match(advisoryStyles, /\.weather-hero--attention \.weather-hero-headline/);
  assert.match(advisoryStyles, /\.weather-hero--warning \.weather-hero-headline/);
  assert.match(advisoryStyles, /color:\s*#5e2ced/);
});

test("ordinary hero actions stay neutral while the alert CTA keeps the risk token", () => {
  assert.match(advisoryStyles, /\.weather-hero-primary\s*\{[\s\S]*background:\s*#071e2f/);
  assert.match(
    advisoryStyles,
    /\.weather-hero-primary\[href="\/alertas"\]\s*\{[\s\S]*background:\s*var\(--hero-accent\)/,
  );
  assert.match(advisoryStyles, /\.weather-hero-secondary\s*\{[\s\S]*color:\s*#16384a/);
});

test("INMET bar only adopts official colors after severity and validity are recognized", () => {
  assert.match(alertPanel, /hasVerifiedInmetAlertSemantics/);
  assert.match(alertPanel, /alert\.severity !== "unknown"/);
  assert.match(alertPanel, /validDate\(alert\.startsAt\)/);
  assert.match(alertPanel, /validDate\(alert\.expiresAt\)/);
  assert.match(alertPanel, /data-alert-official-semantics=\{verified \? "verified" : "unverified"\}/);
  assert.match(alertPanel, /Classificação em validação/);
  assert.match(alertPanel, /advisory-\$\{advisoryLevel\}/);

  assert.match(advisoryStyles, /\.home-inmet-alerts\.is-unverified\.advisory-normal/);
  assert.match(advisoryStyles, /\.home-inmet-alerts\.is-unverified\.advisory-attention/);
  assert.match(advisoryStyles, /\.home-inmet-alerts\.is-unverified\.advisory-warning/);
  assert.match(advisoryStyles, /\.is-officially-classified\.severity-potential/);
  assert.match(advisoryStyles, /\.is-officially-classified\.severity-danger/);
  assert.match(advisoryStyles, /\.is-officially-classified\.severity-great-danger/);
});

test("unverified official alerts do not elevate the portal header by themselves", () => {
  assert.match(productionHome, /verifiedPelotasAlerts = pelotasOfficialAlerts\.filter/);
  assert.match(productionHome, /hasVerifiedInmetAlertSemantics/);
  assert.match(productionHome, /<InmetAlertsPanel data=\{inmetAlerts\} variant="home" advisoryLevel=\{headerLevel\}/);
});

test("advisory color scope is loaded after live camera geometry", () => {
  const tsGeometry = styleImports.indexOf("home-live-camera-exact-geometry-v64.css");
  const tsAdvisory = styleImports.indexOf("home-advisory-color-scope-v65.css");
  const cssGeometry = globalStyles.indexOf("home-live-camera-exact-geometry-v64.css");
  const cssAdvisory = globalStyles.indexOf("home-advisory-color-scope-v65.css");

  assert.ok(tsGeometry >= 0 && tsAdvisory > tsGeometry);
  assert.ok(cssGeometry >= 0 && cssAdvisory > cssGeometry);
});
