import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  isUsefulVisibleSatelliteTimestamp,
  keepUsefulVisibleSatelliteFrames,
  solarElevationDegrees,
} from "../src/lib/redemet/redemet-visible-daylight.ts";
import type { RedemetImageFrame } from "../src/lib/redemet/redemet.types.ts";

const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");

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

test("public satellite route uses the maximum upstream lookback only for VIS", () => {
  assert.match(satelliteRoute, /const VISIBLE_LOOKBACK_FRAMES = 15;/);
  assert.match(satelliteRoute, /type === "vis" \? VISIBLE_LOOKBACK_FRAMES : frames/);
  assert.match(satelliteRoute, /keepUsefulVisibleSatelliteFrames/);
  assert.match(satelliteRoute, /canal visível depende de luz solar/);
  assert.match(satelliteRoute, /Use Infravermelho ou Realçado durante a noite/);
});
