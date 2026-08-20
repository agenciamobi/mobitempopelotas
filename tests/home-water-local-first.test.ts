import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const water = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const waterCss = readFileSync("src/production/components/home-water-editorial.css", "utf8");

test("homepage water chapter treats Laranjal as the local reference", () => {
  assert.match(water, /Nível da Lagoa no Laranjal e referências regionais/);
  assert.match(water, /Praia do Laranjal/);
  assert.match(water, /Fonte local/);
  assert.match(water, /laranjal\.source\.name/);
  assert.match(water, /Mudança em 6 h/);
  assert.match(water, /Mudança em 24 h/);
  assert.match(water, /formatSignedCentimeters/);
});

test("regional water references follow Guaiba to ocean geographic order", () => {
  const gasometroRank = water.indexOf('["gasometro", 0]');
  const caisRank = water.indexOf('["cais-maua", 1]');
  assert.ok(gasometroRank >= 0 && caisRank > gasometroRank);

  const itapua = water.indexOf('"itapua"');
  const arambare = water.indexOf('"arambare"');
  const saoLourenco = water.indexOf('"sao-lourenco-do-sul"');
  const saoJose = water.indexOf('"sao-jose-do-norte"');
  const rioGrande = water.indexOf('"furg-ccmar"');

  assert.ok(itapua >= 0);
  assert.ok(arambare > itapua);
  assert.ok(saoLourenco > arambare);
  assert.ok(saoJose > saoLourenco);
  assert.ok(rioGrande > saoJose);

  assert.match(water, /Porto Alegre \/ RS — Usina do Gasômetro/);
  assert.match(water, /Porto Alegre \/ RS — Cais Mauá/);
});

test("regional network preserves source context and local reference semantics", () => {
  assert.match(water, /Pontos para acompanhar a Lagoa dos Patos/);
  assert.match(water, /As réguas possuem referências próprias/);
  assert.match(water, /station\.station\.role/);
  assert.match(water, /is-risk-\$\{station\.risk\}/);
  assert.match(water, /lagoon\.source\.organizations/);
});

test("water chapter keeps breathing room after the regional station list", () => {
  assert.match(
    waterCss,
    /\.tp-home-water__network\s*\{[\s\S]*padding:\s*32px 0 28px clamp\(34px, 4vw, 54px\)/,
  );
  assert.match(
    waterCss,
    /\.tp-home-water__footer\s*\{[\s\S]*padding-top:\s*26px/,
  );
  assert.match(waterCss, /@media \(max-width: 720px\)[\s\S]*padding-bottom:\s*24px/);
});

test("water chapter stays open, responsive and free of dashboard chrome", () => {
  assert.match(waterCss, /Civic Tech local-first/);
  assert.match(waterCss, /Laranjal domina a leitura/);
  assert.match(waterCss, /\.tp-home-water__level strong\s*\{[\s\S]*8rem/);
  assert.match(waterCss, /\.tp-home-water__rows article/);
  assert.match(waterCss, /\.tp-home-water__station\.is-risk-attention::before/);
  assert.match(waterCss, /@media \(max-width: 720px\)/);
  assert.match(waterCss, /@media \(max-width: 460px\)/);
  assert.doesNotMatch(waterCss, /box-shadow/);
  assert.doesNotMatch(waterCss, /!important/);
});
