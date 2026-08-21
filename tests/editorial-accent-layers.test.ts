import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const alertsRoute = readFileSync("src/routes/alertas.tsx", "utf8");
const alertsBase = readFileSync(
  "src/components/weather/WeatherAlertsHomeContract.css",
  "utf8",
);
const alertsAccent = readFileSync(
  "src/components/weather/WeatherAlertsAccentContract.css",
  "utf8",
);
const floodRoute = readFileSync(
  "src/routes/enchente-2024-pelotas-laranjal.tsx",
  "utf8",
);
const floodAccent = readFileSync(
  "src/components/history/Flood2024HomeContract.css",
  "utf8",
);
const regionalRoute = readFileSync("src/routes/tempo-na-regiao-sul-rs.tsx", "utf8");
const regionalBase = readFileSync(
  "src/components/regional/RegionalCitiesDirectory.module.css",
  "utf8",
);
const regionalAccent = readFileSync(
  "src/components/regional/RegionalCitiesAccentContract.css",
  "utf8",
);

test("alerts keeps the neutral Home contract and loads semantic color afterwards", () => {
  const baseIndex = alertsRoute.indexOf("WeatherAlertsHomeContract.css");
  const accentIndex = alertsRoute.indexOf("WeatherAlertsAccentContract.css");

  assert.ok(baseIndex >= 0);
  assert.ok(accentIndex > baseIndex);
  assert.doesNotMatch(alertsBase, /radial-gradient|linear-gradient/);
  assert.match(alertsAccent, /--alerts-accent/);
  assert.match(alertsAccent, /alerts-editorial-hero-potential/);
  assert.match(alertsAccent, /alerts-editorial-hero-danger/);
  assert.match(alertsAccent, /alerts-editorial-hero-great-danger/);
  assert.match(alertsAccent, /radial-gradient/);
  assert.match(alertsAccent, /linear-gradient/);
  assert.match(alertsAccent, /min-height:\s*44px/);
  assert.doesNotMatch(alertsAccent, /!important/);
});

test("flood history uses documentary color without presenting historical numbers as live state", () => {
  assert.match(floodRoute, /Flood2024HomeContract\.css/);
  assert.match(floodAccent, /registro histórico com acento hidrológico documental/i);
  assert.match(floodAccent, /\.tp-flood-hero[\s\S]*radial-gradient/);
  assert.match(floodAccent, /\.tp-flood-hero__summary > div:nth-child\(1\)/);
  assert.match(floodAccent, /\.tp-flood-path__step:nth-child\(3\)/);
  assert.match(floodAccent, /min-height:\s*44px/);
  assert.doesNotMatch(floodAccent, /!important/);
});

test("regional directory keeps its base neutral and loads geographic accents separately", () => {
  assert.match(regionalRoute, /RegionalCitiesAccentContract\.css/);
  assert.doesNotMatch(regionalBase, /radial-gradient|linear-gradient/);
  assert.match(regionalAccent, /Central regional — acento geográfico/);
  assert.match(regionalAccent, /> section:first-child[\s\S]*radial-gradient/);
  assert.match(regionalAccent, /article:nth-child\(1\)[\s\S]*#18bdcd/);
  assert.match(regionalAccent, /article:nth-child\(2\)[\s\S]*#5e2ced/);
  assert.match(regionalAccent, /article:nth-child\(3\)[\s\S]*#e70b85/);
  assert.match(regionalAccent, /article:nth-child\(4\)[\s\S]*#f27035/);
  assert.match(regionalAccent, /min-height:\s*44px/);
  assert.doesNotMatch(regionalAccent, /!important/);
});
