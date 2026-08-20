import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/status-dos-dados.tsx", "utf8");
const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");
const layout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const footerStatusCss = readFileSync("src/components/layout/FooterStatusLink.css", "utf8");

test("status page checks the main runtime data integrations", () => {
  assert.match(route, /getWeatherIntelligence/);
  assert.match(route, /getRedemetOverview/);
  assert.match(route, /getLaranjalLevelData/);
  assert.match(route, /getGuaibaObservation/);
  assert.match(route, /ANA \/ SNIRH \/ RHN/);
  assert.match(route, /"operational" \| "partial" \| "maintenance" \| "offline" \| "implementation"/);
});

test("footer uses visitor-friendly availability wording and links to the status page", () => {
  assert.doesNotMatch(footer, /Operação em contingência/);
  assert.match(footer, /Algumas informações estão com atualização parcial/);
  assert.match(footer, /Dados e fontes monitorados/);
  assert.match(footer, /to="\/status-dos-dados"/);
  assert.match(footer, /Confira o status dos dados/);
  assert.match(footerStatusCss, /\.tp-home-footer-status__link/);
  assert.match(footerStatusCss, /\.editorial-footer-status__link/);
});

test("status page owns its shell and avoids duplicate global header and footer", () => {
  assert.match(layout, /"\/status-dos-dados"/);
  assert.match(route, /<SiteHeader advisoryLevel="normal" \/>/);
  assert.match(route, /<SiteFooter source=\{footerSource\} \/>/);
});

test("status page explains partial, offline, maintenance and implementation states", () => {
  assert.match(route, /Atualização parcial/);
  assert.match(route, /Em manutenção/);
  assert.match(route, /Offline/);
  assert.match(route, /Em implantação/);
  assert.match(route, /Uma fonte offline não significa que todo o portal parou/);
});
