const EMBRAPA_MONITOR_URL =
  "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm";
const REVALIDATE_SECONDS = 300;

export type EmbrapaObservationStatus = "live" | "partial" | "unavailable";

export type TimedObservation = {
  value: number | null;
  time: string | null;
};

export type EmbrapaObservationData = {
  status: EmbrapaObservationStatus;
  current: {
    temperature: number | null;
    humidity: number | null;
    feelsLike: number | null;
    dewPoint: number | null;
    pressure: number | null;
    pressureTrend: string | null;
    windDirection: string | null;
    windSpeed: number | null;
    sunrise: string | null;
    sunset: string | null;
  };
  extremes: {
    temperatureMin: TimedObservation;
    temperatureMax: TimedObservation;
    humidityMin: TimedObservation;
    humidityMax: TimedObservation;
    dewPointMin: TimedObservation;
    dewPointMax: TimedObservation;
    windSpeedMax: TimedObservation;
  };
  accumulated: {
    rainDaily: number | null;
    rainMonthly: number | null;
    rainAnnual: number | null;
    evapotranspirationDaily: number | null;
    evapotranspirationMonthly: number | null;
    evapotranspirationAnnual: number | null;
  };
  source: {
    name: string;
    station: string;
    url: string;
    latitude: number;
    longitude: number;
    altitude: number;
    fetchedAt: string;
    observationTime: string | null;
  };
  error: string | null;
};

function emptyTimedObservation(): TimedObservation {
  return { value: null, time: null };
}

function unavailableObservation(error: string): EmbrapaObservationData {
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
      dewPointMin: emptyTimedObservation(),
      dewPointMax: emptyTimedObservation(),
      windSpeedMax: emptyTimedObservation(),
    },
    accumulated: {
      rainDaily: null,
      rainMonthly: null,
      rainAnnual: null,
      evapotranspirationDaily: null,
      evapotranspirationMonthly: null,
      evapotranspirationAnnual: null,
    },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: EMBRAPA_MONITOR_URL,
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt: new Date().toISOString(),
      observationTime: null,
    },
    error,
  };
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    deg: "°",
    ordm: "º",
    acute: "´",
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      namedEntities[name.toLowerCase()] ?? entity,
    );
}

function htmlToText(html: string) {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:br|\/p|\/div|\/tr|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(text)
    .replace(/\r/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n\s*/g, "\n")
    .trim();
}

function normalizeForMatching(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\u00a0/g, " ");
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function extractNumber(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return parseNumber(match?.[1]);
}

function extractTimedObservation(text: string, pattern: RegExp): TimedObservation {
  const match = text.match(pattern);

  return {
    value: parseNumber(match?.[1]),
    time: match?.[2] ?? null,
  };
}

function translatePressureTrend(value: string | undefined) {
  if (!value) return null;

  const trends: Record<string, string> = {
    "rising rapidly": "subindo rapidamente",
    "rising slowly": "subindo lentamente",
    rising: "subindo",
    steady: "estável",
    "falling slowly": "caindo lentamente",
    "falling rapidly": "caindo rapidamente",
    falling: "caindo",
  };

  return trends[value.trim().toLowerCase()] ?? value.trim();
}

