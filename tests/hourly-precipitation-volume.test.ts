import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const apiRoute = readFileSync("src/routes/api/weather/hourly-precipitation.ts", "utf8");
const volumeComponent = readFileSync("src/components/weather/HourlyRainVolume.tsx", "utf8");
const forecastStory = readFileSync("src/components/weather/HomeForecastStory.tsx", "utf8");

test("hourly precipitation API requests millimetres rather than deriving volume from probability", () => {
  assert.match(apiRoute, /hourly:\s*"precipitation"/);
  assert.match(apiRoute, /precipitation_unit:\s*"mm"/);
  assert.match(apiRoute, /precipitationMm/);
  assert.doesNotMatch(apiRoute, /precipitation_probability/);
});

test("seven hourly cards share one request and show the corresponding volume", () => {
  assert.match(volumeComponent, /let sharedRequest/);
  assert.match(volumeComponent, /payload\.hours\[index\]/);
  assert.match(volumeComponent, /mm previstos/);
  assert.match(volumeComponent, /Volume indisponível/);
  assert.match(forecastStory, /<HourlyRainVolume index=\{index\} \/>/);
});

test("rain probability remains visible separately from hourly volume", () => {
  assert.match(forecastStory, /<strong>\{rain\.chance\}%<\/strong>/);
  assert.match(forecastStory, /style=\{\{ width: `\$\{rain\.chance\}%` \}\}/);
});
