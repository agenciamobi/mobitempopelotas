import type { WeatherData, WeatherIconName } from "@/production/lib/weather-data";

export const weatherConditionLabels: Record<WeatherIconName, string> = {
  sun: "Céu aberto",
  moon: "Céu aberto à noite",
  "partly-cloudy": "Sol entre nuvens",
  "partly-cloudy-night": "Noite parcialmente nublada",
  cloud: "Céu nublado",
  rain: "Chuva prevista",
  storm: "Trovoadas previstas",
  wind: "Vento em destaque",
};

function normalized(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/**
 * A Embrapa fornece a medição, mas não uma condição visual auditável.
 * Para não atribuir uma condição prevista à estação, o ícone usa nesta ordem:
 * condição observada explícita, previsão horária, previsão diária e narrativa oficial.
 */
export function resolveHeroWeatherIcon(
  weather: WeatherData,
  officialSummary?: string | null,
): WeatherIconName {
  if (weather.current.icon) return weather.current.icon;
  if (weather.hourly[0]?.icon) return weather.hourly[0].icon;
  if (weather.daily[0]?.icon) return weather.daily[0].icon;

  const text = normalized(`${weather.current.condition ?? ""} ${officialSummary ?? ""}`);
  if (/trovoada|tempestade|temporal|raio/.test(text)) return "storm";
  if (/chuva|chuvoso|garoa|precipitacao/.test(text)) return "rain";
  if (/vento|ventania|rajada/.test(text)) return "wind";
  if (/parcialmente|sol entre nuvens|poucas nuvens/.test(text)) return "partly-cloudy";
  if (/sol|ensolarado|ceu claro/.test(text)) return "sun";
  return "cloud";
}

