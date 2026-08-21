import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rainRoute = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const windRoute = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const rainDetail = readFileSync("src/components/weather/RainHourlyVolumeContext.tsx", "utf8");
const rainStyles = readFileSync("src/components/weather/RainHourlyVolumeContext.css", "utf8");
const windDetail = readFileSync("src/components/weather/WindDirectionContext.tsx", "utf8");
const windStyles = readFileSync("src/components/weather/WindDirectionContext.css", "utf8");
const windPage = readFileSync("src/components/weather/WindForecastPageV3.tsx", "utf8");
const windPageStyles = readFileSync("src/components/weather/WindForecastPageV3.css", "utf8");
const rainPage = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const todayPage = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
const todayHero = readFileSync("src/components/weather/TodayRetailHero.tsx", "utf8");
const todayResources = readFileSync("src/components/weather/TodayWeatherResources.tsx", "utf8");
const meteogram = readFileSync("src/lib/weather/meteogram.server.ts", "utf8");

test("rain and wind routes reuse the structured 48-hour meteogram in parallel", () => {
  for (const route of [rainRoute, windRoute]) {
    assert.match(route, /getPelotasMeteogram/);
    assert.match(route, /Promise\.all/);
    assert.match(route, /getWeatherIntelligence\(\)/);
    assert.match(route, /getPelotasMeteogram\(\)/);
  }

  assert.match(rainRoute, /RainHourlyVolumeContext meteogram=\{meteogram\}/);
  assert.match(windRoute, /WindDirectionContext meteogram=\{meteogram\}/);
});

test("hourly rain detail keeps probability and model volume separate from measurement", () => {
  assert.match(rainDetail, /precipitationMm/);
  assert.match(rainDetail, /precipitationProbability/);
  assert.match(rainDetail, /Total nas próximas 12h/);
  assert.match(rainDetail, /Maior volume em uma hora/);
  assert.match(rainDetail, /São valores de previsão, não chuva já medida em Pelotas/);
  assert.match(rainRoute, /O volume por hora desta página é uma previsão do modelo/);
  assert.match(rainPage, /href="#volume-de-chuva-por-hora"/);
  assert.doesNotMatch(`${rainDetail}\n${rainRoute}`, /OCR|extrair pixels|chuva medida pelo modelo/i);
});

test("hourly rain detail distinguishes complete, partial, zero and unknown volume", () => {
  assert.match(rainDetail, /const availableVolumeHours = hours\.filter\(\(hour\) => hour\.precipitationMm !== null\)/);
  assert.match(rainDetail, /const hasCompleteVolumeWindow = availableVolumeHours\.length === hours\.length/);
  assert.match(rainDetail, /Total parcial disponível/);
  assert.match(rainDetail, /horários têm volume informado/);
  assert.match(rainDetail, /Entre os \{availableVolumeHours\.length\} horários com volume informado/);
  assert.match(rainDetail, /chance não informada/);
  assert.match(rainDetail, /volume não informado/);
  assert.match(rainDetail, /className=\{volumeKnown \? undefined : "is-unknown"\}/);
  assert.match(rainStyles, /article\.is-unknown/);
  assert.match(rainStyles, /repeating-linear-gradient/);
});

test("zero hourly rain volume does not create a fake peak hour", () => {
  assert.match(rainDetail, /const hasPositiveVolume = total > 0/);
  assert.match(rainDetail, /hasPositiveVolume \? peakVolumeHour\(availableVolumeHours\) : null/);
  assert.match(rainDetail, /Sem volume previsto no período/);
  assert.match(rainDetail, /Sem volume positivo entre os horários informados/);
});

