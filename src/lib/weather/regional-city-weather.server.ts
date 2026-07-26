import { z } from "zod";

import { findRegionalCity } from "@/lib/regional-cities";
import type {
  RegionalAlertSeverity,
  RegionalCityAlert,
  RegionalCityWeatherData,
} from "./regional-city-weather.types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_URL = "https://open-meteo.com/";
const INMET_PORTAL_URL = "https://avisos.inmet.gov.br/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 10 * 60 * 1_000;

const cache = new Map<string, { storedAt: number; data: RegionalCityWeatherData }>();
const nullableNumber = z.number().finite().nullable();

const forecastSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: nullableNumber,
    apparent_temperature: nullableNumber,
    relative_humidity_2m: nullableNumber,
    pressure_msl: nullableNumber,
    precipitation: nullableNumber,
    wind_speed_10m: nullableNumber,
    wind_gusts_10m: nullableNumber,
    wind_direction_10m: nullableNumber,
    weather_code: nullableNumber,
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(nullableNumber),
    precipitation_probability: z.array(nullableNumber),
    precipitation: z.array(nullableNumber),
    wind_speed_10m: z.array(nullableNumber),
    wind_gusts_10m: z.array(nullableNumber),
    weather_code: z.array(nullableNumber),
  }),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_min: z.array(nullableNumber),
    temperature_2m_max: z.array(nullableNumber),
    precipitation_probability_max: z.array(nullableNumber),
    precipitation_sum: z.array(nullableNumber),
    wind_gusts_10m_max: z.array(nullableNumber),
    weather_code: z.array(nullableNumber),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
  }),
});

type JsonRecord = Record<string, unknown>;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeKey(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function collectRecords(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.flatMap(collectRecords);
  const record = asRecord(value);
  return record ? [record, ...Object.values(record).flatMap(collectRecords)] : [];
}

function nestedText(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text || null;
  }
  if (Array.isArray(value)) {
    const values = value.map(nestedText).filter((item): item is string => Boolean(item));
    return values.length ? values.join(", ") : null;
  }
  const record = asRecord(value);
  if (!record) return null;
  for (const key of ["value", "valor", "label", "nome", "descricao", "date", "data", "codigo", "cor"]) {
    const entry = Object.entries(record).find(
      ([candidate]) => normalizeKey(candidate) === normalizeKey(key),
    );
    if (entry) return nestedText(entry[1]);
  }
  return null;
}

