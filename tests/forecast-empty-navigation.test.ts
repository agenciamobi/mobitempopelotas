import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const todayHero = readFileSync("src/components/weather/TodayRetailHero.tsx", "utf8");
const tomorrowHero = readFileSync("src/components/weather/TomorrowRetailHero.tsx", "utf8");
const sevenDayHero = readFileSync("src/components/weather/SevenDayRetailHero.tsx", "utf8");
const rainHero = readFileSync("src/components/weather/RainRetailHero.tsx", "utf8");
const sharedForecastStory = readFileSync("src/components/weather/HomeForecastStory.tsx", "utf8");
const sharedForecastUnknownStyles = readFileSync(
  "src/components/weather/HomeForecastUnknownState.css",
  "utf8",
);
const todayPage = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const todayResources = readFileSync("src/components/weather/TodayWeatherResources.tsx", "utf8");
const todayAtmosphere = readFileSync("src/components/weather/TodayAtmosphericSignals.tsx", "utf8");
const todayAtmosphereStyles = readFileSync(
  "src/components/weather/TodayAtmosphericSignals.css",
  "utf8",
);
const todayNavigationStyles = readFileSync(
  "src/components/weather/TodayNavigationAvailability.css",
  "utf8",
);
const homeForecast = readFileSync(
  "src/production/components/home-forecast-editorial.tsx",
  "utf8",
);
const homeTrend = readFileSync("src/production/components/home-forecast-trend.tsx", "utf8");
const homeHero = readFileSync("src/production/components/weather-hero.tsx", "utf8");