function extractObservationTime(text: string) {
  const patterns = [
    /(?:atualizado|atualizacao|ultima leitura)[^\d]{0,35}(\d{1,2}:\d{2})/i,
    /(?:current|reading)[^\d]{0,35}(\d{1,2}:\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function parseEmbrapaObservationHtml(
  html: string,
  fetchedAt = new Date().toISOString(),
): EmbrapaObservationData {
  const text = normalizeForMatching(htmlToText(html));
  const pressureMatch = text.match(
    /Pressao atmosferica\s*(-?\d+(?:[.,]\d+)?)\s*(?:mb|hpa)?\s*(Rising Rapidly|Rising Slowly|Rising|Steady|Falling Slowly|Falling Rapidly|Falling)?/i,
  );
  const windMatch = text.match(
    /Direcao e velocidade do vento\s*([A-Z]{1,4}|CALM|VAR)\s*(-?\d+(?:[.,]\d+)?)\s*km\/?h(?:r)?/i,
  );
  const sunMatch = text.match(
    /Nascer e por do sol\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/i,
  );

  const data: EmbrapaObservationData = {
    status: "partial",
    current: {
      temperature: extractNumber(
        text,
        /Temperatura do ar\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C/i,
      ),
      humidity: extractNumber(
        text,
        /Umidade relativa do ar\s*(\d+(?:[.,]\d+)?)\s*%/i,
      ),
      feelsLike: extractNumber(
        text,
        /Sensacao termica\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C/i,
      ),
      dewPoint: extractNumber(
        text,
        /Ponto de orvalho\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C/i,
      ),
      pressure: parseNumber(pressureMatch?.[1]),
      pressureTrend: translatePressureTrend(pressureMatch?.[2]),
      windDirection: windMatch?.[1] ?? null,
      windSpeed: parseNumber(windMatch?.[2]),
      sunrise: sunMatch?.[1] ?? null,
      sunset: sunMatch?.[2] ?? null,
    },
    extremes: {
      temperatureMin: extractTimedObservation(
        text,
        /Temperatura minima\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      temperatureMax: extractTimedObservation(
        text,
        /Temperatura maxima\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      humidityMin: extractTimedObservation(
        text,
        /Umidade relativa minima\s*(\d+(?:[.,]\d+)?)\s*%\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      humidityMax: extractTimedObservation(
        text,
        /Umidade relativa maxima\s*(\d+(?:[.,]\d+)?)\s*%\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      dewPointMin: extractTimedObservation(
        text,
        /Ponto de orvalho minimo\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      dewPointMax: extractTimedObservation(
        text,
        /Ponto de orvalho maximo\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C\s*-\s*(\d{1,2}:\d{2})/i,
      ),
      windSpeedMax: extractTimedObservation(
        text,
        /Velocidade do vento maxima\s*(\d+(?:[.,]\d+)?)\s*km\/?h(?:r)?\s*-\s*(\d{1,2}:\d{2})/i,
      ),
    },
    accumulated: {
      rainDaily: extractNumber(
        text,
        /Chuva diaria\s*(\d+(?:[.,]\d+)?)\s*mm/i,
      ),
      rainMonthly: extractNumber(
        text,
        /Chuva mensal\s*(\d+(?:[.,]\d+)?)\s*mm/i,
      ),
      rainAnnual: extractNumber(
        text,
        /Chuva anual\s*(\d+(?:[.,]\d+)?)\s*mm/i,
      ),
      evapotranspirationDaily: extractNumber(
        text,
        /Evapotranspiracao diaria\s*(\d+(?:[.,]\d+)?)\s*mm/i,
      ),
      evapotranspirationMonthly: extractNumber(
        text,
        /Evapotranspiracao mensal\s*(\d+(?:[.,]\d+)?)\s*mm/i,
      ),
      evapotranspirationAnnual: extractNumber(
        text,
        /Evapotranspiracao anual\s*(\d+(?:[.,]\d+)?)\s*mm/i,
      ),
    },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: EMBRAPA_MONITOR_URL,
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt,
      observationTime: extractObservationTime(text),
    },
    error: null,
  };

  const essentialValues = [
    data.current.temperature,
    data.current.humidity,
    data.current.pressure,
    data.current.windSpeed,
    data.accumulated.rainDaily,
  ].filter((value) => value !== null).length;

  data.status = essentialValues >= 4 ? "live" : essentialValues >= 2 ? "partial" : "unavailable";
  data.error =
    data.status === "unavailable"
      ? "A página foi consultada, mas as leituras não puderam ser reconhecidas."
      : null;

  return data;
}

export async function getEmbrapaObservation(): Promise<EmbrapaObservationData> {
  try {
    const response = await fetch(EMBRAPA_MONITOR_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "TEMPO-Pelotas/1.0 (+https://tempopelotas.agenciamobi.com.br)",
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Embrapa respondeu com status ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const html = new TextDecoder("windows-1252").decode(buffer);
    const data = parseEmbrapaObservationHtml(html);

    if (data.status === "unavailable") {
      console.error("Parser da Embrapa não reconheceu leituras suficientes");
    }

    return data;
  } catch (error) {
    console.error("Falha ao carregar observações da Embrapa:", error);
    return unavailableObservation(
      "A estação da Embrapa está temporariamente indisponível para consulta automática.",
    );
  }
}

export { EMBRAPA_MONITOR_URL };
