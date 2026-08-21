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