function findValue(record: JsonRecord, aliases: string[]) {
  const entries = new Map(Object.entries(record).map(([key, value]) => [normalizeKey(key), value]));
  for (const alias of aliases) {
    const value = entries.get(normalizeKey(alias));
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function safeDate(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+(?:às|as)\s+/i, " ");
  const brazilian = normalized.match(
    /^(\d{2})[\/-](\d{2})[\/-](20\d{2})(?:[ T]+(\d{1,2}):(\d{2}))?/,
  );
  if (brazilian) {
    const date = new Date(
      `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}T${(brazilian[4] ?? "00").padStart(2, "0")}:${brazilian[5] ?? "00"}:00-03:00`,
    );
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function severityFrom(value: string): { severity: RegionalAlertSeverity; label: string } {
  const normalized = normalizeText(value);
  if (/grande perigo|vermelh|extreme|extremo|ff0000/.test(normalized)) {
    return { severity: "great-danger", label: "Alerta vermelho" };
  }
  if (/perigo|laranja|severe|severo|ff9900|ffa500/.test(normalized)) {
    return { severity: "danger", label: "Alerta laranja" };
  }
  if (/potencial|amarel|moderate|moderado|ffff00|ffcc00/.test(normalized)) {
    return { severity: "potential", label: "Alerta amarelo" };
  }
  return { severity: "unknown", label: "Aviso meteorológico" };
}

function weatherLabel(code: number | null) {
  if (code === 0) return "Céu limpo";
  if (code === 1 || code === 2) return "Parcialmente nublado";
  if (code === 3) return "Céu nublado";
  if (code === 45 || code === 48) return "Neblina";
  if (code !== null && code >= 51 && code <= 86) return "Chuva";
  if (code !== null && code >= 95) return "Temporal";
  return "Condição em atualização";
}

function compass(value: number | null) {
  if (value === null) return null;
  const directions = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return directions[Math.round((((value % 360) + 360) % 360) / 45) % 8];
}

function rounded(value: number | null, digits = 0) {
  if (value === null) return null;
  return digits === 0 ? Math.round(value) : Number(value.toFixed(digits));
}

function forecastUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: TIMEZONE,
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code",
    hourly:
      "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,sunrise,sunset",
  });
  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

async function fetchForecast(city: NonNullable<ReturnType<typeof findRegionalCity>>) {
  const response = await fetch(forecastUrl(city.latitude, city.longitude), {
    headers: { Accept: "application/json", "User-Agent": "MOBI-Tempo-Pelotas/2.0" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Open-Meteo respondeu com status ${response.status}`);
  const parsed = forecastSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Previsão regional em formato inesperado");
  return parsed.data;
}

function parseAlerts(payload: unknown, cityName: string): RegionalCityAlert[] {
  const alerts = collectRecords(payload).flatMap((record, index) => {
    const event = nestedText(
      findValue(record, ["evento", "event", "tipo", "aviso", "titulo", "headline"]),
    );
    if (!event) return [];
    const description =
      nestedText(findValue(record, ["descricao", "description", "riscos", "detalhes"])) ?? "";
    const instruction =
      nestedText(
        findValue(record, ["instrucoes", "instruction", "recomendacoes", "orientacoes"]),
      ) ?? "";
    const startsAt = safeDate(
      nestedText(findValue(record, ["inicio", "onset", "effective", "dataInicio", "dtInicio"])),
    );
    const expiresAt = safeDate(
      nestedText(findValue(record, ["fim", "expires", "dataFim", "dtFim", "validade"])),
    );
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return [];
    const severity = severityFrom(
      nestedText(findValue(record, ["severidade", "severity", "grau", "nivel", "cor", "color"])) ??
        "",
    );
    const id =
      nestedText(findValue(record, ["id", "identifier", "codigo", "codigoAviso"])) ??
      `${cityName}-${startsAt ?? index}`;
    return [
      {
        id,
        event,
        description,
        instruction,
        severity: severity.severity,
        severityLabel: severity.label,
        startsAt,
        expiresAt,
        officialUrl: INMET_PORTAL_URL,
      } satisfies RegionalCityAlert,
    ];
  });
  return alerts.filter(
    (alert, index, all) => all.findIndex((item) => item.id === alert.id) === index,
  );
}

async function fetchAlerts(city: NonNullable<ReturnType<typeof findRegionalCity>>) {
  const sourceUrl = `https://apiprevmet3.inmet.gov.br/avisos/getByGeocode/${city.ibgeCode}`;
  try {
    const response = await fetch(sourceUrl, {
      headers: { Accept: "application/json", "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`INMET respondeu com status ${response.status}`);
    return { status: "live" as const, items: parseAlerts(await response.json(), city.name), sourceUrl };
  } catch {
    return { status: "unavailable" as const, items: [], sourceUrl };
  }
}

export async function fetchRegionalCityWeather(
  slug: string,
): Promise<RegionalCityWeatherData | null> {
  const city = findRegionalCity(slug);
  if (!city) return null;
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) return cached.data;

  const [forecastResult, alerts] = await Promise.allSettled([fetchForecast(city), fetchAlerts(city)]);
  const fetchedAt = new Date().toISOString();
  const alertData =
    alerts.status === "fulfilled"
      ? alerts.value
      : { status: "unavailable" as const, items: [], sourceUrl: INMET_PORTAL_URL };

  if (forecastResult.status === "rejected") {
    return {
      status: "unavailable",
      city,
      current: null,
      hourly: [],
      daily: [],
      astronomy: { sunrise: null, sunset: null },
      alerts: alertData,
      source: {
        forecastName: "Open-Meteo",
        forecastUrl: OPEN_METEO_URL,
        alertsName: "INMET",
        fetchedAt,
      },
      message: "A previsão local está temporariamente indisponível.",
    };
  }

  const forecast = forecastResult.value;
  const current = forecast.current;
  const hourlyStart = Math.max(
    0,
    forecast.hourly.time.findIndex((time) => time >= current.time),
  );
  const hourly = forecast.hourly.time.slice(hourlyStart, hourlyStart + 12).map((time, offset) => {
    const index = hourlyStart + offset;
    return {
      time,
      temperature: rounded(forecast.hourly.temperature_2m[index] ?? null),
      rainChance: rounded(forecast.hourly.precipitation_probability[index] ?? null),
      precipitationMm: rounded(forecast.hourly.precipitation[index] ?? null, 1),
      windSpeed: rounded(forecast.hourly.wind_speed_10m[index] ?? null),
      windGust: rounded(forecast.hourly.wind_gusts_10m[index] ?? null),
      condition: weatherLabel(forecast.hourly.weather_code[index] ?? null),
    };
  });
  const daily = forecast.daily.time.map((date, index) => ({
    date,
    weekday:
      index === 0
        ? "Hoje"
        : new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
            .format(new Date(`${date}T12:00:00Z`))
            .replace(".", ""),
    minimum: rounded(forecast.daily.temperature_2m_min[index] ?? null),
    maximum: rounded(forecast.daily.temperature_2m_max[index] ?? null),
    rainChance: rounded(forecast.daily.precipitation_probability_max[index] ?? null),
    precipitationMm: rounded(forecast.daily.precipitation_sum[index] ?? null, 1),
    windGust: rounded(forecast.daily.wind_gusts_10m_max[index] ?? null),
    condition: weatherLabel(forecast.daily.weather_code[index] ?? null),
  }));

  const data: RegionalCityWeatherData = {
    status: alertData.status === "live" ? "live" : "partial",
    city,
    current: {
      temperature: rounded(current.temperature_2m),
      feelsLike: rounded(current.apparent_temperature),
      condition: weatherLabel(current.weather_code),
      humidity: rounded(current.relative_humidity_2m),
      pressure: rounded(current.pressure_msl),
      precipitationMm: rounded(current.precipitation, 1),
      windSpeed: rounded(current.wind_speed_10m),
      windGust: rounded(current.wind_gusts_10m),
      windDirection: compass(current.wind_direction_10m),
      observedAt: current.time,
    },
    hourly,
    daily,
    astronomy: {
      sunrise: forecast.daily.sunrise[0] ?? null,
      sunset: forecast.daily.sunset[0] ?? null,
    },
    alerts: alertData,
    source: {
      forecastName: "Open-Meteo",
      forecastUrl: OPEN_METEO_URL,
      alertsName: "INMET",
      fetchedAt,
    },
    message:
      alertData.status === "unavailable"
        ? "A previsão está disponível, mas a consulta municipal de avisos do INMET apresentou restrição."
        : null,
  };
  cache.set(slug, { storedAt: Date.now(), data });
  return data;
}
