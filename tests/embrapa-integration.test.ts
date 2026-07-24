import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeResponseHtml,
  parseEmbrapaObservationHtml,
} from "../src/lib/weather/embrapa.server.ts";
import { getObservationAgeMinutes } from "../src/lib/weather/current-observation.ts";

const EMBRAPA_HTML = `
<html>
<head><meta http-equiv="content-type" content="text/html; charset=ISO-8859-1"></head>
<body>
  <label>Temperatura do ar</label><label>16.7&nbsp;°C</label>
  <label>Umidade relativa do ar</label><label>89&nbsp;%</label>
  <label>Sensação térmica</label><label>17.0&nbsp;°C</label>
  <label>Ponto de orvalho</label><label>14.9&nbsp;°C</label>
  <label>Pressão atmosférica</label><label>1017.7&nbsp;mb&nbsp;Steady</label>
  <label>Direção e velocidade do vento</label><label>NNE&nbsp;&nbsp;1.6&nbsp;km/hr</label>
  <label>Nascer e pôr do sol</label><label>7:23 - 17:49</label>
  <label>Temperatura mínima</label><label>8.6&nbsp;°C - 4:50</label>
  <label>Temperatura máxima</label><label>18.9&nbsp;°C - 12:41</label>
  <label>Umidade relativa mínima</label><label>82&nbsp;% - 13:16</label>
  <label>Umidade relativa máxima</label><label>97&nbsp;% - 6:49</label>
  <label>Ponto de orvalho mínimo</label><label>7.8&nbsp;°C - 4:50</label>
  <label>Ponto de orvalho máximo</label><label>16.7&nbsp;°C - 12:39</label>
  <label>Velocidade do vento máxima</label><label>25.7&nbsp;km/hr - 14:26</label>
  <label>Chuva diária</label><label>0.2&nbsp;mm</label>
  <label>Chuva mensal</label><label>134.8&nbsp;mm</label>
  <label>Chuva anual</label><label>613.6&nbsp;mm</label>
  <label>Evapotranspiração diária</label><label>1.27&nbsp;mm</label>
  <label>Evapotranspiração mensal</label><label>33.02&nbsp;mm</label>
  <label>Evapotranspiração anual</label><label>570.74&nbsp;mm</label>
</body>
</html>
`;

test("parser reconhece o HTML real do Current_Monitor da Embrapa", () => {
  const fetchedAt = "2026-07-24T19:56:30.000Z";
  const result = parseEmbrapaObservationHtml(EMBRAPA_HTML, fetchedAt);

  assert.equal(result.status, "live");
  assert.equal(result.current.temperature, 16.7);
  assert.equal(result.current.humidity, 89);
  assert.equal(result.current.feelsLike, 17);
  assert.equal(result.current.dewPoint, 14.9);
  assert.equal(result.current.pressure, 1017.7);
  assert.equal(result.current.pressureTrend, "estável");
  assert.equal(result.current.windDirection, "NNE");
  assert.equal(result.current.windSpeed, 1.6);
  assert.equal(result.current.sunrise, "7:23");
  assert.equal(result.current.sunset, "17:49");
  assert.deepEqual(result.extremes.temperatureMin, { value: 8.6, time: "4:50" });
  assert.deepEqual(result.extremes.temperatureMax, { value: 18.9, time: "12:41" });
  assert.deepEqual(result.extremes.dewPointMin, { value: 7.8, time: "4:50" });
  assert.deepEqual(result.extremes.dewPointMax, { value: 16.7, time: "12:39" });
  assert.equal(result.accumulated.rainDaily, 0.2);
  assert.equal(result.accumulated.rainMonthly, 134.8);
  assert.equal(result.accumulated.rainAnnual, 613.6);
  assert.equal(result.accumulated.evapotranspirationDaily, 1.27);
  assert.equal(result.accumulated.evapotranspirationMonthly, 33.02);
  assert.equal(result.accumulated.evapotranspirationAnnual, 570.74);
  assert.equal(result.source.observationTime, null);
  assert.equal(getObservationAgeMinutes(result), 0);
});

test("resposta ISO-8859-1 preserva os rótulos acentuados usados pelo parser", () => {
  const source = "Pressão atmosférica";
  const bytes = Uint8Array.from(source, (character) => character.charCodeAt(0));
  const response = new Response(null, {
    headers: { "Content-Type": "text/html; charset=ISO-8859-1" },
  });

  assert.equal(decodeResponseHtml(response, bytes.buffer), source);
});
