import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const page = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/HydrologyOverviewV2.css", "utf8");
const homeContract = readFileSync(
  "src/components/hydrology/HydrologyOverviewHomeContract.css",
  "utf8",
);
const defesaCivilServer = readFileSync("src/lib/hydrology/defesa-civil-rs.server.ts", "utf8");
const defesaCivilFunction = readFileSync("src/lib/hydrology/defesa-civil-rs.functions.ts", "utf8");
const defesaCivilArea = readFileSync(
  "src/components/hydrology/DefesaCivilHydroNetwork.tsx",
  "utf8",
);
const defesaCivilMap = readFileSync("src/components/hydrology/DefesaCivilHydroMap.tsx", "utf8");
const defesaCivilStyles = readFileSync(
  "src/components/hydrology/DefesaCivilHydroNetwork.css",
  "utf8",
);

const hydrologySource = `${route}\n${page}`;
const defesaCivilSource = `${defesaCivilServer}\n${defesaCivilFunction}\n${defesaCivilArea}\n${defesaCivilMap}`;

test("hydrology route loads six independent sources in the shared shell", () => {
  assert.match(route, /createFileRoute\("\/situacao-hidrologica-pelotas"\)/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /getLaranjalLevelData\(\)/);
  assert.match(route, /getGuaibaObservation\(\)/);
  assert.match(route, /getLagoonMonitoringNetwork\(\)/);
  assert.match(route, /getSaceGuaibaData\(\)/);
  assert.match(route, /getDefesaCivilHydroData\(\)/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /HydrologyOverviewHero/);
  assert.match(route, /HydrologyOverviewV2/);
  assert.match(route, /DefesaCivilHydroNetwork/);
  assert.match(route, /data=\{data\.defesaCivil\}/);
  assert.match(route, /HydrologyOverviewHomeContract\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--hydrology"/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /staleTime: 60 \* 1_000/);
});

test("Defesa Civil RS integration is server-side, public-contract based and publication-gated", () => {
  assert.match(
    defesaCivilServer,
    /https:\/\/redehidrometeorologica\.defesacivil\.rs\.gov\.br\/graphql/,
  );
  assert.match(defesaCivilServer, /casa-militar-defesa-civil-rs/);
  assert.match(defesaCivilServer, /codigos: \["43"\]/);
  assert.match(defesaCivilServer, /tipo: UNIDADE_FEDERATIVA/);
  assert.match(defesaCivilServer, /DEFESA_CIVIL_HYDRO_ENABLED/);
  assert.match(defesaCivilServer, /process\.env\.DEFESA_CIVIL_HYDRO_ENABLED/);
  assert.match(defesaCivilServer, /if \(!enabled\)/);
  assert.match(defesaCivilServer, /emptyData\("disabled"/);
  assert.match(defesaCivilArea, /data\.status === "disabled"/);
  assert.match(defesaCivilFunction, /createServerFn\(\{ method: "GET" \}\)/);
  assert.match(defesaCivilFunction, /stale-while-revalidate=300/);
  assert.doesNotMatch(defesaCivilSource, /VITE_DEFESA_CIVIL/i);
  assert.doesNotMatch(defesaCivilSource, /api[_-]?key|authorization:\s*bearer/i);
});

test("Defesa Civil RS adapter preserves observation identity, timestamp and missing-data semantics", () => {
  assert.match(defesaCivilServer, /stationSchema/);
  assert.match(defesaCivilServer, /codigo: z\.string\(\)\.min\(1\)/);
  assert.match(defesaCivilServer, /observedAt/);
  assert.match(defesaCivilServer, /ageMinutes/);
  assert.match(defesaCivilServer, /freshness/);
  assert.match(defesaCivilServer, /river:[\s\S]*levelM/);
  assert.match(defesaCivilServer, /h24Mm/);
  assert.match(defesaCivilServer, /temperatureC/);
  assert.match(defesaCivilServer, /humidityPct/);
  assert.match(defesaCivilServer, /windAverageKmh/);
  assert.match(defesaCivilServer, /REGIONAL_RADIUS_KM = 320/);
  assert.match(defesaCivilServer, /distanceFromPelotasKm/);
  assert.match(defesaCivilServer, /Number\.isFinite\(parsed\) \? parsed : null/);
  assert.match(defesaCivilServer, /if \(!normalized\) return null/);
  assert.match(defesaCivilServer, /FUTURE_TIMESTAMP_TOLERANCE_MS = 5 \* 60_000/);
  assert.match(defesaCivilServer, /function trustedObservedAt/);
  assert.match(
    defesaCivilServer,
    /observed\.getTime\(\) > fetchedAt\.getTime\(\) \+ FUTURE_TIMESTAMP_TOLERANCE_MS/,
  );
  assert.match(
    defesaCivilServer,
    /const observedAt = trustedObservedAt\(station\.timestamp, fetchedAt\)/,
  );
  assert.doesNotMatch(defesaCivilServer, /\?\?\s*0\b/);
});

test("Defesa Civil RS area keeps observed data separate from alert and risk classification", () => {
  assert.match(defesaCivilArea, /Rede oficial · Defesa Civil RS/);
  assert.match(
    defesaCivilArea,
    /não transforma essas medições em alerta ou previsão\s+de cheia/,
  );
  assert.match(
    defesaCivilArea,
    /não\s+representa estado operacional, nível de atenção ou classificação oficial de\s+risco/,
  );
  assert.match(
    defesaCivilArea,
    /não\s+substitui os canais oficiais de alerta e orientação da\s+Defesa Civil/,
  );
  assert.match(defesaCivilArea, /Fonte e responsabilidade dos dados/);
  assert.match(defesaCivilArea, /Abrir mapa oficial/);
  assert.match(defesaCivilArea, /Documentação da API/);
  assert.match(defesaCivilArea, /formatDateTime\(station\.observedAt\)/);
  assert.match(defesaCivilArea, /ageLabel\(station\.ageMinutes\)/);
});

test("Defesa Civil RS map and section preserve safe rendering and responsive accessibility", () => {
  assert.match(defesaCivilMap, /void import\("maplibre-gl"\)/);
  assert.match(defesaCivilMap, /setText\(/);
  assert.doesNotMatch(defesaCivilMap, /setHTML\(/);
  assert.match(defesaCivilMap, /cooperativeGestures: true/);
  assert.match(defesaCivilMap, /map\.dragRotate\.disable\(\)/);
  assert.match(defesaCivilMap, /Defesa Civil RS — Rede de Monitoramento Hidrometeorológico/);
  assert.match(defesaCivilStyles, /content-visibility:\s*auto/);
  assert.match(defesaCivilStyles, /scroll-margin-top:\s*8rem/);
  assert.match(defesaCivilStyles, /@media \(max-width: 680px\)/);
  assert.match(defesaCivilStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(defesaCivilStyles, /@media \(forced-colors: active\)/);
  assert.match(defesaCivilStyles, /:focus-visible/);
});

test("local station distinguishes live, stale and unavailable readings", () => {
  assert.match(page, /level\.status === "live"/);
  assert.match(page, /level\.status === "stale"/);
  assert.match(page, /Última leitura conhecida/);
  assert.match(page, /não como nível atual/);
  assert.match(page, /Leitura indisponível/);
  assert.match(page, /não substitui a ausência da estação por um nível estimado/);
  assert.match(page, /role="status"/);
  assert.doesNotMatch(page, /level\.status === "stale"[^\n]{0,220}label:\s*"Nível atual"/i);
});

test("measurement time, age and portal update remain separate", () => {
  assert.match(page, /Horário da medição/);
  assert.match(page, /Tempo desde a leitura/);
  assert.match(page, /Última atualização/);
  assert.match(page, /formatDateTime\(level\.updatedAt\)/);
  assert.match(page, /ageLabel\(level\.ageMinutes\)/);
  assert.match(page, /formatDateTime\(level\.source\.fetchedAt\)/);
});

test("Laranjal level preserves its own reference and avoids cross-station conversion", () => {
  assert.match(page, /referência própria do equipamento/);
  assert.match(page, /não deve ser comparado diretamente com números absolutos de outras estações/);
  assert.match(page, /Este valor não é uma classificação de risco/);
  assert.match(page, /não usa as[\s\S]*cotas de Atenção, Alerta ou Inundação de outras estações/);
  assert.match(route, /os números não devem ser comparados por simples subtração/i);
  assert.match(route, /não são convertidas em classificação para o Laranjal/);
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
  assert.match(page, /Não há medições suficientes/);
  assert.match(page, /não é substituída por uma estimativa de nível/);
});

test("regional network and SACE remain context rather than local forecasts", () => {
  assert.match(page, /RegionalWaterNetwork/);
  assert.match(page, /SaceGuaibaContext/);
  assert.match(page, /Cada estação deve ser lida na sua própria referência/);
  assert.match(page, /não transforma automaticamente níveis e categorias/);
  assert.match(route, /A situação dos rios ajuda a entender o cenário/);
  assert.match(route, /Uma estação elevada no SACE significa que o Laranjal vai subir\?/);
  assert.match(route, /sem transformá-la em risco para Pelotas/);
});

test("weather information is clearly forecast and limited to 24 hours", () => {
  assert.match(page, /weather\.weather\.hourly\.slice\(0, 24\)/);
  assert.match(page, /Previsão para as próximas 24 horas/);
  assert.match(page, /Estes valores são previsão do tempo, não medições do nível da água/);
  assert.match(page, /precipitationMm/);
  assert.match(page, /precipitationProbability/);
  assert.match(page, /windGust/);
  assert.match(page, /não calculam sozinhos quanto o nível do Laranjal vai subir ou baixar/);
});

test("absence of transmission is never interpreted as normal level", () => {
  assert.match(page, /Uma estação sem transmissão não deve ser interpretada como nível normal/);
  assert.match(route, /Quando uma estação não transmite, não há dado atual/);
  assert.match(route, /Ausência de transmissão significa que o rio está normal\?/);
  assert.doesNotMatch(hydrologySource, /sem transmissão\s+(?:significa|confirma|indica)\s+(?:que\s+)?(?:o\s+)?nível normal/i);
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

test("hydrology Home contract restores water identity without overriding source semantics", () => {
  assert.match(homeContract, /Situação das águas — acento hidrológico/);
  assert.match(homeContract, /\.hydrology-v2-hero__content::before/);
  assert.match(homeContract, /\.hydrology-v2-hero__reading::before/);
  assert.match(homeContract, /radial-gradient/);
  assert.match(homeContract, /\.hydrology-v2-hero__trend\.is-rising/);
  assert.match(homeContract, /\.hydrology-v2-hero__trend\.is-falling/);
  assert.match(homeContract, /\.hydrology-v2-chapters[\s\S]*box-shadow:\s*none/);
  assert.match(homeContract, /min-height:\s*44px/);
  assert.doesNotMatch(homeContract, /!important/);
});
