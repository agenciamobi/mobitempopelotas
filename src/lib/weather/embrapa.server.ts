import type { EmbrapaObservation, TimedObservation } from "./official-sources.types";

const SOURCE_URL = "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm";
const REQUEST_TIMEOUT_MS = 8_000;

function emptyTimedObservation(): TimedObservation {
  return { value: null, time: null };
}

function unavailable(error: string): EmbrapaObservation {
  return {
    status: "unavailable",
    current: {
      temperature: null,
      humidity: null,
      feelsLike: null,
      dewPoint: null,
      pressure: null,
      pressureTrend: null,
      windDirection: null,
      windSpeed: null,
      sunrise: null,
      sunset: null,
    },
    extremes: {
      temperatureMin: emptyTimedObservation(),
      temperatureMax: emptyTimedObservation(),
      humidityMin: emptyTimedObservation(),
      humidityMax: emptyTimedObservation(),
      windSpeedMax: emptyTimedObservation(),
    },
    accumulated: { rainDaily: null, rainMonthly: null, rainAnnual: null },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: SOURCE_URL,
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt: new Date().toISOString(),
      observationTime: null,
    },
    error,
  };
}

function decodeHtml(value: string) {
  const entities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    deg: "°",
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) => entities[name.toLowerCase()] ?? entity);
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(?:br|\/p|\/div|\/tr|\/li|\/h[1-6])\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n\s*/g, "\n")
    .trim();
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractNumber(text: string, pattern: RegExp) {
  return parseNumber(text.match(pattern)?.[1]);
}

function extractTimed(text: string, pattern: RegExp): TimedObservation {
  const match = text.match(pattern);
  return { value: parseNumber(match?.[1]), time: match?.[2] ?? null };
}

function pressureTrend(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const translations: Record<string, string> = {
    rising: "subindo",
    "rising slowly": "subindo lentamente",
    "rising rapidly": "subindo rapidamente",
    steady: "estável",
    falling: "caindo",
    "falling slowly": "caindo lentamente",
    "falling rapidly": "caindo rapidamente",
  };
  return translations[normalized] ?? value.trim();
}

export function parseEmbrapaObservationHtml(
  html: string,
  fetchedAt = new Date().toISOString(),
): EmbrapaObservation {
  const text = htmlToText(html);
  const pressure = text.match(
    /Pressao atmosferica\s*(-?\d+(?:[.,]\d+)?)\s*(?:mb|hpa)?\s*(Rising Rapidly|Rising Slowly|Rising|Steady|Falling Slowly|Falling Rapidly|Falling)?/i,
  );
  const wind = text.match(
    /Direcao e velocidade do vento\s*([A-Z]{1,4}|CALM|VAR)\s*(-?\d+(?:[.,]\d+)?)\s*km\/?h(?:r)?/i,
  );
  const sun = text.match(/Nascer e por do sol\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/i);
  const observationTime = text.match(
    /(?:atualizado|atualizacao|ultima leitura|current|reading)[^\d]{0,35}(\d{1,2}:\d{2})/i,
  )?.[1];

  const data: EmbrapaObservation = {
    status: "partial",
    current: {
      temperature: extractNumber(text, /Temperatura do ar\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C/i),
      humidity: extractNumber(text, /Umidade relativa do ar\s*(\d+(?:[.,]\d+)?)\s*%/i),
      feelsLike: extractNumber(text, /Sensacao termica\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C/i),
      dewPoint: extractNumber(text, /Ponto de orvalho\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C/i),
      pressure: parseNumber(pressure?.[1]),
      pressureTrend: pressureTrend(pressure?.[2]),
      windDirection: wind?.[1] ?? null,
      windSpeed: parseNumber(wind?.[2]),
      sunrise: sun?.[1] ?? null,
      sunset: sun?.[2] ?? null,
    },
    extremes: {
      temperatureMin: extractTimed(
        text,
        /Temperatura minima\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      temperatureMax: extractTimed(
        text,
        /Temperatura maxima\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      humidityMin: extractTimed(
        text,
        /Umidade relativa minima\s*(\d+(?:[.,]\d+)?)\s*%\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      humidityMax: extractTimed(
        text,
        /Umidade relativa maxima\s*(\d+(?:[.,]\d+)?)\s*%\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      windSpeedMax: extractTimed(
        text,
        /Velocidade do vento maxima\s*(\d+(?:[.,]\d+)?)\s*km\/?h(?:r)?\s*-\s*(\d{1,2}:\d{2})/i,
      ),
    },
    accumulated: {
      rainDaily: extractNumber(text, /Chuva diaria\s*(\d+(?:[.,]\d+)?)\s*mm/i),
      rainMonthly: extractNumber(text, /Chuva mensal\s*(\d+(?:[.,]\d+)?)\s*mm/i),
      rainAnnual: extractNumber(text, /Chuva anual\s*(\d+(?:[.,]\d+)?)\s*mm/i),
    },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: SOURCE_URL,
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt,
      observationTime: observationTime ?? null,
    },
    error: null,
  };

  const recognized = [
    data.current.temperature,
    data.current.humidity,
    data.current.pressure,
    data.current.windSpeed,
    data.accumulated.rainDaily,
  ].filter((value) => value !== null).length;

  data.status = recognized >= 4 ? "live" : recognized >= 2 ? "partial" : "unavailable";
  data.error =
    data.status === "unavailable"
      ? "A página foi consultada, mas as leituras não puderam ser reconhecidas."
      : null;
  return data;
}

export async function fetchEmbrapaObservation(): Promise<EmbrapaObservation> {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "TEMPO-Pelotas/2.0 (+https://www.tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`Embrapa respondeu com HTTP ${response.status}.`);
    return parseEmbrapaObservationHtml(await response.text());
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : "Falha desconhecida ao consultar a Embrapa.");
  }
}
