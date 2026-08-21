import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/TomorrowRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/TomorrowRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/TomorrowForecastPageV3.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/TomorrowForecastPageV3.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");
const photoMap = readFileSync(
  "src/components/weather/today-retail-hero-backgrounds.ts",
  "utf8",
);

test("tomorrow route uses the shared shell with a dedicated retail hero", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /TomorrowRetailHero/);
  assert.match(route, /TomorrowForecastPageV3/);
  assert.match(route, /pageClassName="internal-weather-shell--tomorrow"/);
  assert.match(route, /hero=\{\(\{ weather: productionWeather, advisoryLevel, officialAlertCount \}\)/);
  assert.match(route, /Veja o tempo amanhã em Pelotas/);
  assert.doesNotMatch(route, /TomorrowForecastPageV2/);
  assert.doesNotMatch(route, /showOfficialAlerts=\{false\}/);
});

test("tomorrow hero uses a useful search-oriented headline and concise metrics", () => {
  assert.match(hero, /weather\.daily\[1\]/);
  assert.match(hero, /weather\.daily\[0\]/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /Tempo amanhã em Pelotas/);
  assert.match(hero, /temperatura, chuva e vento/);
  assert.doesNotMatch(hero, /organizado para você planejar/);
  assert.match(hero, /Mínima prevista/);
  assert.match(hero, /Chance de chuva/);
  assert.match(hero, /Rajada máxima/);
  assert.match(hero, /metric\.detail \? <em>\{metric\.detail\}<\/em> : null/);
  assert.match(hero, /Volume de chuva/);
  assert.match(hero, /Fonte da previsão/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /today-retail-hero__photo-credit/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /menor temperatura/);
  assert.doesNotMatch(hero, /maior chance prevista/);
  assert.doesNotMatch(hero, /weather\.current\.temperature/);
});

test("tomorrow hero formats the calendar badge from the ISO identity", () => {
  assert.match(hero, /day\.dateIso/);
  assert.match(hero, /new Date\(`\$\{day\.dateIso\}T12:00:00-03:00`\)/);
  assert.doesNotMatch(hero, /day\.date\.slice\(0, 10\)/);
});

test("retail photography is shared without breaking the today export", () => {
  assert.match(photoMap, /getRetailWeatherPhoto/);
  assert.match(photoMap, /getTodayRetailHeroPhoto = getRetailWeatherPhoto/);
  assert.match(photoMap, /Amanhecer_na_Praia_do_Laranjal/);
  assert.match(photoMap, /Sunset_over_Calm_Lake/);
  assert.match(photoMap, /Heavy_Rain/);
});

test("tomorrow content answers planning questions in direct language", () => {
  assert.match(page, /weather\.daily\[1\]/);
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Amanhã em resumo/);
  assert.match(page, /Compare com hoje/);
  assert.match(page, /Como o tempo de amanhã deve mudar em relação a hoje/);
  assert.match(page, /Como se preparar para o tempo de amanhã/);
  assert.match(page, /Hoje à noite e amanhã cedo/);
  assert.match(page, /O que INMET e CPPMet\/UFPel publicam para amanhã/);
  assert.match(page, /Dúvidas sobre o tempo de amanhã em Pelotas/);
  assert.match(page, /dayWeatherSummary/);
  assert.match(page, /formatPercentDelta/);
  assert.match(page, /Confira antes de sair/);
  assert.match(page, /Outras previsões disponíveis/);
  assert.doesNotMatch(page, /p\.p\./);
  assert.doesNotMatch(page, /Transforme a previsão em decisões simples/);
  assert.doesNotMatch(page, /novas rodadas/);
  assert.doesNotMatch(page, /contexto complementar/);
  assert.doesNotMatch(page, /não publicaram contexto/);
});

test("tomorrow content matches official sources by stable ISO date", () => {
  assert.match(page, /localForecastDateKey/);
  assert.match(page, /day\.dateIso \?\? localForecastDateKey/);
  assert.match(page, /tomorrow\.dateIso \?\? localForecastDateKey\(1\)/);
  assert.match(page, /period\.date\?\.slice\(0, 10\) === tomorrowDate/);
  assert.doesNotMatch(page, /tomorrow\.date\.slice\(0, 10\)/);
  assert.doesNotMatch(page, /day\.date\.slice\(0, 10\)/);
});

test("tomorrow content remains comparative and source-aware", () => {
  assert.match(page, /buildPlanningCards/);
  assert.match(page, /forecastWeekdayKey/);
  assert.match(page, /CPPMet \/ UFPel/);
  assert.match(page, /INMET · \{period\.period\}/);
  assert.match(page, /FAQPage/);
  assert.match(page, /Nenhum valor foi estimado manualmente/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /daily-hero/);
  assert.doesNotMatch(page, /daily-condition-card/);
});

test("tomorrow sections use the exact header rail", () => {
  assert.match(
    shellStyles,
    /\.internal-weather-shell--tomorrow \.tomorrow-retail-hero__inner[\s\S]*max-width:\s*var\(--internal-weather-frame-max\)/,
  );
  assert.match(
    shellStyles,
    /\.internal-weather-shell--tomorrow \.tomorrow-v3-page,[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.match(shellStyles, /padding-right:\s*var\(--internal-weather-frame-gutter\)/);
  assert.match(shellStyles, /padding-left:\s*var\(--internal-weather-frame-gutter\)/);
});

test("tomorrow visual system remains responsive and accessible", () => {
  assert.match(heroStyles, /warmer planning accent/);
  assert.match(heroStyles, /today-retail-hero--attention/);
  assert.match(heroStyles, /today-retail-hero--warning/);
  assert.match(heroStyles, /@media \(max-width: 920px\)/);
  assert.match(heroStyles, /@media \(max-width: 700px\)/);
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /content-visibility:\s*auto/);
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /@media \(max-width: 1120px\)/);
  assert.match(pageStyles, /@media \(max-width: 900px\)/);
  assert.match(pageStyles, /@media \(max-width: 700px\)/);
  assert.match(pageStyles, /@media \(max-width: 460px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /:focus-visible/);
});
