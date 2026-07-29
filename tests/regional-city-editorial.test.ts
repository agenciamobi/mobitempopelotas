import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../src/components/regional/RegionalCityWeatherPage.tsx", import.meta.url),
  "utf8",
);
const editorialCss = readFileSync(
  new URL("../src/components/regional/RegionalCityEditorial.css", import.meta.url),
  "utf8",
);
const cascadeCss = readFileSync(
  new URL("../src/components/regional/RegionalCityCascadeFix.css", import.meta.url),
  "utf8",
);

test("páginas regionais usam o main semântico fornecido pelo layout global", () => {
  assert.doesNotMatch(pageSource, /<main\b/);
  assert.match(pageSource, /<div className=\{`\$\{styles\.page\} regional-city-page`\}>/);
});

test("páginas regionais oferecem navegação editorial por capítulos", () => {
  for (const anchor of [
    "#avisos-municipais",
    "#previsao-horaria-regional",
    "#previsao-7-dias-regional",
    "#como-interpretar-previsao-regional",
    "#cidades-proximas",
  ]) {
    assert.match(pageSource, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(pageSource, /regional-city-section-nav/);
});

test("tema regional compartilha frame, gutters e primeira dobra das páginas editoriais", () => {
  assert.match(editorialCss, /--regional-frame-max:\s*var\(--portal-frame-max, 1760px\)/);
  assert.match(editorialCss, /--regional-gutter:\s*var\(--portal-content-gutter/);
  assert.match(editorialCss, /\.regional-city-page \.regional-city-hero/);
  assert.match(editorialCss, /regional-city-section-nav__links/);
  assert.match(cascadeCss, /section\.regional-city-hero/);
  assert.match(cascadeCss, /section#previsao-horaria-regional/);
});
