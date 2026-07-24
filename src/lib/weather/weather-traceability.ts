import type {
  AggregatedCurrentField,
  AggregatedCurrentProvenance,
  AggregatedWeatherData,
  WeatherConfidence,
  WeatherSourceHealth,
  WeatherSourceKey,
} from "./aggregated-weather.types";
import type { CurrentWeather, ForecastSourceKey, WeatherHomeData } from "./types";
import type { WeatherBaselineData } from "./weather-baseline-select";

export const CURRENT_FIELDS: AggregatedCurrentField[] = [
  "temperature",
  "feelsLike",
  "condition",
  "humidity",
  "pressure",
  "windSpeed",
  "windGust",
  "windDirection",
  "visibilityKm",
  "sunrise",
  "sunset",
  "observedAt",
  "icon",
];

export const FORECAST_PROVIDER_LABELS: Record<ForecastSourceKey, string> = {
  "open-meteo": "Open-Meteo",
  "met-norway": "MET Norway",
};

export function baselineProvenance(
  current: CurrentWeather | null,
  key: ForecastSourceKey,
): AggregatedCurrentProvenance {
  if (!current) return {};
  return Object.fromEntries(
    CURRENT_FIELDS.map((field) => [field, key]),
  ) as AggregatedCurrentProvenance;
}

export function createProviderHealth(
  provider: WeatherHomeData,
  key: ForecastSourceKey,
): WeatherSourceHealth {
  return {
    source: key,
    status: provider.status,
    role: "forecast",
    fetchedAt: provider.source.fetchedAt,
    usable: provider.status === "live" && provider.daily.length > 0,
    reason: provider.message,
  };
}

export function contingencyKeyFor(selected: ForecastSourceKey): ForecastSourceKey {
  return selected === "open-meteo" ? "met-norway" : "open-meteo";
}

export type TraceabilityInput = {
  baseline: WeatherBaselineData;
  sources: Record<WeatherSourceKey, WeatherSourceHealth>;
  confidence: WeatherConfidence;
  hasWeatherData: boolean;
};

export type TraceabilityOutput = {
  selectedForecastKey: ForecastSourceKey;
  usingContingency: boolean;
  contingencyKey: ForecastSourceKey;
  degradedSources: WeatherSourceKey[];
  status: AggregatedWeatherData["status"];
  forecastSource: ForecastSourceKey | null;
  forecastProvider: string | null;
};

export function deriveTraceability({
  baseline,
  sources,
  confidence,
  hasWeatherData,
}: TraceabilityInput): TraceabilityOutput {
  const selectedForecastKey: ForecastSourceKey = baseline.source.key;
  const usingContingency = selectedForecastKey === "met-norway";
  const contingencyKey = contingencyKeyFor(selectedForecastKey);

  const degradedSources = (Object.keys(sources) as WeatherSourceKey[]).filter((source) => {
    if (source === contingencyKey) return false;
    return sources[source].status !== "live" || !sources[source].usable;
  });

  const status: AggregatedWeatherData["status"] = !hasWeatherData
    ? "unavailable"
    : usingContingency
      ? "degraded"
      : degradedSources.length === 0 && confidence === "high"
        ? "live"
        : "degraded";

  const forecastSource: ForecastSourceKey | null =
    baseline.daily.length > 0 ? selectedForecastKey : null;

  const forecastProvider =
    baseline.status === "live"
      ? (baseline.source.name ?? FORECAST_PROVIDER_LABELS[selectedForecastKey])
      : null;

  return {
    selectedForecastKey,
    usingContingency,
    contingencyKey,
    degradedSources,
    status,
    forecastSource,
    forecastProvider,
  };
}
