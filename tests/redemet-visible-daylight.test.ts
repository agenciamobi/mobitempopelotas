import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  isUsefulVisibleSatelliteTimestamp,
  keepUsefulVisibleSatelliteFrames,
  nextUsefulVisibleSatelliteTimestamp,
  solarElevationDegrees,
} from "../src/lib/redemet/redemet-visible-daylight.ts";
import type { RedemetImageFrame } from "../src/lib/redemet/redemet.types.ts";

const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");
const weatherMap = readFileSync("src/production/components/weather-map.tsx", "utf8");
const radarStyles = readFileSync("src/production/styles/radar-map.css", "utf8");

function frame(observedAt: string): RedemetImageFrame {
  return {
    id: observedAt,
    label: observedAt,
    observedAt,
    imageUrl: `/api/redemet/image?frame=${encodeURIComponent(observedAt)}`,
    bounds: { west: -100, south: -56, east: -25.24, north: 12.52 },
  };
}

test("visible satellite recognizes daylight over Pelotas", () => {
  const afternoon = new Date("2026-08-21T20:00:00.000Z"); // 17:00 em Pelotas
  const night = new Date("2026-08-22T00:30:00.000Z"); // 21:30 em Pelotas

  assert.ok(solarElevationDegrees(afternoon) > 0);
  assert.ok(solarElevationDegrees(night) < -3);
  assert.equal(isUsefulVisibleSatelliteTimestamp(afternoon.toISOString()), true);
  assert.equal(isUsefulVisibleSatelliteTimestamp(night.toISOString()), false);
});

test("visible satellite estimates the next useful daylight window", () => {
  const night = new Date("2026-08-22T03:30:00.000Z"); // 00:30 em Pelotas
  const next = nextUsefulVisibleSatelliteTimestamp(night);

  assert.ok(next);
  const nextDate = new Date(next!);
  assert.ok(nextDate.getTime() > night.getTime());
  assert.ok(nextDate.getTime() - night.getTime() < 12 * 60 * 60 * 1_000);
  assert.ok(solarElevationDegrees(nextDate) >= -3);
});

test("visible satellite removes night frames and keeps the most recent useful daylight window", () => {
  const frames = [
    frame("2026-08-21T19:30:00.000Z"), // 16:30
    frame("2026-08-21T20:30:00.000Z"), // 17:30
    frame("2026-08-21T21:00:00.000Z"), // 18:00
    frame("2026-08-21T21:30:00.000Z"), // 18:30
    frame("2026-08-22T00:30:00.000Z"), // 21:30
  ];

  const useful = keepUsefulVisibleSatelliteFrames(frames, 8);

  assert.deepEqual(
    useful.map((item) => item.observedAt),
    [
      "2026-08-21T19:30:00.000Z",
      "2026-08-21T20:30:00.000Z",
      "2026-08-21T21:00:00.000Z",
    ],
  );
});

test("public satellite route explains the daylight pause and returns next expected window", () => {
  assert.match(satelliteRoute, /const VISIBLE_LOOKBACK_FRAMES = 15;/);
  assert.match(satelliteRoute, /type === "vis" \? VISIBLE_LOOKBACK_FRAMES : frames/);
  assert.match(satelliteRoute, /keepUsefulVisibleSatelliteFrames/);
  assert.match(satelliteRoute, /availabilityReason: isNighttime \? "daylight" : null/);
  assert.match(satelliteRoute, /nextUsefulVisibleSatelliteTimestamp\(now\)/);
  assert.match(satelliteRoute, /canal visível não produz uma imagem útil/i);
  assert.match(satelliteRoute, /Use Infravermelho ou Realçado/);
});

test("map treats visible nighttime as information instead of an error overlay", () => {
  assert.match(weatherMap, /visibleDaylightPause/);
  assert.match(weatherMap, /Aguardando luz solar/);
  assert.match(weatherMap, /Canal visível depende de luz solar/);
  assert.match(weatherMap, /Próxima imagem útil esperada: por volta de/);
  assert.match(weatherMap, /has-layer-notice/);
  assert.match(radarStyles, /\.map-radar-unavailable[\s\S]*bottom:\s*18px/);
  assert.match(radarStyles, /\.map-radar-unavailable\.is-daylight/);
  assert.match(radarStyles, /\.map-canvas\.has-layer-notice \.maplibregl-ctrl-bottom-right/);
  assert.doesNotMatch(
    weatherMap,
    /<strong>Camada temporariamente indisponível<\/strong>[\s\S]*<span>\{activeLayer\.data\.error\}<\/span>/,
  );
});
