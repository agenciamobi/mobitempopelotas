import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const alertsPage = readFileSync("src/components/weather/WeatherAlertsPage.tsx", "utf8");
const map = readFileSync("src/components/weather/AlertMunicipalityMap.tsx", "utf8");
const styles = readFileSync("src/components/weather/WeatherAlertsFeature.css", "utf8");

test("highest priority alert receives a dedicated severe-weather presentation", () => {
  assert.match(alertsPage, /const featured = active\[0\] \?\? upcoming\[0\]/);
  assert.match(alertsPage, /Alerta amarelo/);
  assert.match(alertsPage, /Alerta laranja/);
  assert.match(alertsPage, /Alerta vermelho/);
  assert.match(alertsPage, /Ações recomendadas pelo INMET/);
  assert.match(alertsPage, /SpecialAnnouncement/);
});

test("featured alert map identifies Pelotas without claiming an unavailable polygon", () => {
  assert.match(map, /const PELOTAS/);
  assert.match(map, /type: "Point"/);
  assert.match(map, /Pelotas incluída/);
  assert.doesNotMatch(map, /type: "Polygon"/);
  assert.match(map, /cooperativeGestures: true/);
});

test("featured alert remains responsive", () => {
  assert.match(styles, /grid-template-columns:\s*minmax\(0, 1\.05fr\)/);
  assert.match(styles, /@media \(max-width:\s*980px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(styles, /@media \(max-width:\s*620px\)/);
});
