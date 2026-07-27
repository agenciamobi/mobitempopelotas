import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/radar-e-satelite-pelotas.tsx", "utf8");
const page = readFileSync("src/components/redemet/RedemetOverview.tsx", "utf8");
const styles = readFileSync("src/components/redemet/RedemetRetail.css", "utf8");

const remValues = [...styles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("radar route uses direct SEO copy and page-specific editorial content", () => {
  assert.match(route, /Radar e satélite em Pelotas/);
  assert.match(route, /Acompanhe radar meteorológico, imagens de satélite e trovoadas/);
  assert.match(route, /RADAR_PAGE_CONTENT/);
  assert.match(route, /Como interpretar radar, satélite e trovoadas em Pelotas/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, RADAR_PAGE_CONTENT\.faqs\)/);
  assert.match(route, /Horário das imagens meteorológicas/);
});

test("radar page is organized around observation tasks instead of technical products", () => {
  assert.match(page, /InternalPageChapters/);
  assert.match(page, /Visão geral/);
  assert.match(page, /Radar e satélite em Pelotas/);
  assert.match(page, /chuva, nuvens e trovoadas/);
  assert.match(page, /Sinais de precipitação na região de Pelotas/);
  assert.match(page, /Nuvens sobre Pelotas e a Região Sul/);
  assert.match(page, /Trovoadas detectadas no quadro selecionado/);
  assert.match(page, /Imagem meteorológica não é alerta automático/);
  assert.match(page, /latestObservedAt/);
  assert.match(page, /Observado em \{formatDateTime\(selectedFrame\.observedAt\)\}/);
  assert.match(page, /Imagem \{selectedIndex \+ 1\} de \{layer\.frames\.length\}/);
  assert.match(page, /Abrir fonte oficial/);
  assert.match(page, /avisos oficiais para Pelotas/);
  assert.doesNotMatch(page, /camadas respondendo/);
  assert.doesNotMatch(page, /Transparência operacional/);
  assert.doesNotMatch(page, /Fonte respondendo/);
});

test("radar, satellite and storms remain explicitly distinct", () => {
  assert.match(page, /Radar: sinais de precipitação/);
  assert.match(page, /Satélite: cobertura de nuvens/);
  assert.match(page, /Trovoadas: atividade elétrica/);
  assert.match(page, /Nuvem visível não confirma chuva no solo/);
  assert.match(page, /Detecção de trovoada não é aviso meteorológico/);
  assert.match(page, /O radar pode mostrar ecos sem confirmar chuva no seu bairro/);
});

test("radar retail layout follows the portal rail and remains readable", () => {
  assert.match(styles, /max-width:\s*var\(--portal-frame-max, 1760px\)/);
  assert.match(styles, /padding:\s*0 var\(--portal-content-gutter/);
  assert.match(styles, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.redemet-layer-card\.is-featured/);
  assert.match(styles, /@media \(max-width: 1180px\)/);
  assert.match(styles, /@media \(max-width: 920px\)/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /@media \(max-width: 480px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.ok(remValues.every((value) => value >= 0.75), "microtext must remain readable");
});
