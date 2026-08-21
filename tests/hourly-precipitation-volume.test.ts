import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const apiRoute = readFileSync("src/routes/api/weather/hourly-precipitation.ts", "utf8");
const forecastStory = readFileSync("src/components/weather/HomeForecastStory.tsx", "utf8");
const homeEditorialForecast = readFileSync(
  "src/production/components/home-forecast-editorial.tsx",
  "utf8",
);

test("hourly precipitation API requests millimetres rather than deriving volume from probability", () => {
  assert.match(apiRoute, /hourly:\s*"precipitation"/);
  assert.match(apiRoute, /precipitation_unit:\s*"mm"/);
  assert.match(apiRoute, /precipitationMm/);
  assert.doesNotMatch(apiRoute, /precipitation_probability/);
});

test("hourly cards render the volume already attached to their own forecast hour", () => {
  assert.match(forecastStory, /hourlyVolumeLabel\(hour\.precipitationMm\)/);
  assert.match(forecastStory, /Volume indisponível/);
  assert.match(forecastStory, /mm previstos/);
  assert.doesNotMatch(forecastStory, /HourlyRainVolume/);
  assert.doesNotMatch(forecastStory, /\/api\/weather\/hourly-precipitation/);
});

test("production home keeps chance and hourly millimetres in the same compact rain reading", () => {
  assert.match(
    homeEditorialForecast,
    /hourlyRainReading\(hour\.precipitation, hour\.precipitationMm\)/,
  );
  assert.match(homeEditorialForecast, /secondary: `chance · \$\{volume\}`/);
  assert.match(homeEditorialForecast, /secondary: "volume previsto"/);
  assert.match(homeEditorialForecast, /secondary: "chuva em atualização"/);
  assert.doesNotMatch(homeEditorialForecast, /\/api\/weather\/hourly-precipitation/);
});

test("rain probability remains visible separately from hourly volume", () => {
  assert.match(forecastStory, /<strong>\{rain\.chance\}%<\/strong>/);
  assert.match(forecastStory, /style=\{\{ width: `\$\{rain\.chance\}%` \}\}/);
});
