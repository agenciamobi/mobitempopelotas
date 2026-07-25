import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const forecastPages = readFileSync("src/components/weather/ForecastPages.tsx", "utf8");
const todayCss = readFileSync(
  "src/production/styles/internal-today-editorial-v54.css",
  "utf8",
);
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("today forecast exposes an editorial chapter structure", () => {
  assert.match(forecastPages, /forecast-page forecast-page--today/);
  assert.match(forecastPages, /className="forecast-today-navigation"/);
  assert.match(forecastPages, /href="#agora"/);
  assert.match(forecastPages, /href="#medicao-atual"/);
  assert.match(forecastPages, /href="#proximas-horas"/);
  assert.match(forecastPages, /href="#leitura-do-dia"/);
  assert.match(forecastPages, /href="#como-interpretar-hoje"/);
});

test("today observation distinguishes measured condition from the daily model", () => {
  assert.match(forecastPages, /<WeatherIcon name=\{current\.icon\} size=\{68\} \/>/);
  assert.match(forecastPages, /current\.condition \?\? "Condição observada"/);
  assert.match(forecastPages, /className="forecast-today-range-details"/);
  assert.match(forecastPages, /<dt>Chuva<\/dt>/);
  assert.match(forecastPages, /<dt>Acumulado<\/dt>/);
  assert.match(forecastPages, /<dt>Rajada<\/dt>/);
});

test("today page includes accessible hourly, related and transparency navigation", () => {
  assert.match(forecastPages, /aria-label="Previsão horária para hoje"/);
  assert.match(forecastPages, /className="forecast-today-related"/);
  assert.match(forecastPages, /to="\/tempo-amanha-pelotas"/);
  assert.match(forecastPages, /to="\/previsao-7-dias-pelotas"/);
  assert.match(forecastPages, /to="\/radar-e-satelite-pelotas"/);
  assert.match(forecastPages, /<aside className="forecast-source-note"/);
});

test("today editorial CSS is route scoped and follows the current visual system", () => {
  assert.match(todayCss, /data-topic="tempo-hoje-pelotas"/);
  assert.match(todayCss, /\.forecast-today-navigation/);
  assert.match(todayCss, /linear-gradient\(145deg, #061a2a, #082d42 64%, #0b4257\)/);
  assert.match(todayCss, /\.forecast-today-range-details/);
  assert.match(todayCss, /\.forecast-hourly-grid\s*\{[\s\S]*scroll-snap-type:\s*x mandatory/);
  assert.match(todayCss, /\.forecast-guidance[\s\S]*linear-gradient\(142deg, #061a2a/);
  assert.match(todayCss, /\.forecast-today-related/);
  assert.match(todayCss, /\.editorial-answer-facts\s*\{[\s\S]*counter-reset:\s*today-fact/);
});

test("today editorial layer is last in both production style entries", () => {
  const layer = "internal-today-editorial-v54.css";

  assert.match(cssEntry, new RegExp(layer.replace(".", "\\.")));
  assert.match(tsEntry, new RegExp(layer.replace(".", "\\.")));
  assert.ok(cssEntry.indexOf("home-water-semantic-v53.css") < cssEntry.indexOf(layer));
  assert.ok(tsEntry.indexOf("home-water-semantic-v53.css") < tsEntry.indexOf(layer));
});

test("today page remains usable on tablet, mobile and reduced-motion settings", () => {
  assert.match(todayCss, /@media \(max-width: 1120px\)/);
  assert.match(todayCss, /@media \(max-width: 760px\)/);
  assert.match(todayCss, /@media \(max-width: 480px\)/);
  assert.match(todayCss, /@media \(prefers-reduced-motion: reduce\)/);
});
