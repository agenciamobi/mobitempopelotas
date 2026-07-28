import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const page = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/HydrologyOverviewV2.css", "utf8");

const hydrologySource = `${route}\n${page}`;

test("hydrology route loads five independent sources in the shared shell", () => {
  assert.match(route, /createFileRoute\("\/situacao-hidrologica-pelotas"\)/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /getLaranjalLevelData\(\)/);
  assert.match(route, /getGuaibaObservation\(\)/);
  assert.match(route, /getLagoonMonitoringNetwork\(\)/);
  assert.match(route, /getSaceGuaibaData\(\)/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /HydrologyOverviewHero/);
  assert.match(route, /HydrologyOverviewV2/);
  assert.match(route, /pageClassName="internal-weather-shell--hydrology"/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /staleTime: 60 \* 1_000/);
});

test("local telemetry distinguishes live, stale and unavailable readings", () => {
  assert.match(page, /level\.status === "live"/);
  assert.match(page, /level\.status === "stale"/);
  assert.match(page, /Última leitura conhecida/);
  assert.match(page, /não como nível atual/);
  assert.match(page, /Telemetria indisponível/);
  assert.match(page, /não preenche a ausência da fonte com nível estimado/);
  assert.match(page, /role="status"/);
  assert.doesNotMatch(page, /level\.status === "stale"[^\n]{0,180}nível atual/i);
});

test("measurement time, age and portal query remain separate", () => {
  assert.match(page, /Horário da medição/);
  assert.match(page, /Idade da leitura/);
  assert.match(page, /Consulta do portal/);
  assert.match(page, /formatDateTime\(level\.updatedAt\)/);
  assert.match(page, /ageLabel\(level\.ageMinutes\)/);
  assert.match(page, /formatDateTime\(level\.source\.fetchedAt\)/);
});

test("Laranjal level preserves its technical reference and avoids cross-station conversion", () => {
  assert.match(page, /referência técnica do equipamento/);
  assert.match(page, /não deve ser comparado diretamente com cotas de outras estações/);
  assert.match(page, /Não é classificação de risco/);
  assert.match(page, /não utiliza as cotas oficiais de[\s\S]*outras estações/);
  assert.match(route, /não possui conversão automática para cotas de outras estações/);
  assert.match(route, /não são convertidas em classificação local para o Laranjal/);
  assert.doesNotMatch(hydrologySource, /cota de inundação do Laranjal:\s*\d/i);
});

test("local series exposes trend and changes without inventing missing data", () => {
  assert.match(page, /level\.series\.length < 2/);
  assert.match(page, /level\.trendCmPerHour/);
  assert.match(page, /level\.change1hCm/);
  assert.match(page, /level\.change6hCm/);
  assert.match(page, /level\.change24hCm/);
  assert.match(page, /level\.periodMinimum/);
  assert.match(page, /level\.periodAverage/);
  assert.match(page, /level\.periodMaximum/);
  assert.match(page, /Não há pontos suficientes/);
  assert.match(page, /A ausência do sensor não é substituída por estimativa/);
});

test("regional network and SACE remain contextual rather than local forecasts", () => {
  assert.match(page, /RegionalWaterNetwork/);
  assert.match(page, /SaceGuaibaContext/);
  assert.match(page, /Cada rede responde a uma pergunta diferente/);
  assert.match(page, /não converte automaticamente níveis e categorias/);
  assert.match(route, /Nenhuma estação distante prevê sozinha o nível futuro em Pelotas/);
  assert.match(route, /Uma estação elevada no SACE significa que o Laranjal vai subir\?/);
  assert.match(route, /sem transformá-la em risco para Pelotas/);
});

test("weather context is clearly forecast and limited to 24 hours", () => {
  assert.match(page, /weather\.weather\.hourly\.slice\(0, 24\)/);
  assert.match(page, /Contexto previsto · próximas 24 horas/);
  assert.match(page, /Estes valores são previsão meteorológica, não medição hidrológica/);
  assert.match(page, /precipitationMm/);
  assert.match(page, /precipitationProbability/);
  assert.match(page, /windGust/);
  assert.match(page, /não permitem calcular sozinhos o nível futuro/);
});

test("absence of transmission is never interpreted as normal level", () => {
  assert.match(page, /Uma estação sem transmissão não deve ser interpretada como nível normal/);
  assert.match(route, /Ausência de transmissão significa ausência de dado atual/);
  assert.match(route, /Ausência de transmissão significa que o rio está normal\?/);
  assert.doesNotMatch(hydrologySource, /sem transmissão[^\n]{0,100}nível normal\./i);
});

test("hydrology page publishes transparent dataset metadata only with a local reading", () => {
  assert.match(page, /const datasetSchema = level\.currentLevel !== null/);
  assert.match(page, /"@type": "Dataset"/);
  assert.match(page, /spatialCoverage/);
  assert.match(page, /level\.source\.url/);
  assert.match(page, /lagoon\.source\.url/);
  assert.match(page, /sace\.source\.url/);
  assert.match(page, /isAccessibleForFree: true/);
});

test("hydrology overview follows responsive retail and accessibility contracts", () => {
  assert.match(styles, /internal-weather-shell--hydrology \.hydrology-v2-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /scroll-margin-top:\s*8rem/);
  assert.match(styles, /@media \(max-width: 1320px\)/);
  assert.match(styles, /@media \(max-width: 1080px\)/);
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[0-6][0-9]rem/);
});
