import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { normalizeMetsulGuaibaSeries } from "../src/lib/hydrology/guaiba.server.ts";

const source = readFileSync("src/lib/hydrology/guaiba.server.ts", "utf8");
const semanticDashboard = readFileSync(
  "src/production/components/home-editorial-dashboard-semantic.tsx",
  "utf8",
);

test("normaliza a série da régua do Cais Mauá e ignora o registro ainda em consolidação", () => {
  const observation = normalizeMetsulGuaibaSeries(
    [
      {
        year: "2026",
        month: "7",
        day: "25",
        hour: "12",
        minute: "0",
        second: "0",
        level: "1.900",
      },
      {
        year: "2026",
        month: "7",
        day: "25",
        hour: "18",
        minute: "0",
        second: "0",
        level: "2.020",
      },
      {
        year: "2026",
        month: "7",
        day: "25",
        hour: "18",
        minute: "15",
        second: "0",
        level: "9.999",
      },
    ],
    new Date("2026-07-25T18:30:00.000Z"),
  );

  assert.equal(observation.status, "live");
  assert.equal(observation.station, "Régua do Cais Mauá");
  assert.equal(observation.location, "Porto Alegre / RS");
  assert.equal(observation.source.name, "MetSul / TideSat Global");
  assert.equal(observation.source.originalInstitutions, "TideSat Global");
  assert.equal(observation.currentLevel, 2.02);
  assert.equal(observation.updatedAt, "2026-07-25T18:00:00.000Z");
  assert.equal(observation.trendCmPerHour, 2);
  assert.equal(observation.series.at(-1)?.level, 2.02);
  assert.equal(observation.series.some((point) => point.level === 9.999), false);
});

test("sinaliza atraso quando a última leitura do Cais Mauá passa de duas horas", () => {
  const observation = normalizeMetsulGuaibaSeries(
    [
      { year: 2026, month: 7, day: 25, hour: 12, minute: 0, second: 0, level: 1.9 },
      { year: 2026, month: 7, day: 25, hour: 18, minute: 0, second: 0, level: 2 },
      { year: 2026, month: 7, day: 25, hour: 18, minute: 15, second: 0, level: 2 },
    ],
    new Date("2026-07-25T21:00:01.000Z"),
  );

  assert.equal(observation.status, "stale");
  assert.equal(observation.ageMinutes, 181);
  assert.match(observation.error ?? "", /atrasada/i);
});

test("consulta primeiro a MetSul e mantém a Usina do Gasômetro como contingência", () => {
  assert.match(source, /https:\/\/metsul\.com\/wp-json\/custom\/v1\/nivel-guaiba/);
  assert.match(source, /https:\/\/metsul\.com\/nivel-do-guaiba\//);
  assert.match(source, /const METSUL_SOURCE/);
  assert.match(source, /if \(metsulObservation\.status === "live"\) return metsulObservation/);
  assert.match(source, /fetchFallbackObservation/);
  assert.match(source, /Usina do Gasômetro/);
  assert.match(source, /Cota de transbordamento|FLOOD_REFERENCE_METERS = 3/);
});

test("a homepage identifica visualmente qual régua e fonte estão em uso", () => {
  assert.match(semanticDashboard, /guaibaReferenceLabel/);
  assert.match(semanticDashboard, /dashboardProps\.guaiba\.station/);
  assert.match(semanticDashboard, /dashboardProps\.guaiba\.source\.name/);
  assert.match(semanticDashboard, /normalizedText === "Referência adicional"/);
});