test("hourly wind direction stays a forecast distinct from current observation", () => {
  assert.match(windDetail, /windDirectionDegrees/);
  assert.match(windDetail, /Mais frequente em 24h/);
  assert.match(windDetail, /vento vindo de/);
  assert.match(windDetail, /previsão de modelo/);
  assert.match(windRoute, /direção prevista por horário/i);
  assert.match(windRoute, /não é apresentada como medição da estação/i);
  assert.doesNotMatch(windPage, /A fonte não informa a direção futura em cada horário/);
  assert.match(windPage, /direção prevista por horário aparece em uma camada detalhada separada/);
  assert.match(windPage, /href="#direcao-do-vento-por-hora"/);
  assert.match(windPageStyles, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
});

test("wind frequency does not invent a dominant direction when counts are tied", () => {
  assert.match(windDetail, /function directionFrequency/);
  assert.match(windDetail, /const leaders = ranked\.filter/);
  assert.match(windDetail, /if \(leaders\.length > 1\)/);
  assert.match(windDetail, /Sem direção dominante/);
  assert.match(windDetail, /Empate entre \$\{leaders\.join\(", "\)\}/);
  assert.match(windDetail, /hasDominantDirection: false/);
});

test("peak-gust direction requires a positive published gust and never substitutes sustained wind", () => {
  assert.match(windDetail, /if \(hour\.windGust === null \|\| hour\.windGust <= 0\) return selected/);
  assert.match(windDetail, /selected\?\.windGust/);
  assert.match(windDetail, /Sem rajada positiva prevista no período/);
  assert.match(windDetail, /Rajada não informada no período/);
  assert.match(windDetail, /function formatGust/);
  assert.match(windDetail, /if \(value <= 0\) return "Sem rajada prevista"/);
  assert.doesNotMatch(windDetail, /hour\.windGust \?\? hour\.windSpeed/);
  assert.doesNotMatch(windDetail, /selected\.windGust \?\? selected\.windSpeed/);
});

test("dedicated Open-Meteo profile explicitly requests rain volume and wind direction", () => {
  assert.match(meteogram, /"precipitation"/);
  assert.match(meteogram, /"wind_direction_10m"/);
  assert.match(meteogram, /precipitationMm/);
  assert.match(meteogram, /windDirectionDegrees/);
});

test("today atmospheric signals use the same recovered data as the rest of the page", () => {
  assert.match(todayPage, /const recoveredData = useOpenMeteoIntelligenceRecovery\(data\)/);
  assert.match(todayPage, /<TodayAtmosphericSignals data=\{recoveredData\} \/>/);
  assert.doesNotMatch(todayPage, /<TodayAtmosphericSignals data=\{data\} \/>/);
});

test("today empty state does not invent a next-hour condition or a gust", () => {
  assert.match(todayHero, /const hasForecastSignal = current\.available \|\| nextHour !== null/);
  assert.match(todayHero, /const isObserved = current\.available && \(currentIsObserved \?\? true\)/);
  assert.match(todayHero, /Dados meteorológicos em atualização/);
  assert.match(todayHero, /nextHour[\s\S]*Condição prevista para a próxima hora/);
  assert.match(todayHero, /hasForecastSignal \? "Previsão" : "Atualizando"/);
  assert.match(todayPage, /function strongestGust/);
  assert.match(todayPage, /if \(hour\.windGust === null\) return value/);
  assert.doesNotMatch(todayPage, /hour\.windGust \?\? hour\.windSpeed/);
});

test("today planning only uses sustained wind as a risk fallback, never as a displayed gust", () => {
  assert.match(todayResources, /const maxGust = maximum\(hours\.map\(\(hour\) => hour\.windGust\)\)/);
  assert.match(todayResources, /const windRisk = maxGust \?\? maxWindSpeed/);
  assert.match(todayResources, /hour\.windGust \?\? hour\.windSpeed/);
  assert.match(todayResources, /function formatGust/);
  assert.match(todayResources, /formatGust\(period\.maxGust\)/);
  assert.match(todayResources, /attentionHour\.windGust === null/);
  assert.match(todayResources, /sem rajada prevista/);
});

test("today planning does not color or name arbitrary winners when scores are tied or rain is unknown", () => {
  assert.match(todayResources, /const comparablePeriods = periods\.filter\(\(period\) => period\.peakRain !== null\)/);
  assert.match(todayResources, /const hasPeriodContrast =/);
  assert.match(todayResources, /comparableScores\.length > 1/);
  assert.match(todayResources, /const hasHourContrast = Math\.max\(\.\.\.hourRisks\) > Math\.min\(\.\.\.hourRisks\)/);
  assert.match(todayResources, /className=\{hasPeriodContrast && bestPeriod \? "is-best" : undefined\}/);
  assert.match(todayResources, /className=\{hasHourContrast \? "is-attention" : undefined\}/);
  assert.match(todayResources, /Sem diferença relevante/);
  assert.match(todayResources, /Chance de chuva em atualização/);
  assert.match(todayResources, /Sem um único horário/);
});

test("new public detail layers follow the internal editorial rail and responsive contract", () => {
  assert.match(rainStyles, /internal-weather-shell--rain \.rain-hourly-volume-context/);
  assert.match(windStyles, /internal-weather-shell--wind \.wind-direction-context/);
  assert.match(rainStyles, /var\(--internal-weather-radius/);
  assert.match(windStyles, /var\(--internal-weather-radius/);
  assert.match(rainStyles, /@media \(max-width: 520px\)/);
  assert.match(windStyles, /@media \(max-width: 520px\)/);
  assert.match(rainStyles, /@media \(forced-colors: active\)/);
  assert.match(windStyles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(rainStyles, /!important/);
  assert.doesNotMatch(windStyles, /!important/);
});
