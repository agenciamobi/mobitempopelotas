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

const visitorSources = [header, widgets, atmosphere, tomorrow, sevenDay, rain, wind, alerts];
const visibleCopy = visitorSources.join("\n");

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
