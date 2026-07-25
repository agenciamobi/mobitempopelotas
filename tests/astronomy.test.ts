import assert from "node:assert/strict";
import test from "node:test";

import { calculateMoonPhase } from "../src/production/lib/astronomy.ts";

test("fase lunar de 25 de julho de 2026 segue a leitura de quarto crescente", () => {
  assert.equal(calculateMoonPhase("2026-07-25"), "Quarto crescente");
});

test("cálculo lunar aceita datas ausentes sem lançar erro", () => {
  assert.equal(typeof calculateMoonPhase(null), "string");
});
