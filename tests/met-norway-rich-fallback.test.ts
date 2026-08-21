import assert from "node:assert/strict";
import test from "node:test";

import { fetchMetNorwayWeather } from "../src/lib/weather/met-norway.server.ts";

function point(time: string, temperature: number, direction: number, rain: number) {
  return {
    time,
    data: {
      instant: {
        details: {
          air_temperature: temperature,
          relative_humidity: 86,
          dew_point_temperature: 11.6,
          air_pressure_at_sea_level: 1016.4,
          cloud_area_fraction: 78,
          cloud_area_fraction_low: 62,
          cloud_area_fraction_medium: 35,
          cloud_area_fraction_high: 18,
          wind_speed: 4.2,
          wind_speed_of_gust: 7.8,
          wind_from_direction: direction,
        },
      },
      next_1_hours: {
        summary: { symbol_code: rain > 0 ? "rain" : "cloudy" },
        details: {
          precipitation_amount: rain,
          probability_of_precipitation: rain > 0 ? 70 : 20,
        },
      },
    },
  };
}

test("MET Norway fallback preserves atmospheric, directional and daily identity fields", async () => {
  const originalFetch = globalThis.fetch;
  let userAgent = "";

  globalThis.fetch = (async (_input, init) => {
    userAgent = new Headers(init?.headers).get("User-Agent") ?? "";
    return new Response(
      JSON.stringify({
        properties: {
          timeseries: [
            point("2026-08-21T08:00:00Z", 13.4, 180, 0.6),
            point("2026-08-21T09:00:00Z", 14.1, 202, 1.2),
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await fetchMetNorwayWeather();
    assert.equal(result.status, "live");
    assert.equal(result.source.key, "met-norway");
    assert.equal(result.source.model, "Locationforecast 2.0");
    assert.equal(result.source.temporalResolutionMinutes, 60);
    assert.match(userAgent, /tempopelotas\.com\.br/);

    assert.equal(result.current?.dewPoint, 11.6);
    assert.equal(result.current?.observedAt, "2026-08-21T08:00:00Z");
    assert.equal(result.hourly[0]?.timestamp, "2026-08-21T08:00:00Z");
    assert.equal(result.hourly[0]?.precipitationMm, 0.6);
    assert.equal(result.hourly[0]?.windDirectionDegrees, 180);
    assert.equal(result.hourly[0]?.relativeHumidity, 86);
    assert.equal(result.hourly[0]?.dewPoint, 11.6);
    assert.equal(result.hourly[0]?.pressure, 1016);
    assert.equal(result.hourly[0]?.cloudCover, 78);
    assert.equal(result.hourly[0]?.cloudCoverLow, 62);
    assert.equal(result.hourly[0]?.cloudCoverMid, 35);
    assert.equal(result.hourly[0]?.cloudCoverHigh, 18);
    assert.equal(result.daily[0]?.dateIso, "2026-08-21");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("MET Norway does not label a 6-hour accumulation as hourly rain", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        properties: {
          timeseries: [
            {
              time: "2026-08-21T08:00:00Z",
              data: {
                instant: {
                  details: {
                    air_temperature: 13.4,
                    wind_speed: 4.2,
                  },
                },
                next_6_hours: {
                  summary: { symbol_code: "rain" },
                  details: {
                    precipitation_amount: 8.4,
                    probability_of_precipitation: 80,
                  },
                },
              },
            },
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;

  try {
    const result = await fetchMetNorwayWeather();
    assert.equal(result.hourly[0]?.precipitationMm, null);
    assert.equal(result.hourly[0]?.precipitationProbability, 80);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
