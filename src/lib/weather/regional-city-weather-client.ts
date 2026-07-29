import type { RegionalCity } from "@/lib/regional-cities";
import type {
  RegionalCityCurrentWeather,
  RegionalCityDailyForecast,
  RegionalCityHourlyForecast,
  RegionalCityWeatherData,
} from "./regional-city-weather.types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const TIMEZONE = "America/Sao_Paulo";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || typeof value === "boolean") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberArray(value: unknown): Array<number | null> {
  return Array.isArray(value) ? value.map(numberValue) : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(stringValue).filter((item): item is string => Boolean(item))
    : [];
}

function rounded(value: number | null, digits = 0) {
  if (value === null) return null;
  return digits === 0 ? Math.round(value) : Number(value.toFixed(digits));
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
  return directions[Math.round((((value % 360) + 360) % 360) / 45) % 8] ?? null;
}

function localHourKey(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: TIMEZONE,
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:00`;
}

function hourlyStartIndex(times: string[], now: Date) {
  if (times.length === 0) return 0;
  const index = times.findIndex((time) => time >= localHourKey(now));
  return index === -1 ? Math.max(0, times.length - 1) : index;
}

export function regionalCityForecastUrl(city: RegionalCity) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: TIMEZONE,
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code",
    hourly:
      "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,sunrise,sunset",
  });
  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

export function regionalCityNeedsBrowserRecovery(data: RegionalCityWeatherData) {
  return (
    !data.current ||
    data.current.temperature === null ||
    data.hourly.length < 6 ||
    data.daily.length < 5
  );
}

function normalizeCurrent(
  payload: JsonRecord,
  hourly: JsonRecord,
  index: number,
): RegionalCityCurrentWeather | null {
  const current = record(payload.current);
  const hourlyTimes = stringArray(hourly.time);
  const value = (key: string) => {
    const direct = current ? numberValue(current[key]) : null;
    return direct ?? numberArray(hourly[key])[index] ?? null;
  };

  const temperature = value("temperature_2m");
  const feelsLike = value("apparent_temperature");
  const humidity = value("relative_humidity_2m");
  const pressure = value("pressure_msl");
  const precipitation = value("precipitation");
  const windSpeed = value("wind_speed_10m");
  const windGust = value("wind_gusts_10m");
  const windDirection = value("wind_direction_10m");
  const weatherCode = value("weather_code");

  if ([temperature, feelsLike, humidity, pressure, windSpeed].every((item) => item === null)) {
    return null;
  }

  return {
    temperature: rounded(temperature),
    feelsLike: rounded(feelsLike ?? temperature),
    condition: weatherLabel(weatherCode),
    humidity: rounded(humidity),
    pressure: rounded(pressure),
    precipitationMm: rounded(precipitation, 1),
    windSpeed: rounded(windSpeed),
    windGust: rounded(windGust),
    windDirection: compass(windDirection),
    observedAt: current ? stringValue(current.time) : hourlyTimes[index] ?? null,
  };
}

function normalizeHourly(hourly: JsonRecord, startIndex: number): RegionalCityHourlyForecast[] {
  const times = stringArray(hourly.time);
  const temperatures = numberArray(hourly.temperature_2m);
  const rainChance = numberArray(hourly.precipitation_probability);
  const precipitation = numberArray(hourly.precipitation);
  const windSpeed = numberArray(hourly.wind_speed_10m);
  const windGust = numberArray(hourly.wind_gusts_10m);
  const codes = numberArray(hourly.weather_code);

  return times.slice(startIndex, startIndex + 12).map((time, offset) => {
    const index = startIndex + offset;
    return {
      time,
      temperature: rounded(temperatures[index] ?? null),
      rainChance: rounded(rainChance[index] ?? null),
      precipitationMm: rounded(precipitation[index] ?? null, 1),
      windSpeed: rounded(windSpeed[index] ?? null),
      windGust: rounded(windGust[index] ?? null),
      condition: weatherLabel(codes[index] ?? null),
    };
  });
}

function normalizeDaily(daily: JsonRecord): RegionalCityDailyForecast[] {
  const dates = stringArray(daily.time);
  const minimums = numberArray(daily.temperature_2m_min);
  const maximums = numberArray(daily.temperature_2m_max);
  const rainChance = numberArray(daily.precipitation_probability_max);
  const precipitation = numberArray(daily.precipitation_sum);
  const windGust = numberArray(daily.wind_gusts_10m_max);
  const codes = numberArray(daily.weather_code);

  return dates.map((date, index) => ({
    date,
    weekday:
      index === 0
        ? "Hoje"
        : new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
            .format(new Date(`${date}T12:00:00Z`))
            .replace(".", ""),
    minimum: rounded(minimums[index] ?? null),
    maximum: rounded(maximums[index] ?? null),
    rainChance: rounded(rainChance[index] ?? null),
    precipitationMm: rounded(precipitation[index] ?? null, 1),
    windGust: rounded(windGust[index] ?? null),
    condition: weatherLabel(codes[index] ?? null),
  }));
}

export function normalizeRegionalCityBrowserForecast(
  base: RegionalCityWeatherData,
  payload: unknown,
  now = new Date(),
): RegionalCityWeatherData {
  const root = record(payload);
  const hourly = root ? record(root.hourly) : null;
  const daily = root ? record(root.daily) : null;
  if (!root || !hourly || !daily) {
    throw new Error("O Open-Meteo respondeu sem as séries regionais esperadas.");
  }

  const startIndex = hourlyStartIndex(stringArray(hourly.time), now);
  const current = normalizeCurrent(root, hourly, startIndex);
  const normalizedHourly = normalizeHourly(hourly, startIndex);
  const normalizedDaily = normalizeDaily(daily);

  if (!current || normalizedHourly.length === 0 || normalizedDaily.length === 0) {
    throw new Error("A previsão regional recebida está incompleta.");
  }

  return {
    ...base,
    status: base.alerts.status === "live" ? "live" : "partial",
    current,
    hourly: normalizedHourly,
    daily: normalizedDaily,
    astronomy: {
      sunrise: stringArray(daily.sunrise)[0] ?? base.astronomy.sunrise,
      sunset: stringArray(daily.sunset)[0] ?? base.astronomy.sunset,
    },
    source: {
      ...base.source,
      fetchedAt: now.toISOString(),
    },
    message:
      base.alerts.status === "unavailable"
        ? "A previsão foi recuperada, mas a consulta municipal de avisos do INMET apresentou restrição."
        : null,
  };
}

export async function recoverRegionalCityWeatherInBrowser(
  base: RegionalCityWeatherData,
  signal?: AbortSignal,
) {
  const response = await fetch(regionalCityForecastUrl(base.city), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo respondeu com status ${response.status}`);
  }
  return normalizeRegionalCityBrowserForecast(base, await response.json());
}
