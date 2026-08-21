import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { regionalWeatherIcon } from "../src/components/regional/regional-weather-presentation.ts";

const pageSource = readFileSync(
  new URL("../src/components/regional/RegionalCityWeatherPage.tsx", import.meta.url),
  "utf8",
);
const heroSource = readFileSync(
  new URL("../src/components/regional/RegionalCityHero.tsx", import.meta.url),
  "utf8",
);
const heroCss = readFileSync(
  new URL("../src/components/regional/RegionalCityHero.css", import.meta.url),
  "utf8",
);
const splitHeroSource = readFileSync(
  new URL("../src/components/weather/WeatherSplitHero.tsx", import.meta.url),
  "utf8",
);
const splitHeroCss = readFileSync(
  new URL("../src/components/weather/WeatherSplitHero.css", import.meta.url),
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
const pageCss = readFileSync(
  new URL("../src/components/regional/RegionalCityWeatherPage.module.css", import.meta.url),
  "utf8",
);
const identityCss = readFileSync(
  new URL("../src/components/regional/RegionalCityIdentity.css", import.meta.url),
  "utf8",
);
const accentCss = readFileSync(
  new URL("../src/components/regional/RegionalCityAccentContract.css", import.meta.url),
  "utf8",
);

test("páginas regionais usam o main semântico fornecido pelo layout global", () => {
  assert.doesNotMatch(pageSource, /<main\b/);
  assert.match(pageSource, /<div className=\{`\$\{styles\.page\} regional-city-page`\}>/);
});

test("páginas regionais reutilizam os componentes aprovados das páginas internas", () => {
  assert.match(heroSource, /<WeatherSplitHero/);
  assert.match(pageSource, /<InternalPageChapters/);
  assert.match(pageSource, /<HomeForecastStory/);
  assert.match(pageSource, /internal-forecast-widget regional-city-shared-forecast/);
  assert.doesNotMatch(pageSource, /<RegionalCityHourlySection/);
  assert.doesNotMatch(pageSource, /regional-city-summary/);
  assert.doesNotMatch(pageSource, /className="regional-city-forecast"/);
});

test("primeira dobra regional segue a composição dividida da página de vento", () => {
  assert.match(heroSource, /title={`Como o tempo deve mudar em \$\{city\.name\}\.\`}/);
  assert.match(heroSource, /currentLabel="Temperatura agora"/);
  assert.match(heroSource, /highlightLabel="Maior chance de chuva nas próximas 24h"/);
  assert.match(heroSource, /label: "Faixa prevista hoje"/);
  assert.match(heroSource, /label: "Rajada mais forte"/);
  assert.match(heroSource, /href="#previsao-hoje"/);
  assert.match(heroSource, /href="#avisos-municipais"/);
  assert.match(splitHeroSource, /weather-split-hero__copy/);
  assert.match(splitHeroSource, /weather-split-hero__card/);
  assert.match(splitHeroSource, /weather-split-hero__highlight/);
  assert.match(splitHeroCss, /grid-template-columns: minmax\(0, 1\.08fr\) minmax\(390px, 0\.92fr\)/);
  assert.match(splitHeroCss, /linear-gradient\(145deg, #102437, #18334f 58%, #25375c\)/);
  assert.match(splitHeroCss, /@media \(max-width: 980px\)/);
  assert.match(heroCss, /\.regional-city-split-hero/);
});

test("camada local regional clareia o hero sem alterar WeatherSplitHero compartilhado", () => {
  const identityIndex = pageSource.indexOf("RegionalCityIdentity.css");
  const accentIndex = pageSource.indexOf("RegionalCityAccentContract.css");
  assert.ok(identityIndex >= 0);
  assert.ok(accentIndex > identityIndex);
  assert.match(accentCss, /\.regional-city-page \.regional-city-split-hero/);
  assert.match(accentCss, /\.weather-split-hero__copy[\s\S]*radial-gradient/);
  assert.match(accentCss, /\.weather-split-hero__copy h1[\s\S]*color:\s*#071e2f/);
  assert.match(accentCss, /\.weather-split-hero__card\.is-elevated/);
  assert.match(accentCss, /\.weather-split-hero__card\.is-strong/);
  assert.match(accentCss, /\.weather-split-hero__card\.is-unknown/);
  assert.match(accentCss, /\.internal-page-chapters[\s\S]*box-shadow:\s*none/);
  assert.match(accentCss, /min-height:\s*44px/);
  assert.doesNotMatch(accentCss, /!important/);
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

test("tema regional preserva o frame e contém apenas os estilos ativos", () => {
  assert.match(pageCss, /\.page \{[\s\S]*width: 100%/);
  assert.match(pageCss, /\.context/);
  assert.match(pageCss, /\.related/);
  assert.match(pageCss, /\.sources/);
  assert.doesNotMatch(pageCss, /\.forecastGrid/);
  assert.doesNotMatch(pageCss, /\.nowCard/);
  assert.match(heroCss, /width: min\(calc\(100% - var\(--regional-frame-gap\)\), var\(--regional-frame-max\)\)/);
  assert.match(identityCss, /\.regional-city-page > \.internal-page-chapters/);
  assert.match(identityCss, /\.regional-city-page > \.regional-city-shared-forecast/);
  assert.match(identityCss, /section\.regional-city-official-alert/);
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
