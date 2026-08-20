import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  normalizeGuaibaSeries,
  normalizeMetsulGuaibaSeries,
} from "../src/lib/hydrology/guaiba.server.ts";

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
  assert.equal(observation.floodReference, 3);
  assert.equal(observation.updatedAt, "2026-07-25T18:00:00.000Z");
  assert.equal(observation.trendCmPerHour, 2);
  assert.equal(observation.series.at(-1)?.level, 2.02);
  assert.equal(observation.series.some((point) => point.level === 9.999), false);
});

test("a série do Nível Guaíba preserva a referência própria da Usina do Gasômetro", () => {
  const observation = normalizeGuaibaSeries(
    {
      "2026-07-25 12:00": 1.2,
      "2026-07-25 18:00": 1.26,
    },
    new Date("2026-07-25T21:10:00.000Z"),
  );

  assert.equal(observation.station, "Usina do Gasômetro");
  assert.equal(observation.source.name, "Nível Guaíba");
  assert.equal(observation.floodReference, 2.6);
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

test("consulta as duas réguas de Porto Alegre e mantém uma seleção compatível para consumidores antigos", () => {
  assert.match(source, /https:\/\/metsul\.com\/wp-json\/custom\/v1\/nivel-guaiba/);
  assert.match(source, /https:\/\/nivelguaiba\.com\.br\/portoalegre\.json/);
  assert.match(source, /Promise\.allSettled\(\[/);
  assert.match(source, /toReference\("gasometro", "Nível do Guaíba", gasometro\)/);
  assert.match(source, /toReference\("cais-maua", "Cais Mauá", caisMaua\)/);
  assert.match(source, /metsulObservation\.status === "live"/);
  assert.match(source, /fallbackObservation\.status === "live"/);
  assert.match(source, /GASOMETRO_FLOOD_REFERENCE_METERS = 2\.6/);
  assert.match(source, /CAIS_MAUA_FLOOD_REFERENCE_METERS = 3/);
});

test("a homepage identifica apenas a régua usada, sem expor o provedor no rótulo legado", () => {
  assert.match(semanticDashboard, /guaibaReferenceLabel/);
  assert.match(semanticDashboard, /guaibaReferenceLabel:\s*dashboardProps\.guaiba\.station/);
  assert.doesNotMatch(
    semanticDashboard,
    /guaibaReferenceLabel:[^\n]*dashboardProps\.guaiba\.source\.name/,
  );
  assert.match(semanticDashboard, /normalizedText === "Referência adicional"/);
});
