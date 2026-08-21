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
const todayPage = readFileSync("src/components/weather/TodayForecastPageV5.tsx", "utf8");
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
  assert.doesNotMatch(`${rainDetail}\n${rainRoute}`, /OCR|extrair pixels|chuva medida pelo modelo/i);
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
