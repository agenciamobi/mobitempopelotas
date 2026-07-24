import assert from "node:assert/strict";
import test from "node:test";

import {
  OFFICIAL_SOURCE_DEADLINE_MS,
  WEATHER_SOURCE_REQUEST_TIMEOUT_MS,
} from "../src/lib/weather/source-policy.ts";

test("o orquestrador respeita o tempo interno de cada fonte oficial", () => {
  for (const source of ["embrapa", "inmet", "cppmet"] as const) {
    assert.ok(
      OFFICIAL_SOURCE_DEADLINE_MS[source] > WEATHER_SOURCE_REQUEST_TIMEOUT_MS[source],
      `${source} não pode ser interrompida antes do próprio timeout`,
    );
  }
});

test("a Embrapa suporta a latência observada do Current_Monitor", () => {
  assert.ok(WEATHER_SOURCE_REQUEST_TIMEOUT_MS.embrapa >= 12_000);
});
