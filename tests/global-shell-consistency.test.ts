import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getFooterLead } from "../src/components/layout/footer-content.ts";

const headerWrapper = readFileSync(
  new URL("../src/production/components/site-header.tsx", import.meta.url),
  "utf8",
);
const footerWrapper = readFileSync(
  new URL("../src/production/components/site-footer.tsx", import.meta.url),
  "utf8",
);
const globalHeader = readFileSync(
  new URL("../src/components/layout/Header.tsx", import.meta.url),
  "utf8",
);
const globalFooter = readFileSync(
  new URL("../src/components/layout/Footer.tsx", import.meta.url),
  "utf8",
);

test("telas standalone reutilizam o mesmo header e rodapé globais", () => {
  assert.match(headerWrapper, /<Header advisoryLevel=/);
  assert.doesNotMatch(headerWrapper, /megaMenus|mobileNavItems|footerGroups/);
  assert.match(footerWrapper, /<Footer source=/);
  assert.doesNotMatch(footerWrapper, /footerGroups|Fontes meteorológicas e locais/);
});

test("navegação institucional existe em uma única definição canônica", () => {
  for (const label of [
    "Previsão de hoje",
    "Tempo amanhã",
    "Próximos 7 dias",
    "Estação Embrapa",
    "Radar e satélite",
    "Câmeras ao vivo",
    "Situação das águas",
    "Avisos oficiais",
  ]) {
    assert.match(globalHeader, new RegExp(label));
  }

  for (const label of [
    "Chuva em Pelotas",
    "Vento em Pelotas",
    "Lagoa dos Patos no Laranjal",
    "Metodologia e fontes",
    "Embrapa Clima Temperado",
    "REDEMET/DECEA",
    "Ecossistema MOBI",
  ]) {
    assert.match(globalFooter, new RegExp(label));
  }
});

test("somente o lead do rodapé muda conforme o assunto", () => {
  assert.equal(getFooterLead("/chuva-em-pelotas").eyebrow, "Previsão para Pelotas");
  assert.equal(getFooterLead("/estacao-embrapa-pelotas").eyebrow, "Monitoramento local");
  assert.equal(getFooterLead("/situacao-hidrologica-pelotas").eyebrow, "Águas de Pelotas e região");
  assert.equal(getFooterLead("/alertas").eyebrow, "Segurança meteorológica");
  assert.equal(getFooterLead("/privacidade-e-dados").eyebrow, "Tempo e águas de Pelotas");
});
