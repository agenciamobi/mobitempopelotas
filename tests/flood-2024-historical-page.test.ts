import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/enchente-2024-pelotas-laranjal.tsx", "utf8");
const page = readFileSync("src/components/history/Flood2024HistoricalPage.tsx", "utf8");
const content = readFileSync("src/lib/content/flood-2024-pelotas.ts", "utf8");
const css = readFileSync("src/components/history/Flood2024HistoricalPage.css", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("2024 flood record is a public canonical editorial route", () => {
  assert.match(route, /createFileRoute\("\/enchente-2024-pelotas-laranjal"\)/);
  assert.match(route, /Enchente de 2024 em Pelotas e no Laranjal: linha do tempo histórica/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(publicRoutes, /\/enchente-2024-pelotas-laranjal/);
});

test("historical narrative preserves the hydrological chain from north to the ocean", () => {
  const order = [
    "Centro e Norte do RS",
    "Taquari, Caí, Sinos, Jacuí e outros rios",
    "Guaíba — Porto Alegre",
    "Lagoa dos Patos",
    "Itapuã",
    "Arambaré",
    "São Lourenço do Sul",
    "Pelotas — Laranjal",
    "São José do Norte e Rio Grande",
    "Oceano Atlântico",
  ];

  let previous = -1;
  for (const label of order) {
    const index = content.indexOf(label);
    assert.ok(index > previous, `${label} deve preservar a ordem hidrológica`);
    previous = index;
  }
});

test("timeline preserves the main Pelotas flood milestones", () => {
  assert.match(content, /5,35 metros no Guaíba/);
  assert.match(content, /2,88 metros/);
  assert.match(content, /2,89 metros/);
  assert.match(content, /3,04 metros/);
  assert.match(content, /28 dias/);
  assert.match(content, /54 dias/);
});

test("page explains why Pelotas flooded later and links history to current monitoring", () => {
  assert.match(page, /Por que Pelotas inundou dias depois de Porto Alegre\?/);
  assert.match(page, /Onde estava o problema/);
  assert.match(page, /Situação atual das águas/);
  assert.match(page, /Nível e histórico do Laranjal/);
  assert.match(page, /referências altimétricas distintas/);
});

test("timeline is responsive and uses an explicit stage layer", () => {
  assert.match(css, /\.tp-flood-event\.is-guaiba/);
  assert.match(css, /\.tp-flood-event\.is-lagoa/);
  assert.match(css, /\.tp-flood-event\.is-pelotas/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.tp-flood-path/);
});
