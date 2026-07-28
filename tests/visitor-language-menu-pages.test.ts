import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync("src/components/layout/Header.tsx", "utf8");
const widgets = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const atmosphere = readFileSync("src/components/weather/TodayAtmosphericSignals.tsx", "utf8");
const tomorrow = readFileSync("src/components/weather/TomorrowForecastPageV3.tsx", "utf8");
const sevenDay = readFileSync("src/components/weather/SevenDayForecastPageV2.tsx", "utf8");
const rain = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const wind = readFileSync("src/components/weather/WindForecastPageV3.tsx", "utf8");
const alerts = readFileSync("src/components/weather/WeatherAlertsPage.tsx", "utf8");
const meteogram = readFileSync("src/components/weather/MeteogramPage.tsx", "utf8");
const embrapa = readFileSync("src/components/embrapa/EmbrapaStationPageV2.tsx", "utf8");
const cameras = readFileSync("src/components/cameras/CameraPageV2.tsx", "utf8");
const frost = readFileSync("src/components/inmet/FrostMapPageV2.tsx", "utf8");
const hydrology = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const hydrologyHero = readFileSync("src/components/hydrology/HydrologyEditorialHero.tsx", "utf8");
const hydrologyPages = readFileSync("src/components/hydrology/HydrologyPages.tsx", "utf8");
const methodology = readFileSync("src/components/methodology/MethodologyPage.tsx", "utf8");

const primaryVisitorSources = [header, widgets, atmosphere, tomorrow, sevenDay, rain, wind, alerts];
const auditedVisitorSources = [
  ...primaryVisitorSources,
  meteogram,
  embrapa,
  cameras,
  frost,
  hydrology,
  hydrologyHero,
  hydrologyPages,
  methodology,
];
const visibleCopy = primaryVisitorSources.join("\n");
const auditedCopy = auditedVisitorSources.join("\n");

test("main menu uses language visitors can understand without portal jargon", () => {
  assert.match(header, /Imagens e medições/);
  assert.match(header, /Entenda e compare/);
  assert.match(header, /Previsão hora a hora/);
  assert.match(header, /Como os dados funcionam/);
  assert.match(header, /Níveis e medições/);
  assert.match(header, /Alertas e explicações/);
  assert.match(header, />Abrir <i aria-hidden="true">→<\/i><\/b>/);
  assert.doesNotMatch(header, /Contexto e transparência/);
  assert.doesNotMatch(header, /Acompanhamento hídrico/);
  assert.doesNotMatch(header, />Explorar </);
});

test("current condition uses field-level origin and plain labels", () => {
  assert.match(widgets, /currentProvenance\.temperature === "embrapa"/);
  assert.match(widgets, /Temperatura e condições agora em Pelotas/);
  assert.match(widgets, /Medição da Estação Embrapa/);
  assert.match(widgets, /Estimativa do modelo para agora/);
  assert.match(widgets, /Vento agora/);
  assert.match(widgets, /Atualizado em/);
  assert.doesNotMatch(widgets, /quality\.currentSource === "embrapa"/);
  assert.doesNotMatch(widgets, /Vento observado/);
  assert.doesNotMatch(widgets, /Leitura atualizada em/);
});

test("atmospheric section explains technical indices in familiar language", () => {
  assert.match(atmosphere, /Possibilidade de neblina/);
  assert.match(atmosphere, /Possibilidade de tempestade/);
  assert.match(atmosphere, /Camadas de nuvens nas próximas horas/);
  assert.match(atmosphere, /A pressão deve/);
  assert.doesNotMatch(atmosphere, /Sinal ainda não calculável/);
  assert.doesNotMatch(atmosphere, /Energia convectiva/);
  assert.doesNotMatch(atmosphere, /Instabilidade convectiva/);
  assert.doesNotMatch(atmosphere, /Tendência de pressão não calculável/);
});

test("forecast pages avoid internal scoring and source-management language", () => {
  assert.match(tomorrow, /Amanhã em resumo/);
  assert.match(tomorrow, /Confira antes de sair/);
  assert.match(sevenDay, /Menor chance de chuva e rajadas/);
  assert.match(sevenDay, /Mais chuva ou rajadas/);
  assert.match(rain, /Chuva em resumo/);
  assert.match(rain, /Dias com previsão de chuva/);
  assert.match(wind, /Rajadas de até \$\{number\(maximum\)\} km\/h nas próximas 24h/);
  assert.doesNotMatch(visibleCopy, /faixa editorial/i);
  assert.doesNotMatch(visibleCopy, /procedência campo a campo/i);
  assert.doesNotMatch(visibleCopy, /vento consolidado/i);
  assert.doesNotMatch(visibleCopy, /maior sinal de chuva/i);
  assert.doesNotMatch(visibleCopy, /Condição do dia:/);
  assert.doesNotMatch(visibleCopy, /contexto complementar/i);
  assert.doesNotMatch(visibleCopy, /não publicaram contexto/i);
});

test("alerts page states availability and counts directly", () => {
  assert.match(alerts, /Dados do INMET/);
  assert.match(alerts, /Disponíveis/);
  assert.match(alerts, /Indisponíveis/);
  assert.match(alerts, /Ver aviso em destaque/);
  assert.match(alerts, /Nenhum alerta oficial para Pelotas/);
  assert.match(alerts, /alertCountLabel/);
  assert.doesNotMatch(alerts, /Fonte<\/span><strong>\{source\.usable \? "Disponível" : "Restrita"\}/);
  assert.doesNotMatch(alerts, /situação prioritária/i);
  assert.doesNotMatch(alerts, /resumo da consulta/i);
  assert.doesNotMatch(alerts, /encontrado\(s\)/i);
});

test("monitoring pages use direct labels while retaining necessary explanations", () => {
  assert.match(meteogram, /Previsão hora a hora/);
  assert.match(meteogram, /Possibilidade de tempestade/);
  assert.match(embrapa, /Origem dos dados/);
  assert.match(embrapa, /Situação da estação/);
  assert.match(cameras, /Vídeo disponível/);
  assert.match(cameras, /Origem do vídeo/);
  assert.match(frost, /Dados do INMET/);
  assert.match(frost, /Lista de registros/);
});

test("water and methodology pages use visitor-facing wording", () => {
  assert.match(hydrology, /Leitura atualizada/);
  assert.match(hydrology, /Vento agora/);
  assert.match(hydrologyHero, /Medição local · Estação Laranjal/);
  assert.match(hydrologyPages, /Medição da Estação Laranjal/);
  assert.match(methodology, /Como os dados funcionam/);
  assert.match(methodology, /Fontes disponíveis/);
  assert.match(methodology, /Caminho dos dados/);
});

test("audited visitor interfaces do not expose internal operational phrases", () => {
  for (const phrase of [
    /faixa editorial/i,
    /procedência/i,
    /rastreabilidade/i,
    /estado da integração/i,
    /telemetria atualizada/i,
    /telemetria indisponível/i,
    /fonte de contingência/i,
    /pico de CAPE/i,
    /energia convectiva/i,
    /produto de estação automática/i,
    /consulta inicial/i,
    /vento consolidado agora/i,
    /estável no recorte/i,
    /contexto previsto/i,
    /consulta consolidada/i,
    /transparência operacional/i,
  ]) {
    assert.doesNotMatch(auditedCopy, phrase);
  }
});
