import type {
  RegionalCityCurrentWeather,
  RegionalCityDailyForecast,
  RegionalCityHourlyForecast,
  RegionalCityWeatherData,
} from "./regional-city-weather.types";
import { fetchRegionalCityWeather as fetchPrimaryRegionalCityWeather } from "./regional-city-weather.server";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 12_000;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || typeof value === "boolean") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberArray(value: unknown) {
  return Array.isArray(value) ? value.map(numberValue) : [];
}

function stringArray(value: unknown) {
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

function localHourKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: TIMEZONE,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:00`;
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
      "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,sunrise,sunset",
  });
  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

function nearestHourlyIndex(times: string[], target: string) {
  if (times.length === 0) return -1;
  const exactOrNext = times.findIndex((time) => time >= target);
  if (exactOrNext === -1) return times.length - 1;
  if (exactOrNext === 0) return 0;
  const previous = times[exactOrNext - 1];
  const next = times[exactOrNext];
  return Math.abs(new Date(next).getTime() - new Date(target).getTime()) <
    Math.abs(new Date(target).getTime() - new Date(previous).getTime())
    ? exactOrNext
    : exactOrNext - 1;
}

function currentFromPayload(
  payload: JsonRecord,
  hourly: JsonRecord,
  fallbackIndex: number,
): RegionalCityCurrentWeather | null {
  const current = record(payload.current);
  const times = stringArray(hourly.time);
  const value = (key: string) => {
    const direct = current ? numberValue(current[key]) : null;
    if (direct !== null) return direct;
    return numberArray(hourly[key])[fallbackIndex] ?? null;
  };
  const observedAt = current ? stringValue(current.time) : times[fallbackIndex] ?? null;
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
    observedAt,
  };
}

function hourlyFromPayload(hourly: JsonRecord, startIndex: number): RegionalCityHourlyForecast[] {
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

function dailyFromPayload(daily: JsonRecord): RegionalCityDailyForecast[] {
  const times = stringArray(daily.time);
  const minimums = numberArray(daily.temperature_2m_min);
  const maximums = numberArray(daily.temperature_2m_max);
  const rainChance = numberArray(daily.precipitation_probability_max);
  const precipitation = numberArray(daily.precipitation_sum);
  const windGust = numberArray(daily.wind_gusts_10m_max);
  const codes = numberArray(daily.weather_code);

  return times.map((date, index) => ({
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

function isFiniteMetric(value: number | null) {
  return value !== null && Number.isFinite(value);
}

function hasCompleteCurrent(data: RegionalCityWeatherData) {
  const current = data.current;
  return Boolean(
    current &&
      [current.temperature, current.feelsLike, current.humidity, current.pressure, current.windSpeed]
        .every(isFiniteMetric),
  );
}

function hasUsefulHourly(data: RegionalCityWeatherData) {
  return (
    data.hourly.length >= 6 &&
    data.hourly.slice(0, 6).every((hour) => isFiniteMetric(hour.temperature))
  );
}

function hasUsefulDaily(data: RegionalCityWeatherData) {
  return (
    data.daily.length >= 5 &&
    data.daily.slice(0, 5).every(
      (day) => isFiniteMetric(day.minimum) && isFiniteMetric(day.maximum),
    )
  );
}

function needsRecovery(data: RegionalCityWeatherData) {
  return !hasCompleteCurrent(data) || !hasUsefulHourly(data) || !hasUsefulDaily(data);
}

function mergeCurrent(
  primary: RegionalCityCurrentWeather | null,
  recovered: RegionalCityCurrentWeather,
): RegionalCityCurrentWeather {
  if (!primary) return recovered;
  return {
    temperature: primary.temperature ?? recovered.temperature,
    feelsLike: primary.feelsLike ?? recovered.feelsLike,
    condition:
      primary.condition && primary.condition !== "Condição em atualização"
        ? primary.condition
        : recovered.condition,
    humidity: primary.humidity ?? recovered.humidity,
    pressure: primary.pressure ?? recovered.pressure,
    precipitationMm: primary.precipitationMm ?? recovered.precipitationMm,
    windSpeed: primary.windSpeed ?? recovered.windSpeed,
    windGust: primary.windGust ?? recovered.windGust,
    windDirection: primary.windDirection ?? recovered.windDirection,
    observedAt: primary.observedAt ?? recovered.observedAt,
  };
}

export async function fetchResilientRegionalCityWeather(slug: string) {
  const primary = await fetchPrimaryRegionalCityWeather(slug);
  if (!primary || !needsRecovery(primary)) return primary;

  try {
    const response = await fetch(forecastUrl(primary.city.latitude, primary.city.longitude), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return primary;
    const payload = record(await response.json());
    if (!payload) return primary;
    const hourly = record(payload.hourly) ?? {};
    const daily = record(payload.daily) ?? {};
    const times = stringArray(hourly.time);
    const index = Math.max(0, nearestHourlyIndex(times, localHourKey()));
    const recoveredCurrent = currentFromPayload(payload, hourly, index);
    if (!recoveredCurrent && !primary.current) return primary;

    const recoveredHourly = hourlyFromPayload(hourly, index);
    const recoveredDaily = dailyFromPayload(daily);
    const sunrise = stringArray(daily.sunrise)[0] ?? null;
    const sunset = stringArray(daily.sunset)[0] ?? null;

    return {
      ...primary,
      status: primary.alerts.status === "live" ? "live" : "partial",
      current: recoveredCurrent ? mergeCurrent(primary.current, recoveredCurrent) : primary.current,
      hourly: hasUsefulHourly(primary) ? primary.hourly : recoveredHourly,
      daily: hasUsefulDaily(primary)
        ? primary.daily
        : recoveredDaily.length > 0
          ? recoveredDaily
          : primary.daily,
      astronomy: {
        sunrise: sunrise ?? primary.astronomy.sunrise,
        sunset: sunset ?? primary.astronomy.sunset,
      },
      source: { ...primary.source, fetchedAt: new Date().toISOString() },
      message:
        primary.alerts.status === "unavailable"
          ? "A previsão foi recuperada, mas a consulta municipal de avisos do INMET apresentou restrição."
          : null,
    } satisfies RegionalCityWeatherData;
  } catch {
    return primary;
  }
}
