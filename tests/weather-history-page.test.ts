import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/historico-climatico-pelotas.tsx", "utf8");
const page = readFileSync("src/components/history/WeatherHistoryPage.tsx", "utf8");
const chart = readFileSync("src/components/history/WeatherHistoryChart.tsx", "utf8");
const styles = readFileSync("src/components/history/WeatherHistoryRefinement.css", "utf8");

const historySource = `${route}\n${page}\n${chart}`;

test("weather history route uses the shared shell and real history data", () => {
  assert.match(route, /createFileRoute\("\/historico-climatico-pelotas"\)/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /getPelotasWeatherHistory\(\)/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /WeatherHistoryHero/);
  assert.match(route, /WeatherHistoryPage/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, HISTORY_PAGE_CONTENT\.faqs\)/);
});

test("recent profile distinguishes rain, dry days and missing fields", () => {
  assert.match(page, /precipitationDays = days\.filter\(\(day\) => day\.precipitation !== null\)/);
  assert.match(page, /rainyDays: precipitationDays\.filter\(\(day\) => \(day\.precipitation \?\? 0\) >= 1\)\.length/);
  assert.match(page, /dryDays: precipitationDays\.filter\(\(day\) => \(day\.precipitation \?\? 0\) < 0\.1\)\.length/);
  assert.match(page, /windDaysKnown: windDays\.length/);
  assert.match(page, /precipitationDaysKnown: precipitationDays\.length/);
  assert.match(page, /Campos ausentes não são[\s\S]*preenchidos com zero/);
  assert.doesNotMatch(page, /day\.precipitation === null[^\n]{0,80}dryDays/);
});

test("weather history exposes amplitude and data coverage", () => {
  assert.match(page, /day\.temperatureMax - day\.temperatureMin/);
  assert.match(page, /averageAmplitude/);
  assert.match(page, /temperatureSpan/);
  assert.match(page, /Amplitude média diária/);
  assert.match(page, /Faixa térmica total/);
  assert.match(page, /Completude das variáveis do histórico/);
  assert.match(page, /Precipitação/);
  assert.match(page, /Rajadas/);
  assert.match(page, /Amplitude/);
});

test("chart defaults to the full 30-day period and preserves interactive filters", () => {
  assert.match(chart, /useState<HistoryPeriod>\(30\)/);
  assert.match(chart, /\[7, 14, 30\]/);
  assert.match(chart, /Temperatura/);
  assert.match(chart, /Chuva/);
  assert.match(chart, /Rajadas/);
  assert.match(chart, /aria-pressed=\{metric === value\}/);
  assert.match(chart, /aria-pressed=\{period === item\}/);
  assert.match(chart, /setSelectedOffset/);
  assert.match(chart, /Os pontos sem informação permanecem vazios/);
});

test("history copy limits all extremes to the consulted period", () => {
  assert.match(page, /extremos apenas dos dias consultados/);
  assert.match(page, /Não são[\s\S]*recordes históricos oficiais de Pelotas/);
  assert.match(page, /Histórico recente não é normal climatológica/);
  assert.match(page, /não deve ser usado isoladamente para afirmar/);
  assert.match(route, /não representam normais climatológicas nem recordes históricos oficiais/);
  assert.match(route, /Trinta dias são suficientes para definir o clima de Pelotas/);
  assert.doesNotMatch(historySource, /recorde histórico de Pelotas é/i);
});

test("history table remains an accessible audit trail", () => {
  assert.match(page, /<caption>Temperatura, chuva e rajadas/);
  assert.match(page, /<th scope="col">Data<\/th>/);
  assert.match(page, /<th scope="row">/);
  assert.match(page, /Ordem da data mais recente para a mais antiga/);
  assert.match(page, /\[\.\.\.history\.days\]\.reverse\(\)/);
  assert.match(page, /não informado/);
});

test("history refinement follows the current retail layout and accessibility rules", () => {
  assert.match(styles, /internal-weather-shell--history \.history-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /scroll-margin-top:\s*8rem/);
  assert.match(styles, /@media \(max-width: 1180px\)/);
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[0-6][0-9]rem/);
});
