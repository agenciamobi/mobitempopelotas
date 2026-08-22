import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/RainRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/RainRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/RainForecastPageV2.css", "utf8");
const hourlyVolumeStyles = readFileSync(
  "src/components/weather/RainHourlyVolumeContext.css",
  "utf8",
);
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

test("rain route uses the shared shell with a dedicated retail hero", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /RainRetailHero/);
  assert.match(route, /RainForecastPageV2/);
  assert.match(route, /pageClassName="internal-weather-shell--rain"/);
  assert.match(route, /hero=\{\(\{ weather: productionWeather, advisoryLevel, officialAlertCount \}\)/);
  assert.match(route, /Veja a chance de chuva em Pelotas/);
  assert.match(route, /RAIN_PAGE_CONTENT/);
  assert.match(route, /Como ler chance e volume de chuva em Pelotas/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, RAIN_PAGE_CONTENT\.faqs\)/);
  assert.doesNotMatch(route, /RainPage/);
  assert.doesNotMatch(route, /showOfficialAlerts=\{false\}/);
});

test("rain hero separates chance, volume and timing in direct language", () => {
  assert.match(hero, /Chuva em Pelotas/);
  assert.match(hero, /chance por horário e volume previsto/);
  assert.match(hero, /Maior chance nas próximas 12 horas/);
  assert.match(hero, /Volume previsto hoje/);
  assert.match(hero, /Total previsto em 7 dias/);
  assert.match(hero, /Horários com 30% ou mais/);
  assert.match(hero, /Maior chance nas próximas horas/);
  assert.match(hero, /Dia com maior volume/);
  assert.match(hero, /Rajada em período com chuva/);
  assert.match(hero, /Fonte da previsão/);
  assert.match(hero, /timeReference/);
  assert.match(hero, /alertLabel/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /organizada por horário/);
  assert.doesNotMatch(hero, /aviso\(s\) oficial\(is\)/);
  assert.doesNotMatch(hero, /Dia mais chuvoso/);
});

test("rain zero-volume state does not invent a rainiest day", () => {
  assert.match(hero, /hasPositiveRainVolume/);
  assert.match(hero, /Sem volume previsto/);
  assert.match(page, /hasPositiveRainVolume/);
  assert.match(page, /Sem volume previsto/);
});

test("rain zero-chance state keeps zero percent without inventing a peak hour", () => {
  assert.match(hero, /const highestRainChance = peakCandidate\?\.precipitation \?\? null/);
  assert.match(hero, /const hasPositiveRainChance = \(highestRainChance \?\? 0\) > 0/);
  assert.match(hero, /Sem chance de chuva destacada nas próximas 12 horas/);
  assert.match(hero, /Sem horário de destaque/);
  assert.match(hero, /formatChance\(highestRainChance\)/);
});

test("rain page keeps unknown probability separate from a published zero", () => {
  assert.match(page, /const knownChanceHours = hours\.filter\(\(hour\) => hour\.precipitationProbability !== null\)/);
  assert.match(page, /const highestRainChance = peakCandidate\?\.precipitationProbability \?\? null/);
  assert.match(page, /const hasPositiveRainChance = \(highestRainChance \?\? 0\) > 0/);
  assert.match(page, /Chance ainda não informada/);
  assert.match(page, /Sem horário de destaque/);
  assert.match(page, /A chance de chuva por horário ainda não foi informada/);
  assert.match(page, /Não há chance de chuva de 40% ou mais nas próximas 12 horas/);
});

test("rain planning only highlights windows when there is real contrast", () => {
  assert.match(page, /const bestCandidates = windows\.filter\(\(window\) => window\.averageChance !== null\)/);
  assert.match(page, /const hasBestContrast = bestKeys\.size > 1/);
  assert.match(page, /const bestWindow = hasBestContrast \? bestCandidate : null/);
  assert.match(page, /const hasAttentionContrast =/);
  assert.match(page, /Math\.max\(\.\.\.attentionChances\) > Math\.min\(\.\.\.attentionChances\)/);
  assert.match(page, /const attentionWindow = hasAttentionContrast \? attentionCandidate : null/);
  assert.match(page, /Sem período de destaque/);
  assert.match(page, /As janelas têm valores semelhantes nesta atualização/);
  assert.match(page, /className=\{bestWindow \? "is-best" : undefined\}/);
  assert.match(page, /className=\{attentionWindow \? "is-attention" : undefined\}/);
});

test("rain page answers when, how much and which period in direct language", () => {
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /buildWindows/);
  assert.match(page, /Chuva em resumo/);
  assert.match(page, /Chance de chuva nas próximas 12 horas/);
  assert.match(page, /Chance e volume de chuva em cada dia/);
  assert.match(page, /Quais períodos têm menor e maior chance de chuva/);
  assert.match(page, /O que o INMET publica sobre chuva em Pelotas/);
  assert.match(page, /Período com menor chance/);
  assert.match(page, /Período com maior chance/);
  assert.match(page, /A chance mostra a possibilidade de chover/);
  assert.match(page, /Nenhum aviso de chuva ativo/);
  assert.match(page, /A previsão oficial ainda não menciona chuva/);
  assert.match(page, /Dias com previsão de chuva/);
  assert.match(page, /Nenhum valor foi estimado manualmente/);
  assert.doesNotMatch(page, /A próxima janela relevante/);
  assert.doesNotMatch(page, /Transforme a previsão em decisões simples/);
  assert.doesNotMatch(page, /ativo\(s\)/);
  assert.doesNotMatch(page, /período\(s\)/);
  assert.doesNotMatch(page, /Nenhum valor demonstrativo foi inserido/);
  assert.doesNotMatch(page, /janela com menor chance/);
  assert.doesNotMatch(page, /fonte principal/i);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /PageHeader/);
  assert.doesNotMatch(page, /QualitySummary/);
});

test("rain experience uses the exact header rail", () => {
  assert.match(
    shellStyles,
    /\.internal-weather-shell--rain \.rain-retail-hero__inner[\s\S]*max-width:\s*var\(--internal-weather-frame-max\)/,
  );
  assert.match(
    shellStyles,
    /\.internal-weather-shell--rain \.rain-v2-page,[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.match(heroStyles, /max-width:\s*var\(--internal-weather-frame-max\)/);
});

test("hourly rain volume uses Home surfaces while keeping functional precipitation bars", () => {
  assert.match(hourlyVolumeStyles, /\.internal-weather-shell--rain \.rain-hourly-volume-context \{/);
  assert.match(hourlyVolumeStyles, /background:\s*#fff/);
  assert.match(hourlyVolumeStyles, /\.rain-hourly-volume-context__summary article[\s\S]*background:\s*#fbfcfc/);
  assert.match(hourlyVolumeStyles, /\.rain-hourly-volume-context__timeline article[\s\S]*background:\s*#fbfcfc/);
  assert.match(hourlyVolumeStyles, /box-shadow:\s*none/);
  assert.doesNotMatch(hourlyVolumeStyles, /radial-gradient/);
  assert.match(hourlyVolumeStyles, /gradiente abaixo é funcional/);
  assert.match(hourlyVolumeStyles, /linear-gradient\(90deg, #18bdcd, #5e2ced\)/);
  assert.match(hourlyVolumeStyles, /repeating-linear-gradient/);
});

test("rain typography remains readable and responsive", () => {
  assert.match(pageStyles, /font-size:\s*clamp\(0\.75rem/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /@media \(max-width: 980px\)/);
  assert.match(pageStyles, /@media \(max-width: 760px\)/);
  assert.match(pageStyles, /@media \(max-width: 520px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /:focus-visible/);
});
