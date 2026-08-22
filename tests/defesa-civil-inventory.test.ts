import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const server = readFileSync("src/lib/hydrology/defesa-civil-rs.server.ts", "utf8");
const area = readFileSync("src/components/hydrology/DefesaCivilHydroNetwork.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/DefesaCivilHydroInventory.css", "utf8");
const endpoint = readFileSync("src/routes/api/defesa-civil/stations.ts", "utf8");

test("Defesa Civil station inventory preserves official capability flags", () => {
  assert.match(server, /filter:[\s\S]*relacao:/);
  assert.match(server, /tem_chuva_acumulada/);
  assert.match(server, /tem_nivel_do_rio/);
  assert.match(server, /tem_pressao_atmosferica/);
  assert.match(server, /tem_umidade/);
  assert.match(server, /tem_vento/);
  assert.match(server, /function toFlag/);
  assert.match(server, /function stationCapabilities/);
});

test("Defesa Civil classifies stations from capabilities instead of station names", () => {
  assert.match(server, /DefesaCivilStationClassification/);
  assert.match(server, /"HYDROLOGY"/);
  assert.match(server, /"METEOROLOGY"/);
  assert.match(server, /"BOTH"/);
  assert.match(server, /"UNKNOWN"/);
  assert.match(server, /const hydrology = capabilities\.riverLevel/);
  assert.match(server, /const meteorology =/);
  assert.doesNotMatch(server, /stationName\(station\)[\s\S]{0,160}(HYDROLOGY|METEOROLOGY|BOTH)/);
});

test("Defesa Civil preserves richer documented hydrology and rainfall fields as optional data", () => {
  assert.match(server, /rio_nivel_tendencia \{ value \}/);
  assert.match(server, /rio_area_drenagem \{ value \}/);
  assert.match(server, /h048 \{ value \}/);
  assert.match(server, /h072 \{ value \}/);
  assert.match(server, /h096 \{ value \}/);
  assert.match(server, /h120 \{ value \}/);
  assert.match(server, /h144 \{ value \}/);
  assert.match(server, /trend: metricText\(station\.data\?\.rio\?\.rio_nivel_tendencia\)/);
  assert.match(server, /drainageArea: metricValue\(station\.data\?\.rio\?\.rio_area_drenagem\)/);
  assert.match(server, /h48Mm: metricValue\(rain\?\.h048\)/);
  assert.match(server, /h144Mm: metricValue\(rain\?\.h144\)/);
  assert.doesNotMatch(server, /\?\?\s*0\b/);
});

test("regional inventory counts each dynamic station classification", () => {
  assert.match(server, /inventory: Record<DefesaCivilStationClassification, number>/);
  assert.match(server, /emptyInventory\(\)/);
  assert.match(server, /summary\[station\.classification\] \+= 1/);
  assert.match(area, /data\.inventory\.HYDROLOGY/);
  assert.match(area, /data\.inventory\.METEOROLOGY/);
  assert.match(area, /data\.inventory\.BOTH/);
  assert.match(area, /data\.inventory\.UNKNOWN/);
});

test("public UI explains capability classification without converting it into risk", () => {
  assert.match(area, /Inventário regional por capacidade/);
  assert.match(area, /Classificação automática baseada nas capacidades e variáveis/);
  assert.match(area, /não representa risco, prioridade ou estado operacional oficial/);
  assert.match(area, /Tendência informada pela estação/);
  assert.match(area, /não é convertido pelo Tempo Pelotas em classificação de\s+risco/);
  assert.match(area, /Fonte oficial e créditos/);
  assert.match(area, /Dados disponibilizados pela Defesa Civil RS através da MKS/);
});

test("sanitized public endpoint exposes only normalized station inventory", () => {
  assert.match(endpoint, /createFileRoute\("\/api\/defesa-civil\/stations"\)/);
  assert.match(endpoint, /fetchDefesaCivilHydroData\(\)/);
  assert.match(endpoint, /X-Robots-Tag": "noindex, nofollow"/);
  assert.match(endpoint, /X-Content-Type-Options": "nosniff"/);
  assert.match(endpoint, /classification: station\.classification/);
  assert.match(endpoint, /capabilities: station\.capabilities/);
  assert.match(endpoint, /trend: station\.river\.trend/);
  assert.match(endpoint, /h144Mm: station\.rain\.h144Mm/);
  assert.doesNotMatch(endpoint, /raw|cookie|authorization|token|secret/i);
  assert.doesNotMatch(endpoint, /drainageArea/);
});

test("inventory UI remains responsive and readable", () => {
  assert.match(styles, /\.defesa-civil-hydro__inventory/);
  assert.match(styles, /\.defesa-civil-hydro__classification/);
  assert.match(styles, /\.defesa-civil-hydro__river-trend/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
