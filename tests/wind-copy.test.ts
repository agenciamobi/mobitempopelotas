import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const page = readFileSync("src/components/weather/WindForecastPageV2.tsx", "utf8");

test("wind route uses the dedicated source-aware page", () => {
  assert.match(route, /WindForecastPageV2/);
  assert.match(route, /pageClassName="internal-weather-shell--wind"/);
  assert.match(route, /Veja o vento em Pelotas com velocidade e direção atuais/);
  assert.match(route, /WIND_PAGE_CONTENT/);
  assert.match(route, /Como ler velocidade, direção e rajadas em Pelotas/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, WIND_PAGE_CONTENT\.faqs\)/);
  assert.doesNotMatch(route, /WindPage/);
  assert.doesNotMatch(route, /RainWindPages/);
});

test("wind page distinguishes observed wind from forecast gusts", () => {
  assert.match(page, /Vento em Pelotas: velocidade, direção e rajadas/);
  assert.match(page, /observedByEmbrapa/);
  assert.match(page, /Observado pela Embrapa/);
  assert.match(page, /Estimado pelo modelo/);
  assert.match(page, /As rajadas abaixo são previsões do modelo/);
  assert.match(page, /formatWind\(current\?\.windSpeed, current\?\.windDirection\)/);
  assert.match(page, /Maior rajada nas próximas 12 horas/);
  assert.match(page, /Maior rajada nos próximos 7 dias/);
  assert.match(page, /Velocidade e rajadas previstas por horário/);
  assert.match(page, /Rajada máxima prevista em cada dia/);
});

test("wind copy avoids technical or ambiguous legacy language", () => {
  assert.doesNotMatch(page, /Alta confiança/);
  assert.doesNotMatch(page, /Confiança moderada/);
  assert.doesNotMatch(page, /Índice \{quality\.score\}/);
  assert.doesNotMatch(page, /km\/h medidos/);
  assert.doesNotMatch(page, /Evolução do vento e das rajadas/);
  assert.doesNotMatch(page, /A Embrapa mediu vento de/);
  assert.doesNotMatch(page, /exclusivamente previstos/);
});

test("wind FAQ answers the main interpretation questions", () => {
  assert.match(route, /Qual é a diferença entre velocidade do vento e rajada\?/);
  assert.match(route, /O que significa a direção do vento\?/);
  assert.match(route, /O vento mostrado agora foi medido\?/);
  assert.match(route, /Quando as rajadas exigem mais atenção\?/);
});
