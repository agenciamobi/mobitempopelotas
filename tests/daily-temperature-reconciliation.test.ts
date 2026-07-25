import assert from "node:assert/strict";
import test from "node:test";

import { reconcileDailyTemperatures } from "../src/lib/weather/daily-temperature-reconciliation.ts";
import type { InmetForecastPeriod } from "../src/lib/weather/official-sources.types.ts";

function period(
  date: string,
  periodName: string,
  minimum: number | null,
  maximum: number | null,
): InmetForecastPeriod {
  return {
    id: `${date}:${periodName}`,
    date,
    period: periodName,
    summary: "Muitas nuvens",
    minimum,
    maximum,
    humidityMinimum: null,
    humidityMaximum: null,
    windDirection: null,
    windIntensity: null,
    icon: null,
  };
}

test("INMET substitui somente a mínima e a máxima da data correspondente", () => {
  const daily = [
    { min: 13, max: 18, rainChance: 16 },
    { min: 12, max: 20, rainChance: 30 },
  ];
  const periods = [
    period("2026-07-25", "Manhã", 13, 19),
    period("2026-07-25", "Tarde", 13, 19),
    period("2026-07-26", "Manhã", 11, 18),
  ];

  const reconciled = reconcileDailyTemperatures(
    daily,
    periods,
    new Date("2026-07-25T12:00:00-03:00"),
  );

  assert.deepEqual(reconciled, [
    { min: 13, max: 19, rainChance: 16 },
    { min: 11, max: 18, rainChance: 30 },
  ]);
});

test("valores incompletos do INMET preservam o lado disponível do modelo", () => {
  const daily = [{ min: 10, max: 21 }];
  const periods = [period("2026-07-25", "Tarde", null, 19)];

  assert.deepEqual(
    reconcileDailyTemperatures(daily, periods, new Date("2026-07-25T12:00:00-03:00")),
    [{ min: 10, max: 19 }],
  );
});

test("faixa oficial inválida não substitui a previsão detalhada", () => {
  const daily = [{ min: 12, max: 20 }];
  const periods = [period("2026-07-25", "Dia", 22, 18)];

  assert.deepEqual(
    reconcileDailyTemperatures(daily, periods, new Date("2026-07-25T12:00:00-03:00")),
    daily,
  );
});
