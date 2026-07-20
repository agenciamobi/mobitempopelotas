import {
  getEmbrapaObservation,
  type EmbrapaObservationData,
} from "@/lib/embrapa-observation";
import {
  fallbackWeatherData,
  type DailyForecast,
  type HourlyForecast,
  type RegionalWeather,
  type WeatherData,
  type WeatherIconName,
} from "@/lib/weather-data";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REVALIDATE_SECONDS = 600;
const OBSERVATION_MAX_AGE_MINUTES = 30;

const locations = [
  { city: "Pelotas", latitude: -31.7654, longitude: -52.3376 },
  { city: "Rio Grande", latitude: -32.035, longitude: -52.0986 },
  { city: "Canguçu", latitude: -31.395, longitude: -52.6756 },
  { city: "São Lourenço do Sul", latitude: -31.365, longitude: -51.978 },
] as const;

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code: number;
  pressure_msl: number;
  visibility?: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  wind_direction_10m: number;
  is_day: number;
};

type OpenMeteoResponse = {
  timezone: string;
  current: OpenMeteoCurrent;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    weather_code: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_gusts_10m_max: number[];
    sunrise: string[];
    sunset: string[];
  };
};

type RegionalOpenMeteoResponse = {
  current: Pick<OpenMeteoCurrent, "temperature_2m" | "weather_code" | "is_day">;
};

export type PelotasWeatherSnapshot = {
  weather: WeatherData;
  observation: EmbrapaObservationData;
};

function weatherCodeToPresentation(code: number, isDay = true) {
  if (code === 0) {
    return {
      label: isDay ? "Céu limpo" : "Noite de céu limpo",
      icon: (isDay ? "sun" : "moon") as WeatherIconName,
    };
  }

  if (code === 1 || code === 2) {
    return {
      label: isDay ? "Sol entre nuvens" : "Noite parcialmente nublada",
      icon: (isDay ? "partly-cloudy" : "partly-cloudy-night") as WeatherIconName,
    };
  }

  if (code === 3 || code === 45 || code === 48) {
    return {
      label: code >= 45 ? "Neblina" : "Céu nublado",
      icon: "cloud" as WeatherIconName,
    };
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86)) {
    return { label: "Chuva", icon: "rain" as WeatherIconName };
  }

  if (code >= 71 && code <= 77) {
    return { label: "Precipitação de inverno", icon: "rain" as WeatherIconName };
  }

  if (code >= 95) {
    return { label: "Temporal", icon: "storm" as WeatherIconName };
  }

  return { label: "Tempo variável", icon: "cloud" as WeatherIconName };
}

function degreesToCompass(degrees: number) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "L",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSO",
    "SO",
    "OSO",
    "O",
    "ONO",
    "NO",
    "NNO",
  ];

  return directions[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];
}

function formatClock(value: string) {
  const time = value.split("T")[1];
  return time ? time.slice(0, 5) : value;
}

function formatUpdatedAt(value: string) {
  return `Atualizado às ${formatClock(value)}`;
}

function formatFetchedClock(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function clockToMinutes(value: string | null) {
  if (!value) return null;

  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function getObservationAgeMinutes(observation: EmbrapaObservationData) {
  const observedMinutes = clockToMinutes(observation.source.observationTime);
  const fetchedMinutes = clockToMinutes(formatFetchedClock(observation.source.fetchedAt));

  if (observedMinutes === null || fetchedMinutes === null) return null;

  let age = fetchedMinutes - observedMinutes;
  if (age < -5) age += 24 * 60;
  if (age < 0) age = 0;

  return age;
}

function canUseEmbrapaAsCurrentSource(observation: EmbrapaObservationData) {
  if (observation.status === "unavailable" || observation.current.temperature === null) {
    return false;
  }

  const age = getObservationAgeMinutes(observation);
  if (age === null) return observation.status === "live";

  return age <= OBSERVATION_MAX_AGE_MINUTES;
}

function formatDay(date: string, index: number) {
  if (index === 0) return "Hoje";

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: TIMEZONE,
  }).format(new Date(`${date}T12:00:00-03:00`));

  return formatted.replace(".", "").replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: TIMEZONE,
  })
    .format(new Date(`${date}T12:00:00-03:00`))
    .replace(" de ", " ")
    .replace(".", "");
}

