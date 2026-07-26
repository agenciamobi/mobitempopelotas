import assert from "node:assert/strict";
import test from "node:test";

import { calculateMoonPhase, resolveMoonPhase } from "../src/production/lib/astronomy.ts";

test("calendário do INMET mantém o quarto crescente na data oficial", () => {
  assert.equal(calculateMoonPhase("2026-07-21"), "Quarto crescente");
});

test("intervalo entre quarto crescente e lua cheia é crescente gibosa", () => {
  assert.equal(calculateMoonPhase("2026-07-25"), "Crescente gibosa");
  assert.equal(calculateMoonPhase("2026-07-26"), "Crescente gibosa");
  assert.equal(calculateMoonPhase("2026-07-28"), "Crescente gibosa");
});

test("lua cheia começa na data publicada pelo INMET", () => {
  assert.equal(calculateMoonPhase("2026-07-29"), "Lua cheia");
});

test("depois da lua cheia a fase passa a minguante gibosa", () => {
  assert.equal(calculateMoonPhase("2026-07-30"), "Minguante gibosa");
});

test("datas cobertas pelo calendário oficial identificam o INMET como origem", () => {
  assert.deepEqual(resolveMoonPhase("2026-07-26"), {
    name: "Crescente gibosa",
    source: "INMET",
  });
});

test("datas fora da tabela oficial usam cálculo astronômico de oito fases", () => {
  const resolution = resolveMoonPhase("2027-07-26");
  assert.equal(typeof resolution.name, "string");
  assert.equal(resolution.source, "Cálculo astronômico");
});

test("cálculo lunar aceita datas ausentes sem lançar erro", () => {
  assert.equal(typeof calculateMoonPhase(null), "string");
});
