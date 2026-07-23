import assert from "node:assert/strict";
import test from "node:test";

import {
  getWaterLevelTrendDirection,
  getWaterLevelVisualState,
  waterLevelStateClass,
} from "../src/production/lib/water-level-state.ts";

test("classifica tendência de nível com faixa estável", () => {
  assert.equal(getWaterLevelTrendDirection(null), "unavailable");
  assert.equal(getWaterLevelTrendDirection(Number.NaN), "unavailable");
  assert.equal(getWaterLevelTrendDirection(0), "stable");
  assert.equal(getWaterLevelTrendDirection(0.099), "stable");
  assert.equal(getWaterLevelTrendDirection(-0.099), "stable");
  assert.equal(getWaterLevelTrendDirection(0.1), "rising");
  assert.equal(getWaterLevelTrendDirection(-0.1), "falling");
});

test("respeita limiar estável configurável", () => {
  assert.equal(getWaterLevelTrendDirection(0.24, 0.25), "stable");
  assert.equal(getWaterLevelTrendDirection(0.25, 0.25), "rising");
});

test("cota de cheia tem prioridade sobre disponibilidade e tendência", () => {
  assert.equal(
    getWaterLevelVisualState({
      rate: null,
      available: false,
      currentLevel: 2.5,
      threshold: 2.5,
    }),
    "flood",
  );
  assert.equal(
    getWaterLevelVisualState({
      rate: -0.8,
      currentLevel: 3.1,
      threshold: 3,
    }),
    "flood",
  );
});

test("não marca cheia sem valores numéricos válidos", () => {
  assert.equal(
    getWaterLevelVisualState({
      rate: 0.2,
      currentLevel: Number.NaN,
      threshold: 2.5,
    }),
    "rising",
  );
  assert.equal(
    getWaterLevelVisualState({
      rate: -0.2,
      currentLevel: 3,
      threshold: null,
    }),
    "falling",
  );
});

test("indisponibilidade prevalece quando não há cota de cheia", () => {
  assert.equal(
    getWaterLevelVisualState({
      rate: 0.8,
      available: false,
      currentLevel: 1,
      threshold: 2,
    }),
    "unavailable",
  );
});

test("gera classe visual previsível para o tema editorial", () => {
  assert.equal(waterLevelStateClass("flood"), "level-state--flood");
  assert.equal(waterLevelStateClass("stable"), "level-state--stable");
  assert.equal(
    waterLevelStateClass("unavailable"),
    "level-state--unavailable",
  );
});
