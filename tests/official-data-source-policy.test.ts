import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const notice = readFileSync("src/components/content/OfficialDataAccessNotice.tsx", "utf8");
const methodology = readFileSync("src/routes/metodologia.tsx", "utf8");
const policy = readFileSync("docs/OFFICIAL_DATA_SOURCE_POLICY.md", "utf8");

test("public copy separates official source from Tempo Pelotas dissemination role", () => {
  assert.match(notice, /plataforma local de integração, organização e disseminação/);
  assert.match(notice, /fontes institucionais dos dados/);
  assert.match(notice, /credenciais de acesso à API da REDEMET\/DECEA/);
  assert.match(notice, /teve acesso concedido à plataforma integrada/);
  assert.match(notice, /não significa homologação, certificação, parceria formal ou chancela editorial/);
});

test("methodology metadata describes integration and dissemination of official sources", () => {
  assert.match(methodology, /integra e dissemina fontes oficiais/);
  assert.match(methodology, /Integração e disseminação de informações oficiais/);
});

test("institutional policy protects attribution and future INMET push wording", () => {
  assert.match(policy, /fonte oficial x canal de disseminação/i);
  assert.match(policy, /INMET — aviso meteorológico oficial, disseminado pelo Tempo Pelotas/);
  assert.match(policy, /PWA \/ Web Push/);
  assert.match(policy, /não deve se apresentar como órgão oficial emissor/);
  assert.match(policy, /homologado pela REDEMET/);
  assert.match(policy, /homologado pela ANA/);
});
