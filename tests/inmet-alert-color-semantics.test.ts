import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { classifyInmetSeverityText } from "../src/lib/weather/inmet-severity.ts";

const stableSource = readFileSync("src/lib/weather/inmet-stable.server.ts", "utf8");
const officialSources = readFileSync("src/lib/weather/official-sources.server.ts", "utf8");
const panel = readFileSync("src/production/components/inmet-alerts-panel.tsx", "utf8");
const homeCss = readFileSync("src/production/components/inmet-alerts-home.css", "utf8");
const pageCss = readFileSync("src/production/components/inmet-alerts-page.css", "utf8");
const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
const headerCss = readFileSync("src/production/components/home-editorial-header.css", "utf8");
const home = readFileSync("src/production/ProductionHome.tsx", "utf8");

test("INMET semantic classifier keeps yellow, orange and red grades distinct", () => {
  assert.equal(classifyInmetSeverityText("Perigo Potencial").severity, "potential");
  assert.equal(classifyInmetSeverityText("Amarelo").severity, "potential");
  assert.equal(classifyInmetSeverityText("1").severity, "potential");

  assert.equal(classifyInmetSeverityText("Perigo").severity, "danger");
  assert.equal(classifyInmetSeverityText("Laranja").severity, "danger");
  assert.equal(classifyInmetSeverityText("2").severity, "danger");

  assert.equal(classifyInmetSeverityText("Grande Perigo").severity, "great-danger");
  assert.equal(classifyInmetSeverityText("Vermelho").severity, "great-danger");
  assert.equal(classifyInmetSeverityText("3").severity, "great-danger");
});

test("official RSS CAP enriches successful municipal alert responses instead of being fallback-only", () => {
  assert.match(stableSource, /const INMET_RSS_URL = "https:\/\/apiprevmet3\.inmet\.gov\.br\/avisos\/rss"/);
  assert.match(stableSource, /fetchBaseInmetAlerts\(\)/);
  assert.match(stableSource, /const rssAlerts = await fetchRssAlerts\(\)/);
  assert.match(stableSource, /severity: rss\.severity/);
  assert.match(stableSource, /municipalityCodes: unique/);
  assert.match(stableSource, /\\b\\d\{5,8\}\\b/);
  assert.doesNotMatch(stableSource, /\\b\\d\{4,8\}\\b/);
  assert.match(officialSources, /fetchStableInmetAlerts/);
});

test("unknown INMET severity cannot inherit the local weather warning color", () => {
  assert.match(panel, /const colorClass = classified \? `severity-\$\{primary\.severity\}` : "severity-unknown"/);
  assert.doesNotMatch(panel, /advisory-\$\{advisoryLevel\}/);
  assert.match(homeCss, /\.tp-home-alert\.severity-unknown[\s\S]*--risk:\s*#6f818a/);
});

test("home and page use the same official INMET palette", () => {
  for (const css of [homeCss, pageCss]) {
    assert.match(css, /severity-potential[\s\S]*#d6ae00/);
    assert.match(css, /severity-danger[\s\S]*#ef7d2f/);
    assert.match(css, /severity-great-danger[\s\S]*#d93636/);
  }

  assert.match(panel, /potential: "Amarelo"/);
  assert.match(panel, /danger: "Laranja"/);
  assert.match(panel, /"great-danger": "Vermelho"/);
  assert.match(panel, /tp-home-alert__levels/);
});

test("home header names and colors the highest official Pelotas alert independently", () => {
  assert.match(header, /officialAlertSeverity/);
  assert.match(header, /return "Alerta amarelo"/);
  assert.match(header, /return "Alerta laranja"/);
  assert.match(header, /return "Alerta vermelho"/);
  assert.match(headerCss, /\.tp-home-header__alert\.severity-potential/);
  assert.match(headerCss, /\.tp-home-header__alert\.severity-danger/);
  assert.match(headerCss, /\.tp-home-header__alert\.severity-great-danger/);
  assert.match(home, /const primaryOfficialSeverity/);
  assert.match(home, /officialAlertSeverity=\{primaryOfficialSeverity\}/);
  assert.match(home, /primaryOfficialSeverity === "great-danger"/);
});
