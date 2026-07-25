import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/metodologia.tsx", "utf8");
const component = readFileSync("src/components/methodology/MethodologyPage.tsx", "utf8");
const refinement = readFileSync(
  "src/components/methodology/MethodologyPageRefinement.css",
  "utf8",
);

test("a rota de metodologia consulta todas as integrações meteorológicas e hidrológicas ativas", () => {
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /getLaranjalLevelData\(\)/);
  assert.match(route, /getRedemetOverview\(\)/);
  assert.match(route, /getGuaibaObservation\(\)/);
  assert.match(route, /getLagoonMonitoringNetwork\(\)/);
  assert.match(route, /guaiba=\{data\.guaiba\}/);
  assert.match(route, /lagoon=\{data\.lagoon\}/);
});

test("o inventário apresenta cinco integrações meteorológicas e três hidrológicas", () => {
  for (const sourceId of [
    "embrapa",
    "inmet",
    "cppmet",
    "redemet",
    "forecast",
    "laranjal",
    "guaiba",
    "lagoon-network",
  ]) {
    assert.match(component, new RegExp(`id: "${sourceId}"`));
  }

  assert.match(component, /meteorologyCards\.length/);
  assert.match(component, /hydrologyCards\.length/);
  assert.match(component, /guaiba\.source\.name/);
  assert.match(component, /guaiba\.station/);
  assert.match(component, /lagoon\.source\.organizations/);
  assert.match(component, /lagoon\.available/);
  assert.match(component, /lagoon\.total/);
});

test("a nota exibida é identificada como qualidade meteorológica e a síntese mostra sua origem real", () => {
  assert.match(component, />Qualidade meteorológica</);
  assert.match(component, /weather\.weather\.quality\.score/);
  assert.match(component, /weather\.intelligence\.origin === "gemini"/);
  assert.match(component, /Síntese assistida por Gemini/);
  assert.match(component, /Regras determinísticas/);
  assert.doesNotMatch(component, />Estado atual<\/span>/);
});

test("o conteúdo explica corretamente os limites das réguas e das previsões", () => {
  assert.match(component, /Cada régua possui referência vertical e cota próprias/);
  assert.match(component, /não devem ser comparados diretamente/);
  assert.match(component, /não prevê\s+o nível do Laranjal apenas a partir do Guaíba/);
  assert.match(component, /modelo global principal/);
  assert.match(component, /modelo global de contingência/);
});

test("links externos e capítulos permanecem acessíveis", () => {
  assert.match(component, /className="methodology-chapter-nav"/);
  assert.match(component, /href="#fontes-ativas"/);
  assert.match(component, /href="#fluxo-dados"/);
  assert.match(component, /href="#regras-integridade"/);
  assert.match(component, /href="#tipos-informacao"/);
  assert.match(component, /href="#limites-uso"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /aria-label=\{`Consultar \$\{source\.organization\} em nova aba`\}/);
});

test("a camada visual remove blur e segue a composição editorial responsiva", () => {
  assert.match(component, /MethodologyPageRefinement\.css/);
  assert.match(refinement, /backdrop-filter:\s*none/);
  assert.match(refinement, /\.methodology-chapter-nav/);
  assert.match(refinement, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(refinement, /data-category="hydrology"/);
  assert.match(refinement, /content-visibility:\s*auto/);
  assert.match(refinement, /@media \(max-width: 680px\)/);
  assert.match(refinement, /@media \(prefers-reduced-motion: reduce\)/);
});
