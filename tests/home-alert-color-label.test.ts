import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panel = readFileSync("src/production/components/inmet-alerts-panel.tsx", "utf8");

test("homepage names official alert colors before the event", () => {
  assert.match(panel, /potential:\s*"Alerta amarelo"/);
  assert.match(panel, /danger:\s*"Alerta laranja"/);
  assert.match(panel, /"great-danger":\s*"Alerta vermelho"/);
  assert.match(panel, /function homepageAlertTitle/);
  assert.match(panel, /\{title\}<\/h2>/);
});

test("homepage keeps INMET as the alert issuer and links to details", () => {
  assert.match(panel, /Aviso oficial do INMET/);
  assert.match(panel, /href="\/alertas"/);
  assert.match(panel, /Áreas e orientações oficiais/);
});
