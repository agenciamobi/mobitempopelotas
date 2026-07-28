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
  assert.match(route, /Histórico de 30 dias em Pelotas/);
});

test("recent profile distinguishes rain, dry days and missing fields", () => {
  assert.match(page, /precipitationDays = days\.filter\(\(day\) => day\.precipitation !== null\)/);
  assert.match(page, /rainyDays: precipitationDays\.filter\(\(day\) => \(day\.precipitation \?\? 0\) >= 1\)\.length/);
  assert.match(page, /dryDays: precipitationDays\.filter\(\(day\) => \(day\.precipitation \?\? 0\) < 0\.1\)\.length/);
  assert.match(page, /windDaysKnown: windDays\.length/);
  assert.match(page, /precipitationDaysKnown: precipitationDays\.length/);
  assert.match(page, /Informações ausentes não são[\s\S]*substituídas por zero/);
  assert.doesNotMatch(page, /day\.precipitation === null[^\n]{0,80}dryDays/);
});

test("weather history exposes temperature variation and days with information", () => {
  assert.match(page, /day\.temperatureMax - day\.temperatureMin/);
  assert.match(page, /averageAmplitude/);
  assert.match(page, /temperatureSpan/);
  assert.match(page, /Variação média diária/);
  assert.match(page, /Faixa de temperaturas/);
  assert.match(page, /Dias com cada informação disponível/);
  assert.match(page, /Chuva/);
  assert.match(page, /Rajadas/);
  assert.match(page, /Variação/);
  assert.doesNotMatch(page, /Completude das variáveis/i);
  assert.doesNotMatch(page, /Faixa térmica total/i);
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

test("history copy limits all extremes to the displayed period", () => {
  assert.match(page, /maiores ou menores valores apenas entre os dias consultados/);
  assert.match(page, /Não são recordes[\s\S]*históricos oficiais de Pelotas/);
  assert.match(page, /Trinta dias não representam o clima normal/);
  assert.match(page, /não deve ser usado sozinho para afirmar/);
  assert.match(route, /não representam o clima normal nem recordes históricos oficiais/);
  assert.match(route, /Trinta dias são suficientes para definir o clima de Pelotas/);
  assert.doesNotMatch(historySource, /recorde histórico de Pelotas é/i);
  assert.doesNotMatch(historySource, /ponto de grade/i);
  assert.doesNotMatch(historySource, /uma contingência pode fornecer/i);
});

test("history table remains an accessible daily reference", () => {
  assert.match(page, /<caption>Temperatura, chuva e rajadas/);
  assert.match(page, /<th scope="col">Data<\/th>/);
  assert.match(page, /<th scope="col">Variação<\/th>/);
  assert.match(page, /<th scope="row">/);
  assert.match(page, /Da data mais recente para a mais antiga/);
  assert.match(page, /\[\.\.\.history\.days\]\.reverse\(\)/);
  assert.match(page, /não informado/);
  assert.match(page, /Abrir dados originais/);
  assert.match(page, /Como os dados funcionam/);
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
