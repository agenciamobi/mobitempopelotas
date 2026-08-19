import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const alertPanel = readFileSync("src/production/components/inmet-alerts-panel.tsx", "utf8");
const homeAlertStyles = readFileSync("src/production/components/inmet-alerts-home.css", "utf8");
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");

test("INMET bar only adopts official colors after severity and validity are recognized", () => {
  assert.match(alertPanel, /hasVerifiedInmetAlertSemantics/);
  assert.match(alertPanel, /alert\.severity !== "unknown"/);
  assert.match(alertPanel, /validDate\(alert\.startsAt\)/);
  assert.match(alertPanel, /validDate\(alert\.expiresAt\)/);
  assert.match(alertPanel, /data-alert-official-semantics=\{verified \? "verified" : "unverified"\}/);
  assert.match(alertPanel, /Classificação em validação/);
  assert.match(alertPanel, /advisory-\$\{advisoryLevel\}/);

  assert.match(homeAlertStyles, /\.tp-home-alert\.is-unverified\.advisory-normal/);
  assert.match(homeAlertStyles, /\.tp-home-alert\.is-unverified\.advisory-attention/);
  assert.match(homeAlertStyles, /\.tp-home-alert\.is-unverified\.advisory-warning/);
  assert.match(homeAlertStyles, /\.is-officially-classified\.severity-potential/);
  assert.match(homeAlertStyles, /\.is-officially-classified\.severity-danger/);
  assert.match(homeAlertStyles, /\.is-officially-classified\.severity-great-danger/);
});

test("unverified official alerts do not elevate the portal header by themselves", () => {
  assert.match(productionHome, /verifiedPelotasAlerts = pelotasOfficialAlerts\.filter/);
  assert.match(productionHome, /hasVerifiedInmetAlertSemantics/);
  assert.match(productionHome, /<InmetAlertsPanel data=\{inmetAlerts\} variant="home" advisoryLevel=\{headerLevel\}/);
});

test("home alert color scope is component local rather than a global cascade dependency", () => {
  assert.match(alertPanel, /import "\.\/inmet-alerts-home\.css"/);
  assert.match(alertPanel, /className={`tp-home-alert \$\{colorClass\}/);
  assert.doesNotMatch(homeAlertStyles, /\.home-inmet-alerts/);
});
