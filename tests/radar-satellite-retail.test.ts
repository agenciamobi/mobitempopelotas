import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/radar-e-satelite-pelotas.tsx", "utf8");
const page = readFileSync("src/components/redemet/RedemetOverview.tsx", "utf8");
const context = readFileSync("src/components/redemet/RadarForecastContext.tsx", "utf8");
const contextStyles = readFileSync("src/components/redemet/RadarForecastContext.css", "utf8");
const baseStyles = readFileSync("src/components/redemet/RedemetRetail.css", "utf8");
const refinementStyles = readFileSync(
  "src/components/redemet/RedemetRetailRefinement.css",
  "utf8",
);
const styles = `${baseStyles}\n${refinementStyles}\n${contextStyles}`;
const visibleCopy = `${route}\n${page}\n${context}`;

const remValues = [...styles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("radar route uses direct SEO copy and page-specific editorial content", () => {
  assert.match(route, /Radar e satélite em Pelotas/);
  assert.match(route, /horário, sequência de imagens e comparação com a previsão por hora/);
  assert.match(route, /RADAR_PAGE_CONTENT/);
  assert.match(route, /Acompanhe chuva, nuvens e trovoadas na região de Pelotas/);
  assert.match(route, /Como usar a reprodução automática das imagens/);
  assert.match(route, /imagens mostram o passado recente/);
  assert.match(route, /Por que as imagens podem mostrar horários diferentes/);
  assert.match(route, /Os valores ao lado do radar foram medidos pela imagem/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, RADAR_PAGE_CONTENT\.faqs\)/);
  assert.match(route, /className="radar-satellite-page"/);
  assert.match(route, /Sequência de imagens de radar/);
});

test("radar page provides image times and actionable guidance", () => {
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Radar e satélite em Pelotas/);
  assert.match(page, /veja áreas de chuva, nuvens e trovoadas/);
  assert.match(page, /latestObservedAt/);
  assert.match(page, /getFreshness/);
  assert.match(page, /FreshnessBadge/);
  assert.match(page, /SourceSummaryCard/);
  assert.match(page, /Horário e quantidade de imagens/);
  assert.match(page, /Radar regional/);
  assert.match(page, /Satélite REDEMET/);
  assert.match(page, /Satélite INMET/);
  assert.match(page, /Trovoadas/);
  assert.match(page, /Confira o horário/);
  assert.match(page, /Reproduza a sequência/);
  assert.match(page, /Compare as imagens/);
  assert.match(page, /Confira os avisos/);
  assert.doesNotMatch(visibleCopy, /Integração pendente/i);
  assert.doesNotMatch(visibleCopy, /Produto:/i);
  assert.doesNotMatch(visibleCopy, /configuração da integração/i);
  assert.doesNotMatch(visibleCopy, /grade de previsão/i);
});

test("image and storm timelines include playback and recovery controls", () => {
  assert.match(page, /useFramePlayback/);
  assert.match(page, /FRAME_INTERVAL_MS/);
  assert.match(page, /window\.setInterval/);
  assert.match(page, /Reproduzir sequência/);
  assert.match(page, /Pausar sequência/);
  assert.match(page, /Imagem mais recente/);
  assert.match(page, /Abrir imagem/);
  assert.match(page, /aria-pressed=\{playback\.isPlaying\}/);
  assert.match(page, /playback\.showLatest/);
  assert.match(page, /playback\.selectFrame/);
  assert.match(page, /redemet-storm-controls/);
  assert.match(page, /Registrada em \{formatDateTime\(selectedFrame\.observedAt\)\}/);
});

test("radar, satellite and storms remain explicitly distinct", () => {
  assert.match(page, /Radar meteorológico · REDEMET\/DECEA/);
  assert.match(page, /Áreas de chuva na região de Pelotas/);
  assert.match(page, /Nuvens sobre a Região Sul/);
  assert.match(page, /Nuvens no satélite não significam necessariamente chuva/);
  assert.match(page, /Trovoadas registradas no horário selecionado/);
  assert.match(page, /Uma trovoada detectada não é um aviso meteorológico/);
  assert.match(page, /não confirma chuva em um endereço específico/);
  assert.match(page, /As imagens ajudam a acompanhar o tempo, mas não definem o risco sozinhas/);
});

test("latest radar image is compared with the nearest forecast hour", () => {
  assert.match(route, /getWeatherIntelligence/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /<RadarForecastContext radar=\{data\.redemet\.radar\} weather=\{data\.weather\}/);
  assert.match(context, /nearestForecastHour/);
  assert.match(context, /hour\.timestamp/);
  assert.match(context, /difference > 3 \* 60 \* 60 \* 1_000/);
  assert.match(context, /isUsableRedemetObservedAt/);
  assert.match(context, /formatRedemetDateTime/);
  assert.match(context, /redemetFrameDisplayLabel\(frame\)/);
  assert.match(context, /if \(!value \|\| !isUsableRedemetObservedAt\(value\)\) return null/);
  assert.match(context, /O que a previsão mostrava quando esta imagem foi registrada/);
  assert.match(context, /O radar mostra uma imagem observada pela REDEMET/);
  assert.match(context, /não são medidos pelo radar/);
  assert.match(context, /Horário da imagem/);
  assert.match(context, /Horário da previsão/);
  assert.match(context, /Temperatura prevista/);
  assert.match(context, /Chance de chuva/);
  assert.match(context, /Rajada prevista/);
  assert.match(context, /Nuvens baixas/);
  assert.match(context, /Visibilidade prevista/);
  assert.match(context, /O movimento entre imagens anteriores não representa o que acontecerá no futuro/);
});

test("radar retail layout follows the portal rail and keeps controls aligned", () => {
  assert.match(baseStyles, /max-width:\s*var\(--portal-frame-max, 1760px\)/);
  assert.match(baseStyles, /padding:\s*0 var\(--portal-content-gutter/);
  assert.match(refinementStyles, /\.radar-satellite-page > \.editorial-answer-section/);
  assert.match(refinementStyles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(refinementStyles, /\.redemet-layer-card\.is-featured/);
  assert.match(refinementStyles, /grid-template-areas:[\s\S]*"previous timeline next"[\s\S]*"tools tools tools"/);
  assert.match(refinementStyles, /\.redemet-frame-tools/);
  assert.match(refinementStyles, /\.redemet-storm-controls/);
  assert.match(refinementStyles, /content-visibility:\s*auto/);
  assert.match(contextStyles, /\.radar-forecast-context/);
  assert.match(contextStyles, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(contextStyles, /@media \(max-width: 1180px\)/);
  assert.match(contextStyles, /@media \(max-width: 860px\)/);
  assert.match(contextStyles, /@media \(max-width: 700px\)/);
  assert.match(refinementStyles, /@media \(max-width: 1320px\)/);
  assert.match(refinementStyles, /@media \(max-width: 920px\)/);
  assert.match(refinementStyles, /@media \(max-width: 700px\)/);
  assert.match(refinementStyles, /@media \(max-width: 480px\)/);
  assert.match(refinementStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(refinementStyles, /@media \(forced-colors: active\)/);
  assert.match(refinementStyles, /:focus-visible/);
  assert.ok(remValues.every((value) => value >= 0.75), "microtext must remain readable");
});