function normalizeHourly(response: OpenMeteoResponse): HourlyForecast[] {
  const foundIndex = response.hourly.time.findIndex(
    (time) => time >= response.current.time,
  );
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;

  return response.hourly.time
    .slice(currentIndex, currentIndex + 7)
    .map((time, offset) => {
      const index = currentIndex + offset;
      const presentation = weatherCodeToPresentation(
        response.hourly.weather_code[index],
        response.hourly.is_day[index] === 1,
      );

      return {
        time: offset === 0 ? "Agora" : `${formatClock(time).slice(0, 2)}h`,
        temperature: Math.round(response.hourly.temperature_2m[index]),
        precipitation: Math.round(
          response.hourly.precipitation_probability[index] ?? 0,
        ),
        windSpeed: Math.round(response.hourly.wind_speed_10m[index] ?? 0),
        windGust: Math.round(response.hourly.wind_gusts_10m[index] ?? 0),
        icon: presentation.icon,
      };
    });
}

function normalizeDaily(response: OpenMeteoResponse): DailyForecast[] {
  return response.daily.time.map((date, index) => ({
    weekday: formatDay(date, index),
    date: formatDate(date),
    min: Math.round(response.daily.temperature_2m_min[index]),
    max: Math.round(response.daily.temperature_2m_max[index]),
    rainChance: Math.round(
      response.daily.precipitation_probability_max[index] ?? 0,
    ),
    precipitation: Number(
      (response.daily.precipitation_sum[index] ?? 0).toFixed(1),
    ),
    windGust: Math.round(response.daily.wind_gusts_10m_max[index] ?? 0),
    icon: weatherCodeToPresentation(
      response.daily.weather_code[index],
      true,
    ).icon,
  }));
}

async function fetchForecast() {
  const pelotas = locations[0];
  const params = new URLSearchParams({
    latitude: String(pelotas.latitude),
    longitude: String(pelotas.longitude),
    timezone: TIMEZONE,
    forecast_days: "7",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "pressure_msl",
      "visibility",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "wind_speed_10m",
      "wind_gusts_10m",
      "weather_code",
      "is_day",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_gusts_10m_max",
      "sunrise",
      "sunset",
    ].join(","),
  });

  const response = await fetch(`${FORECAST_ENDPOINT}?${params}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo respondeu com status ${response.status}`);
  }

  return (await response.json()) as OpenMeteoResponse;
}