test("today hero does not link to hourly anchors when hourly forecast is absent", () => {
  assert.match(todayHero, /const hasHourlyForecast = weather\.hourly\.length > 0/);
  assert.match(todayHero, /hasHourlyForecast \? \(/);
  assert.match(todayHero, /href=\{primaryHref\}/);
  assert.match(todayHero, /href="\/previsao-7-dias-pelotas"/);
  assert.match(todayHero, /Ver avisos oficiais/);
});

test("today hero never marks unavailable current data as observed", () => {
  assert.match(todayHero, /const isObserved = current\.available && \(currentIsObserved \?\? true\)/);
  assert.match(todayHero, /Dados meteorológicos em atualização/);
});

test("zero gusts use explicit no-gust wording on today", () => {
  assert.match(todayHero, /function formatGust/);
  assert.match(todayHero, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(todayHero, /formatGust\(nextHour\.windGust\)/);
  assert.match(todayHero, /formatGust\(today\.windGust\)/);
});

test("tomorrow hero falls back to real routes when tomorrow is unavailable", () => {
  assert.match(tomorrowHero, /const hasTomorrow = tomorrow !== null/);
  assert.match(tomorrowHero, /hasTomorrow \? \(/);
  assert.match(tomorrowHero, /href="#planejamento-amanha"/);
  assert.match(tomorrowHero, /to="\/previsao-7-dias-pelotas"/);
  assert.match(tomorrowHero, /to=\{hasTomorrow \? "\/previsao-7-dias-pelotas" : "\/tempo-hoje-pelotas"\}/);
  assert.match(tomorrowHero, /if \(value <= 0\) return "Sem rajadas"/);
});

test("weekly hero does not keep page anchors when daily forecast is absent", () => {
  assert.match(sevenDayHero, /const hasDailyForecast = days\.length > 0/);
  assert.match(sevenDayHero, /hasDailyForecast \? \(/);
  assert.match(sevenDayHero, /href="#semana-dia-a-dia"/);
  assert.match(sevenDayHero, /href="#riscos-da-semana"/);
  assert.match(sevenDayHero, /to="\/tempo-hoje-pelotas"/);
  assert.match(sevenDayHero, /to="\/chuva-em-pelotas"/);
  assert.match(sevenDayHero, /Sem volume previsto/);
  assert.match(sevenDayHero, /Sem rajadas/);
});

test("rain hero chooses only anchors backed by the available forecast series", () => {
  assert.match(rainHero, /const hasHourlyForecast = hours\.length > 0/);
  assert.match(rainHero, /const hasDailyForecast = days\.length > 0/);
  assert.match(rainHero, /hasHourlyForecast \? \(/);
  assert.match(rainHero, /href="#chuva-por-hora"/);
  assert.match(rainHero, /hasDailyForecast \? \(/);
  assert.match(rainHero, /href="#chuva-na-semana"/);
  assert.match(rainHero, /to="\/tempo-hoje-pelotas"/);
  assert.match(rainHero, /to="\/previsao-7-dias-pelotas"/);
  assert.match(rainHero, /hour\.windGust !== null/);
  assert.doesNotMatch(rainHero, /hour\.windGust \?\? hour\.windSpeed/);
});

test("shared forecast story never relabels sustained wind as a gust", () => {
  assert.match(sharedForecastStory, /function formatGust/);
  assert.match(sharedForecastStory, /function hourlyWindDescription/);
  assert.match(sharedForecastStory, /Rajada não informada · vento/);
  assert.match(sharedForecastStory, /Sem rajada prevista · vento/);
  assert.match(sharedForecastStory, /const hourlyGusts = visibleHours/);
  assert.doesNotMatch(sharedForecastStory, /function windValue/);
  assert.doesNotMatch(sharedForecastStory, /windGust \?\? windSpeed/);
});

test("shared forecast story keeps unknown rain separate from a published zero", () => {
  assert.match(sharedForecastStory, /type RainLevel = "unknown" \| "none"/);
  assert.match(sharedForecastStory, /value === null \|\| !Number\.isFinite\(value\)/);
  assert.match(sharedForecastStory, /chance: null, level: "unknown", label: "Chance em atualização"/);
  assert.match(sharedForecastStory, /if \(chance === 0\).*Sem chuva indicada/);
  assert.match(sharedForecastStory, /const chanceHours = visibleHours\.filter/);
  assert.match(sharedForecastStory, /const hasPositiveRainChance = \(highestRainChance \?\? 0\) > 0/);
  assert.match(sharedForecastStory, /sem horário de destaque/);
  assert.match(sharedForecastStory, /Chance de chuva de amanhã em atualização/);
  assert.match(sharedForecastStory, /rain\.chance \?\? 0/);
  assert.match(sharedForecastUnknownStyles, /rain-unknown/);
  assert.doesNotMatch(sharedForecastUnknownStyles, /!important/);
});

test("Today planning never rewards missing rain data or displays zero as a gust", () => {
  assert.match(todayResources, /const comparablePeriods = periods\.filter\(\(period\) => period\.peakRain !== null\)/);
  assert.match(todayResources, /comparableScores\.length > 1/);
  assert.match(todayResources, /Chance de chuva em atualização/);
  assert.match(todayResources, /Ainda não há períodos suficientes com chance de chuva publicada para comparar/);
  assert.match(todayResources, /chance de chuva ainda não foi informada nos períodos comparados/);
  assert.match(todayResources, /function formatGust/);
  assert.match(todayResources, /if \(value <= 0\) return "Sem rajada prevista"/);
  assert.match(todayResources, /sem rajada prevista/);
  assert.match(todayResources, /chance de chuva não informada/);
  assert.match(todayResources, /return "Condições estáveis"/);
  assert.doesNotMatch(todayResources, /É o período com menor combinação de chuva e vento/);
});

test("Today chapter index hides forecast sections that did not render", () => {
  assert.match(todayPage, /import "\.\/TodayNavigationAvailability\.css"/);
  assert.match(todayNavigationStyles, /:not\(:has\(#previsao-hoje\)\)/);
  assert.match(todayNavigationStyles, /a\[href="#previsao-hoje"\]/);
  assert.match(todayNavigationStyles, /:not\(:has\(#recursos-hoje\)\)/);
  assert.match(todayNavigationStyles, /a\[href="#recursos-hoje"\]/);
  assert.match(todayNavigationStyles, /:not\(:has\(#atmosfera-hoje\)\)/);
  assert.match(todayNavigationStyles, /a\[href="#atmosfera-hoje"\]/);
  assert.doesNotMatch(todayNavigationStyles, /!important/);
});

test("Today atmospheric assessment never fabricates fog support values", () => {
  assert.match(todayAtmosphere, /function fogSupportDetail/);
  assert.match(todayAtmosphere, /const hasSupportingSignal =/);
  assert.match(todayAtmosphere, /Ponto de orvalho próximo, mas faltam dados complementares/);
  assert.match(todayAtmosphere, /Umidade, nuvens baixas e visibilidade não foram informadas/);
  assert.doesNotMatch(todayAtmosphere, /hour\.relativeHumidity \?\? 70/);
  assert.doesNotMatch(todayAtmosphere, /hour\.cloudCoverLow \?\? 0/);
  assert.doesNotMatch(todayAtmosphere, /hour\.visibilityKm \?\? 99/);
});

test("Today cloud layers distinguish unknown values from a published zero", () => {
  assert.match(todayAtmosphere, /if \(value === null \|\| value === undefined\) return null/);
  assert.match(todayAtmosphere, /function cloudBarStyle/);
  assert.match(todayAtmosphere, /normalized === null \? undefined/);
  assert.match(todayAtmosphere, /Nuvens baixas: não informada/);
  assert.match(todayAtmosphere, /Cobertura total não informada/);
  assert.doesNotMatch(todayAtmosphere, /Math\.max\(cloudValue\(hour\.cloudCoverLow\)/);
  assert.match(todayAtmosphereStyles, /\.today-atmosphere__legend \.is-unknown/);
  assert.match(todayAtmosphereStyles, /span\.is-unknown[\s\S]*repeating-linear-gradient/);
  assert.match(todayAtmosphereStyles, /min-width:\s*0/);
});

test("main Home hourly summary does not invent a zero-percent peak or a zero gust", () => {
  assert.match(homeForecast, /const highestRainChance = peakCandidate\?\.precipitation \?\? null/);
  assert.match(homeForecast, /const hasPositiveRainChance = \(highestRainChance \?\? 0\) > 0/);
  assert.match(homeForecast, /const peakHour = hasPositiveRainChance \? peakCandidate : null/);
  assert.match(homeForecast, /sem horário de destaque/);
  assert.match(homeForecast, /function formatGust/);
  assert.match(homeForecast, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(homeForecast, /function hourlyGustLabel/);
  assert.match(homeForecast, /Sem rajada prevista/);
});

test("main Home weekly trend preserves positive volume and normalizes zero gusts", () => {
  assert.match(homeTrend, /function gustDescription/);
  assert.match(homeTrend, /if \(value <= 0\) return "Sem rajada prevista\."/);
  assert.match(homeTrend, /tomorrow\.precipitation > 0/);
  assert.match(homeTrend, /Chance baixa de chuva, com/);
  assert.match(homeTrend, /day\.rainChance >= 20/);
});

test("main Home hero distinguishes missing hourly forecast from a real next-hour forecast", () => {
  assert.match(homeHero, /const hasHourlyForecast = hourlyPreview\.length > 0/);
  assert.match(homeHero, /current\.available \|\| nextHourForecast/);
  assert.match(homeHero, /Dados meteorológicos em atualização/);
  assert.match(homeHero, /const heroStatus = current\.available \? "Agora" : nextHourForecast \? "Previsão" : "Atualizando"/);
  assert.match(homeHero, /Temperatura em atualização/);
  assert.match(homeHero, /Sem previsão horária disponível/);
  assert.match(homeHero, /Nenhum valor de próxima hora foi preenchido manualmente/);
  assert.match(homeHero, /hasHourlyForecast \? "Ver previsão por hora" : "Consultar previsão de hoje"/);
});
