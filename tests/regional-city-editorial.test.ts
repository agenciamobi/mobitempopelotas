import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { regionalWeatherIcon } from "../src/components/regional/regional-weather-presentation.ts";

const pageSource = readFileSync(
  new URL("../src/components/regional/RegionalCityWeatherPage.tsx", import.meta.url),
  "utf8",
);
const adapterSource = readFileSync(
  new URL("../src/components/regional/regional-city-forecast-story.ts", import.meta.url),
  "utf8",
);
const forecastStorySource = readFileSync(
  new URL("../src/components/weather/HomeForecastStory.tsx", import.meta.url),
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
const identityCss = readFileSync(
  new URL("../src/components/regional/RegionalCityIdentity.css", import.meta.url),
  "utf8",
);

test("páginas regionais usam o main semântico fornecido pelo layout global", () => {
  assert.doesNotMatch(pageSource, /<main\b/);
  assert.match(pageSource, /<div className=\{`\$\{styles\.page\} regional-city-page`\}>/);
});

test("páginas regionais reutilizam os componentes aprovados das páginas internas", () => {
  assert.match(pageSource, /<InternalPageChapters/);
  assert.match(pageSource, /<HomeForecastStory/);
  assert.match(pageSource, /internal-forecast-widget regional-city-shared-forecast/);
  assert.doesNotMatch(pageSource, /<RegionalCityHourlySection/);
  assert.doesNotMatch(pageSource, /regional-city-summary/);
  assert.doesNotMatch(pageSource, /regional-city-forecast/);
});

test("navegação regional usa os mesmos capítulos da previsão de hoje", () => {
  for (const anchor of [
    "#avisos-municipais",
    "#previsao-hoje",
    "#tendencia",
    "#como-interpretar-previsao-regional",
    "#cidades-proximas",
  ]) {
    assert.match(pageSource, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(pageSource, /label=\{`Navegação da previsão para \$\{city\.name\}`\}/);
});

test("aviso municipal segue o mesmo contrato visual do painel INMET interno", () => {
  assert.match(pageSource, /home-inmet-alerts/);
  assert.match(pageSource, /home-inmet-alerts__main/);
  assert.match(pageSource, /home-inmet-alerts__mark/);
  assert.match(pageSource, /home-inmet-alerts__meta/);
  assert.match(pageSource, /home-inmet-alerts__aside/);
});

test("previsão regional é adaptada sem duplicar a grade meteorológica", () => {
  assert.match(adapterSource, /ForecastStoryData/);
  assert.match(adapterSource, /formatRegionalHour\(hour\.time\)/);
  assert.match(adapterSource, /regionalWeatherIcon\(hour\.condition, hour\.time\)/);
  assert.match(forecastStorySource, /context\?: "home" \| "today-page" \| "regional-page"/);
  assert.match(forecastStorySource, /locationName\?: string/);
  assert.match(forecastStorySource, /hour\.precipitationMm/);
});

test("tema regional preserva frame e aplica o sistema interno compartilhado", () => {
  assert.match(editorialCss, /--regional-frame-max:\s*var\(--portal-frame-max, 1760px\)/);
  assert.match(editorialCss, /--regional-gutter:\s*var\(--portal-content-gutter/);
  assert.match(editorialCss, /\.regional-city-page \.regional-city-hero/);
  assert.match(cascadeCss, /section\.regional-city-hero/);
  assert.match(identityCss, /\.regional-city-page > \.internal-page-chapters/);
  assert.match(identityCss, /\.regional-city-page > \.regional-city-shared-forecast/);
  assert.match(identityCss, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
});

test("apresentação meteorológica diferencia condição e período do dia", () => {
  assert.equal(regionalWeatherIcon("Céu limpo", "2026-07-29T14:00"), "sun");
  assert.equal(regionalWeatherIcon("Céu limpo", "2026-07-29T22:00"), "moon");
  assert.equal(regionalWeatherIcon("Parcialmente nublado", "2026-07-29T10:00"), "partly-cloudy");
  assert.equal(
    regionalWeatherIcon("Parcialmente nublado", "2026-07-29T23:00"),
    "partly-cloudy-night",
  );
  assert.equal(regionalWeatherIcon("Chuva"), "rain");
  assert.equal(regionalWeatherIcon("Temporal"), "storm");
  assert.equal(regionalWeatherIcon("Neblina"), "cloud");
});
