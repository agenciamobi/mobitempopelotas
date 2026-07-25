import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const tomorrowPage = readFileSync(
  "src/components/weather/TomorrowForecastPage.tsx",
  "utf8",
);
const tomorrowCss = readFileSync(
  "src/production/styles/internal-tomorrow-editorial-v55.css",
  "utf8",
);
const tomorrowFixCss = readFileSync(
  "src/production/styles/internal-tomorrow-editorial-v55-fix.css",
  "utf8",
);
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("tomorrow forecast exposes a planning-oriented chapter structure", () => {
  assert.match(tomorrowPage, /tomorrow-page tomorrow-page--editorial/);
  assert.match(tomorrowPage, /className="tomorrow-navigation"/);
  assert.match(tomorrowPage, /href="#resumo-amanha"/);
  assert.match(tomorrowPage, /href="#indicadores-amanha"/);
  assert.match(tomorrowPage, /href="#planejamento-amanha"/);
  assert.match(tomorrowPage, /href="#perguntas-amanha"/);
  assert.match(tomorrowPage, /href="#proximos-passos-amanha"/);
});

test("tomorrow summary keeps condition and thermal range distinct", () => {
  assert.match(tomorrowPage, /className="tomorrow-temperature-panel"/);
  assert.match(tomorrowPage, /aria-label="Temperaturas previstas para amanhã"/);
  assert.match(tomorrowPage, /<dt>Máxima<\/dt>/);
  assert.match(tomorrowPage, /<dt>Mínima<\/dt>/);
  assert.match(tomorrowPage, /Amplitude de \{amplitude\}°C/);
});

test("tomorrow page includes quality, numbered guidance and transparent sourcing", () => {
  assert.match(tomorrowPage, /tomorrow-quality tomorrow-quality-\$\{weather\.quality\.confidence\}/);
  assert.match(tomorrowPage, /<span>01<\/span>/);
  assert.match(tomorrowPage, /<span>04<\/span>/);
  assert.match(tomorrowPage, /className="tomorrow-section tomorrow-faq"/);
  assert.match(tomorrowPage, /<aside className="tomorrow-source-note"/);
});

test("tomorrow continuity links cover current, week, rain and wind", () => {
  assert.match(tomorrowPage, /to="\/tempo-hoje-pelotas"/);
  assert.match(tomorrowPage, /to="\/previsao-7-dias-pelotas"/);
  assert.match(tomorrowPage, /to="\/chuva-em-pelotas"/);
  assert.match(tomorrowPage, /to="\/vento-em-pelotas"/);
});

test("tomorrow editorial CSS is route scoped and follows the internal visual system", () => {
  assert.match(tomorrowCss, /data-topic="tempo-amanha-pelotas"/);
  assert.match(tomorrowCss, /\.tomorrow-navigation/);
  assert.match(tomorrowCss, /linear-gradient\(145deg, #061a2a, #082d42 64%, #0b4257\)/);
  assert.match(tomorrowCss, /\.tomorrow-temperature-panel/);
  assert.match(tomorrowCss, /\.tomorrow-metrics article::before/);
  assert.match(tomorrowCss, /\.tomorrow-guidance-grid article > span/);
  assert.match(tomorrowCss, /\.tomorrow-faq-list summary::after/);
  assert.doesNotMatch(
    tomorrowCss.match(/\.tomorrow-quality \{[\s\S]*?\n\}/)?.[0] ?? "",
    /backdrop-filter:\s*blur/,
  );
});

test("tomorrow metrics remain a compact continuous strip", () => {
  assert.match(tomorrowFixCss, /\.tomorrow-page--editorial[\s\S]*> \.tomorrow-metrics/);
  assert.match(tomorrowFixCss, /padding:\s*0 !important/);
});

test("tomorrow editorial layers follow today layer in both production entries", () => {
  const todayLayer = "internal-today-editorial-v54.css";
  const tomorrowLayer = "internal-tomorrow-editorial-v55.css";
  const tomorrowFixLayer = "internal-tomorrow-editorial-v55-fix.css";

  assert.match(cssEntry, new RegExp(tomorrowFixLayer.replace(".", "\\.")));
  assert.match(tsEntry, new RegExp(tomorrowFixLayer.replace(".", "\\.")));
  assert.ok(cssEntry.indexOf(todayLayer) < cssEntry.indexOf(tomorrowLayer));
  assert.ok(cssEntry.indexOf(tomorrowLayer) < cssEntry.indexOf(tomorrowFixLayer));
  assert.ok(tsEntry.indexOf(todayLayer) < tsEntry.indexOf(tomorrowLayer));
  assert.ok(tsEntry.indexOf(tomorrowLayer) < tsEntry.indexOf(tomorrowFixLayer));
});

test("tomorrow page remains usable on tablet, mobile and reduced-motion settings", () => {
  assert.match(tomorrowCss, /@media \(max-width: 1120px\)/);
  assert.match(tomorrowCss, /@media \(max-width: 760px\)/);
  assert.match(tomorrowCss, /@media \(max-width: 480px\)/);
  assert.match(tomorrowCss, /@media \(prefers-reduced-motion: reduce\)/);
});
