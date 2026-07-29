import type { WeatherIconName } from "@/production/lib/weather-data";

function normalizeCondition(condition: string | null | undefined) {
  return (condition ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function isRegionalNight(value: string | null | undefined) {
  if (!value) return false;
  const match = value.match(/T(\d{2}):/);
  if (!match) return false;
  const hour = Number(match[1]);
  return Number.isFinite(hour) && (hour < 6 || hour >= 19);
}

export function regionalWeatherIcon(
  condition: string | null | undefined,
  timestamp?: string | null,
): WeatherIconName {
  const normalized = normalizeCondition(condition);
  const night = isRegionalNight(timestamp);

  if (/temporal|trovoada|tempestade/.test(normalized)) return "storm";
  if (/chuva|garoa|pancada/.test(normalized)) return "rain";
  if (/vento|ventoso/.test(normalized)) return "wind";
  if (/ceu limpo|limpo|ensolarado/.test(normalized)) return night ? "moon" : "sun";
  if (/parcialmente|pouco nublado/.test(normalized)) {
    return night ? "partly-cloudy-night" : "partly-cloudy";
  }
  return "cloud";
}
