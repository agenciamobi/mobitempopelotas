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
const cppmetPage = readFileSync("src/components/blog/CppmetNewsPage.tsx", "utf8");
const cppmetBase = readFileSync("src/components/blog/CppmetNewsPage.css", "utf8");
const cppmetAccent = readFileSync(
  "src/components/blog/CppmetNewsAccentContract.css",
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

test("CPPMet keeps the feed layout neutral and adds color only as an editorial accent", () => {
  const baseIndex = cppmetPage.indexOf("CppmetNewsPage.css");
  const accentIndex = cppmetPage.indexOf("CppmetNewsAccentContract.css");

  assert.ok(baseIndex >= 0);
  assert.ok(accentIndex > baseIndex);
  assert.doesNotMatch(cppmetBase, /radial-gradient|linear-gradient/);
  assert.match(cppmetAccent, /CPPMet \/ UFPel — acento jornalístico/);
  assert.match(cppmetAccent, /\.cppmet-blog__hero[\s\S]*radial-gradient/);
  assert.match(cppmetAccent, /\.cppmet-blog__card--featured/);
  assert.match(cppmetAccent, /linear-gradient\(90deg, #18bdcd, #315f70\)/);
  assert.match(cppmetAccent, /min-height:\s*44px/);
  assert.doesNotMatch(cppmetAccent, /!important/);
});
