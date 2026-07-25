import assert from "node:assert/strict";
import test from "node:test";

import { parseInmetForecastPayload } from "../src/lib/weather/inmet-forecast.server.ts";
import { parseInmetStationPayload } from "../src/lib/weather/inmet-station.server.ts";

test("previsão municipal do INMET reconhece períodos aninhados e preserva valores ausentes", () => {
  const periods = parseInmetForecastPayload({
    "2026-07-24": {
      manha: {
        resumo: "Muitas nuvens com possibilidade de chuva isolada.",
        temp_min: "11 °C",
        temp_max: "17 °C",
        umidade_min: "70%",
        umidade_max: "95%",
        dir_vento: "SE",
        int_vento: "Fracos",
      },
      noite: {
        descricao: "Céu encoberto.",
        temp_min: "não informado",
        temp_max: null,
      },
    },
  });

  assert.equal(periods.length, 2);
  assert.deepEqual(
    periods.map((period) => ({
      date: period.date,
      period: period.period,
      minimum: period.minimum,
      maximum: period.maximum,
    })),
    [
      { date: "2026-07-24", period: "Manhã", minimum: 11, maximum: 17 },
      { date: "2026-07-24", period: "Noite", minimum: null, maximum: null },
    ],
  );
  assert.equal(periods[0]?.humidityMinimum, 70);
  assert.equal(periods[0]?.humidityMaximum, 95);
  assert.equal(periods[0]?.windDirection, "SE");
});

test("previsão do INMET elimina períodos duplicados", () => {
  const periods = parseInmetForecastPayload([
    {
      data: "25/07/2026",
      periodo: "Tarde",
      resumo: "Parcialmente nublado.",
      minima: 12,
      maxima: 19,
    },
    {
      data: "25/07/2026",
      periodo: "Tarde",
      resumo: "Parcialmente nublado.",
      minima: 12,
      maxima: 19,
    },
  ]);

  assert.equal(periods.length, 1);
  assert.equal(periods[0]?.date, "2026-07-25");
});

test("estação próxima do INMET é extraída sem transformar campos inválidos em zero", () => {
  const station = parseInmetStationPayload({
    resultado: [
      {
        CD_ESTACAO: "A887",
        DC_NOME: "PELOTAS",
        MUNICIPIO: "Pelotas",
        UF: "RS",
        VL_LATITUDE: "-31,8025",
        VL_LONGITUDE: "-52,4072",
        VL_ALTITUDE: "13 m",
        DISTANCIA_KM: "não informado",
      },
    ],
  });

  assert.ok(station);
  assert.equal(station.code, "A887");
  assert.equal(station.name, "PELOTAS");
  assert.equal(station.latitude, -31.8025);
  assert.equal(station.longitude, -52.4072);
  assert.equal(station.altitude, 13);
  assert.equal(station.distanceKm, null);
});

test("payloads sem estrutura meteorológica reconhecível permanecem vazios", () => {
  assert.deepEqual(parseInmetForecastPayload({ mensagem: "sem dados" }), []);
  assert.equal(parseInmetStationPayload({ mensagem: "sem dados" }), null);
});
