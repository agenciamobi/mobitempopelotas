import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/SevenDayRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/SevenDayRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/SevenDayForecastPageV2.tsx", "utf8");
const pageStyles = readFileSync("src/components/weather/SevenDayForecastPageV2.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

const remValues = [...pageStyles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("seven day route uses the retail shell with a dedicated hero", () => {
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /SevenDayRetailHero/);
  assert.match(route, /SevenDayForecastPageV2/);
  assert.match(route, /pageClassName="internal-weather-shell--seven-day"/);
  assert.match(route, /hero=\{\(\{ weather: productionWeather, advisoryLevel, officialAlertCount \}\)/);
  assert.match(route, /Veja a previsão de 7 dias para Pelotas/);
  assert.match(route, /SEVEN_DAY_PAGE_CONTENT/);
  assert.match(route, /Como interpretar a previsão dos próximos 7 dias/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, SEVEN_DAY_PAGE_CONTENT\.faqs\)/);
  assert.doesNotMatch(route, /SevenDayForecastPage\s/);
  assert.doesNotMatch(route, /components\/weather\/ForecastPages/);
});

test("weekly hero uses a useful search-oriented headline and clear metrics", () => {
  assert.match(hero, /weather\.daily\.slice\(0, 7\)/);
  assert.match(hero, /getRetailWeatherPhoto/);
  assert.match(hero, /Previsão de 7 dias para Pelotas/);
  assert.match(hero, /chance e volume de chuva e rajadas previstos/);
  assert.match(hero, /Menor mínima/);
  assert.match(hero, /Maior chance de chuva/);
  assert.match(hero, /Rajada mais forte/);
  assert.match(hero, /Faixa de temperatura dos próximos 7 dias/);
  assert.match(hero, /Maior volume de chuva/);
  assert.match(hero, /Fonte da previsão/);
  assert.match(hero, /today-retail-hero__current-photo/);
  assert.match(hero, /today-retail-hero__photo-credit/);
  assert.match(hero, /<h1/);
  assert.doesNotMatch(hero, /Sua semana em Pelotas/);
  assert.doesNotMatch(hero, /organizada para planejar/);
  assert.doesNotMatch(hero, /como cenário de maior destaque/);
  assert.doesNotMatch(hero, /weather\.current\.temperature/);
});

test("weekly empty and zero states do not invent weather highlights", () => {
  assert.match(hero, /const hasDailyForecast = days\.length > 0/);
  assert.match(hero, /Previsão semanal em atualização/);
  assert.match(hero, /Dados da semana em atualização/);
  assert.match(hero, /const hasPositiveRainVolume =/);
  assert.match(hero, /Sem volume previsto/);
  assert.match(hero, /const rainChanceDays = days\.filter/);
  assert.match(hero, /const gustDays = days\.filter/);
  assert.match(hero, /Sem rajadas/);
  assert.match(page, /const hasRiskContrast = maximumRisk > minimumRisk/);
  assert.match(page, /\.filter\(hasPositiveRain\)/);
  assert.match(page, /\.filter\(hasPositiveGust\)/);
  assert.match(page, /Não há valores positivos de chance ou volume de chuva nesta atualização/);
  assert.match(page, /Não há rajadas positivas previstas para os próximos dias/);
  assert.match(page, /Sem rajada prevista/);
});

test("weekly stable labels are absolute and temperature ties are explicit", () => {
  assert.match(page, /if \(tone === "attention"\) return "Vale acompanhar"/);
  assert.match(page, /return "Sem destaque"/);
  assert.doesNotMatch(page, /return "Menores valores"/);
  assert.match(page, /const warmestDays = days\.filter\(\(day\) => day\.max === maximum\)/);
  assert.match(page, /const coldestDays = days\.filter\(\(day\) => day\.min === minimum\)/);
  assert.match(page, /empate em \$\{warmestDays\.length\} dias/);
  assert.match(page, /empate em \$\{coldestDays\.length\} dias/);
});

test("weekly headline can prioritize a large temperature range without inventing rain or gusts", () => {
  const temperatureHeadlineIndex = page.indexOf('if (maximum - minimum >= 14) return "A temperatura deve variar bastante ao longo da semana"');
  const noRiskIndex = page.indexOf('if (!hasPositiveRiskSignal)');
  assert.ok(temperatureHeadlineIndex >= 0);
  assert.ok(noRiskIndex > temperatureHeadlineIndex);
});

test("weekly risk colors only appear when the published values create a real contrast", () => {
  assert.match(page, /className=\{hasRiskContrast \? "is-best" : undefined\}/);
  assert.match(page, /className=\{hasRiskContrast \? "is-attention" : undefined\}/);
  assert.match(page, /hasPositiveRisk[\s\S]*Não há valores positivos de chuva ou rajadas publicados/);
  assert.match(page, /Sem um único dia/);
});

test("weekly page answers comparison and planning questions in direct language", () => {
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Resumo da semana/);
  assert.match(page, /Dia a dia/);
  assert.match(page, /Temperatura, chuva e rajadas em cada dia/);
  assert.match(page, /Mínimas e máximas ao longo dos próximos 7 dias/);
  assert.match(page, /Dias com maior chance de chuva e rajadas mais fortes/);
  assert.match(page, /O que INMET e CPPMet\/UFPel publicam para os próximos dias/);
  assert.match(page, /Menor chance de chuva e rajadas/);
  assert.match(page, /Mais chuva ou rajadas/);
  assert.match(page, /attentionDay/);
  assert.match(page, /rainSummary/);
  assert.match(page, /gustSummary/);
  assert.match(page, /riskScore/);
  assert.match(page, /rainRanking/);
  assert.match(page, /windRanking/);
  assert.match(page, /--week-low/);
  assert.match(page, /Nenhum valor foi estimado manualmente/);
  assert.doesNotMatch(page, /Compare os sete dias sem perder contexto/);
  assert.doesNotMatch(page, /Os períodos que merecem nova consulta/);
  assert.doesNotMatch(page, /próximas rodadas/);
  assert.doesNotMatch(page, /Nenhum valor demonstrativo foi inserido/);
  assert.doesNotMatch(page, /Dia mais favorável/);
  assert.doesNotMatch(page, /Condição do dia:/);
  assert.doesNotMatch(page, /maior sinal de chuva/);
  assert.doesNotMatch(page, /contexto complementar/);
  assert.doesNotMatch(page, /não publicaram contexto/);
  assert.doesNotMatch(page, /<h1/);
  assert.doesNotMatch(page, /ForecastPageHeader/);
  assert.doesNotMatch(page, /forecast-seven-day-list/);
});