async function fetchRegionalWeather(): Promise<RegionalWeather[]> {
  return Promise.all(
    locations.map(async (location) => {
      const params = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        timezone: TIMEZONE,
        current: "temperature_2m,weather_code,is_day",
      });

      const response = await fetch(`${FORECAST_ENDPOINT}?${params}`, {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Falha ao consultar ${location.city}`);
      }

      const data = (await response.json()) as RegionalOpenMeteoResponse;

      return {
        city: location.city,
        temperature: Math.round(data.current.temperature_2m),
        condition: weatherCodeToPresentation(
          data.current.weather_code,
          data.current.is_day === 1,
        ).icon,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }),
  );
}

function cloneFallbackWeather(): WeatherData {
  return {
    current: {
      ...fallbackWeatherData.current,
      source: { ...fallbackWeatherData.current.source },
    },
    hourly: fallbackWeatherData.hourly.map((hour) => ({ ...hour })),
    daily: fallbackWeatherData.daily.map((day) => ({ ...day })),
    regional: fallbackWeatherData.regional.map((location) => ({ ...location })),
    source: { ...fallbackWeatherData.source },
  };
}

function applyEmbrapaObservation(
  weather: WeatherData,
  observation: EmbrapaObservationData,
): WeatherData {
  if (!canUseEmbrapaAsCurrentSource(observation)) return weather;

  const observedAt = observation.source.observationTime;
  const current = {
    ...weather.current,
    temperature: Math.round(observation.current.temperature ?? weather.current.temperature),
    feelsLike: Math.round(observation.current.feelsLike ?? weather.current.feelsLike),
    humidity: Math.round(observation.current.humidity ?? weather.current.humidity),
    pressure: Math.round(observation.current.pressure ?? weather.current.pressure),
    windSpeed: Math.round(observation.current.windSpeed ?? weather.current.windSpeed),
    windDirection: observation.current.windDirection ?? weather.current.windDirection,
    sunrise: observation.current.sunrise ?? weather.current.sunrise,
    sunset: observation.current.sunset ?? weather.current.sunset,
    updatedAt: observedAt
      ? `Medição da Embrapa às ${observedAt}`
      : `Medição da Embrapa consultada às ${formatFetchedClock(observation.source.fetchedAt)}`,
    source: {
      name: observation.source.name,
      url: observation.source.url,
      kind: "observation" as const,
      observedAt,
    },
  };

  const hourly = weather.hourly.map((hour, index) =>
    index === 0
      ? {
          ...hour,
          temperature: current.temperature,
          windSpeed: current.windSpeed,
        }
      : hour,
  );

  const regional = weather.regional.map((location) =>
    location.city === "Pelotas"
      ? {
          ...location,
          temperature: current.temperature,
          condition: current.icon,
        }
      : location,
  );

  return {
    ...weather,
    current,
    hourly,
    regional,
    source: {
      ...weather.source,
      name: `${observation.source.name} + ${weather.source.name}`,
      observationName: observation.source.name,
      observationUrl: observation.source.url,
      forecastName: weather.source.name,
      forecastUrl: weather.source.url,
    },
  };
}

function normalizeWeather(
  forecast: OpenMeteoResponse,
  regionalWeather: RegionalWeather[],
): WeatherData {
  const currentPresentation = weatherCodeToPresentation(
    forecast.current.weather_code,
    forecast.current.is_day === 1,
  );

  return {
    current: {
      city: "Pelotas",
      state: "RS",
      temperature: Math.round(forecast.current.temperature_2m),
      feelsLike: Math.round(forecast.current.apparent_temperature),
      condition: currentPresentation.label,
      humidity: Math.round(forecast.current.relative_humidity_2m),
      pressure: Math.round(forecast.current.pressure_msl),
      windSpeed: Math.round(forecast.current.wind_speed_10m),
      windGust: Math.round(forecast.current.wind_gusts_10m),
      windDirection: degreesToCompass(
        forecast.current.wind_direction_10m,
      ),
      visibility: Math.round(
        (forecast.current.visibility ?? 10000) / 1000,
      ),
      sunrise: formatClock(forecast.daily.sunrise[0]),
      sunset: formatClock(forecast.daily.sunset[0]),
      updatedAt: formatUpdatedAt(forecast.current.time),
      icon: currentPresentation.icon,
      source: {
        name: "Open-Meteo",
        url: OPEN_METEO_URL,
        kind: "forecast",
        observedAt: formatClock(forecast.current.time),
      },
    },
    hourly: normalizeHourly(forecast),
    daily: normalizeDaily(forecast),
    regional: regionalWeather,
    source: {
      name: "Open-Meteo",
      url: OPEN_METEO_URL,
      isFallback: false,
      forecastName: "Open-Meteo",
      forecastUrl: OPEN_METEO_URL,
    },
  };
}

export async function getPelotasWeatherWithObservation(): Promise<PelotasWeatherSnapshot> {
  const observationPromise = getEmbrapaObservation();

  try {
    const [forecast, regionalWeather, observation] = await Promise.all([
      fetchForecast(),
      fetchRegionalWeather(),
      observationPromise,
    ]);

    return {
      weather: applyEmbrapaObservation(
        normalizeWeather(forecast, regionalWeather),
        observation,
      ),
      observation,
    };
  } catch (error) {
    console.error("Falha ao carregar a previsão meteorológica:", error);
    const observation = await observationPromise;

    return {
      weather: applyEmbrapaObservation(cloneFallbackWeather(), observation),
      observation,
    };
  }
}

export async function getPelotasWeather(): Promise<WeatherData> {
  const { weather } = await getPelotasWeatherWithObservation();
  return weather;
}