test("weekly sections use the exact header rail", () => {
  assert.match(
    shellStyles,
    /\.internal-weather-shell--seven-day \.seven-day-retail-hero__inner[\s\S]*max-width:\s*var\(--internal-weather-frame-max\)/,
  );
  assert.match(
    shellStyles,
    /\.internal-weather-shell--seven-day \.seven-day-v2-page,[\s\S]*width:\s*100%[\s\S]*max-width:\s*none/,
  );
  assert.match(shellStyles, /padding-right:\s*var\(--internal-weather-frame-gutter\)/);
  assert.match(shellStyles, /padding-left:\s*var\(--internal-weather-frame-gutter\)/);
});

test("weekly visual system is readable and responsive", () => {
  assert.match(heroStyles, /weekly planning accent/);
  assert.match(heroStyles, /font-size:\s*clamp\(0\.75rem/);
  assert.match(heroStyles, /@media \(max-width: 920px\)/);
  assert.match(heroStyles, /@media \(max-width: 700px\)/);
  assert.match(heroStyles, /@media \(forced-colors: active\)/);
  assert.ok(remValues.every((value) => value >= 0.72), "microtext must stay readable");
  assert.match(pageStyles, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(pageStyles, /content-visibility:\s*auto/);
  assert.match(pageStyles, /@media \(max-width: 1280px\)/);
  assert.match(pageStyles, /@media \(max-width: 900px\)/);
  assert.match(pageStyles, /@media \(max-width: 560px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.match(pageStyles, /:focus-visible/);
});
