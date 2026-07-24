import { fetchOfficialWeatherSources } from "./official-sources.server";
import type { EmbrapaObservation } from "./official-sources.types";
import { fetchPelotasWeather, type WeatherBaselineData } from "./weather-baseline.server";
import type { CurrentWeather, DailyForecast, ForecastSourceKey, WeatherHomeData } from "./types";
import type {
  AggregatedCurrentProvenance,
  AggregatedWeatherData,
  WeatherConfidence,
  WeatherDiscrepancy,
  WeatherDiscrepancyField,
  WeatherSourceHealth,
  WeatherSourceKey,
} from "./aggregated-weather.types";
import {
  FORECAST_PROVIDER_LABELS,
  createProviderHealth,
  deriveTraceability,
} from "./weather-traceability";
import {
  OBSERVATION_MAX_AGE_MINUTES,
  deriveEmbrapaCurrent,
  getObservationAgeMinutes,
} from "./current-observation";

const TIMEZONE = "America/Sao_Paulo";


const SOURCE_LABELS: Record<WeatherSourceKey, string> = {
  embrapa: "Embrapa",
  inmet: "INMET",
  cppmet: "CPPMet",
  "open-meteo": "Open-Meteo",
  "met-norway": "MET Norway",
};



function addDiscrepancy(
  discrepancies: WeatherDiscrepancy[],
  options: {
    scope: "current" | "daily";
    field: WeatherDiscrepancyField;
    referenceSource: WeatherSourceKey;
    comparisonSource: WeatherSourceKey;
    referenceValue: number | null;
    comparisonValue: number | null;
    noticeThreshold: number;
    significantThreshold: number;
    unit: WeatherDiscrepancy["unit"];
    day?: string;
  },
) {
  if (options.referenceValue === null || options.comparisonValue === null) return;

  const difference = Math.abs(options.referenceValue - options.comparisonValue);
  if (difference < options.noticeThreshold) return;

  discrepancies.push({
    scope: options.scope,
    field: options.field,
    severity: difference >= options.significantThreshold ? "significant" : "notice",
    referenceSource: options.referenceSource,
    comparisonSource: options.comparisonSource,
    referenceValue: options.referenceValue,
    comparisonValue: options.comparisonValue,
    difference: Number(difference.toFixed(1)),
    unit: options.unit,
    day: options.day ?? null,
  });
}

function compareCurrentSources(
  baseline: CurrentWeather | null,
  observation: EmbrapaObservation,
  usable: boolean,
  referenceKey: ForecastSourceKey,
) {
  const discrepancies: WeatherDiscrepancy[] = [];
  if (!baseline || !usable) return discrepancies;

  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "temperature",
    referenceSource: referenceKey,
    comparisonSource: "embrapa",
    referenceValue: baseline.temperature,
    comparisonValue: observation.current.temperature,
    noticeThreshold: 2.5,
    significantThreshold: 5,
    unit: "°C",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "feelsLike",
    referenceSource: referenceKey,
    comparisonSource: "embrapa",
    referenceValue: baseline.feelsLike,
    comparisonValue: observation.current.feelsLike,
    noticeThreshold: 3,
    significantThreshold: 6,
    unit: "°C",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "humidity",
    referenceSource: referenceKey,
    comparisonSource: "embrapa",
    referenceValue: baseline.humidity,
    comparisonValue: observation.current.humidity,
    noticeThreshold: 12,
    significantThreshold: 25,
    unit: "%",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "pressure",
    referenceSource: referenceKey,
    comparisonSource: "embrapa",
    referenceValue: baseline.pressure,
    comparisonValue: observation.current.pressure,
    noticeThreshold: 4,
    significantThreshold: 8,
    unit: "hPa",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "windSpeed",
    referenceSource: referenceKey,

    comparisonSource: "embrapa",
    referenceValue: baseline.windSpeed,
    comparisonValue: observation.current.windSpeed,
    noticeThreshold: 12,
    significantThreshold: 25,
    unit: "km/h",
  });

  return discrepancies;
}

function weekdayKey(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/-feira/g, "")
    .replace(/[^a-z]/g, "");

  const aliases: Record<string, string> = {
    dom: "domingo",
    domingo: "domingo",
    seg: "segunda",
    segunda: "segunda",
    ter: "terca",
    terca: "terca",
    qua: "quarta",
    quarta: "quarta",
    qui: "quinta",
    quinta: "quinta",
    sex: "sexta",
    sexta: "sexta",
    sab: "sabado",
    sabado: "sabado",
  };

  return aliases[normalized] ?? normalized;
}

function currentWeekdayKey() {
  return weekdayKey(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: TIMEZONE,
    }).format(new Date()),
  );
}

function dailyWeekdayKey(day: DailyForecast) {
  return day.weekday.toLowerCase() === "hoje" ? currentWeekdayKey() : weekdayKey(day.weekday);
}

function compareDailyForecasts(
  daily: DailyForecast[],
  officialForecast: AggregatedWeatherData["officialForecast"],
  referenceKey: ForecastSourceKey,
) {
  const discrepancies: WeatherDiscrepancy[] = [];
  const dailyByWeekday = new Map(daily.map((day) => [dailyWeekdayKey(day), day]));

  for (const officialDay of officialForecast) {
    const baselineDay = dailyByWeekday.get(weekdayKey(officialDay.day));
    if (!baselineDay) continue;

    addDiscrepancy(discrepancies, {
      scope: "daily",
      field: "minimum",
      referenceSource: referenceKey,
      comparisonSource: "cppmet",
      referenceValue: baselineDay.min,
      comparisonValue: officialDay.minimum,
      noticeThreshold: 3,
      significantThreshold: 5,
      unit: "°C",
      day: officialDay.day,
    });
    addDiscrepancy(discrepancies, {
      scope: "daily",
      field: "maximum",
      referenceSource: referenceKey,
      comparisonSource: "cppmet",
      referenceValue: baselineDay.max,
      comparisonValue: officialDay.maximum,
      noticeThreshold: 3,
      significantThreshold: 5,
      unit: "°C",
      day: officialDay.day,
    });
  }

  return discrepancies;
}

function calculateQualityScore(options: {
  baseline: WeatherHomeData;
  embrapaUsable: boolean;
  embrapaStatus: EmbrapaObservation["status"];
  inmetLive: boolean;
  cppmetLive: boolean;
  discrepancies: WeatherDiscrepancy[];
}) {
  let score = 0;
  if (options.baseline.current) score += 35;
  if (options.baseline.hourly.length > 0) score += 10;
  if (options.baseline.daily.length > 0) score += 15;
  if (options.embrapaUsable) score += options.embrapaStatus === "live" ? 20 : 12;
  if (options.inmetLive) score += 10;
  if (options.cppmetLive) score += 10;

  const notices = options.discrepancies.filter((item) => item.severity === "notice").length;
  const significant = options.discrepancies.filter(
    (item) => item.severity === "significant",
  ).length;
  score -= Math.min(15, notices + significant * 4);

  return Math.max(0, Math.min(100, score));
}

function confidenceFromScore(score: number): WeatherConfidence {
  if (score >= 85) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function createSources(
  baseline: WeatherBaselineData,
  observation: EmbrapaObservation,
  official: Awaited<ReturnType<typeof fetchOfficialWeatherSources>>,
  observationAgeMinutes: number | null,
  embrapaUsable: boolean,
): Record<WeatherSourceKey, WeatherSourceHealth> {
  const embrapaIsStale =
    observation.status !== "unavailable" &&
    observationAgeMinutes !== null &&
    observationAgeMinutes > OBSERVATION_MAX_AGE_MINUTES;

  return {
    "open-meteo": createProviderHealth(baseline.providers["open-meteo"], "open-meteo"),
    "met-norway": createProviderHealth(baseline.providers["met-norway"], "met-norway"),
    embrapa: {
      source: "embrapa",
      status: embrapaIsStale ? "stale" : observation.status,
      role: "observation",
      fetchedAt: observation.source.fetchedAt,
      usable: embrapaUsable,
      reason: embrapaIsStale
        ? `Leitura com mais de ${OBSERVATION_MAX_AGE_MINUTES} minutos.`
        : observation.error,
    },
    inmet: {
      source: "inmet",
      status: official.inmet.status,
      role: "alerts",
      fetchedAt: official.inmet.source.fetchedAt,
      usable: official.inmet.status === "live",
      reason: official.inmet.error,
    },
    cppmet: {
      source: "cppmet",
      status: official.cppmet.status,
      role: "forecast-context",
      fetchedAt: official.cppmet.source.fetchedAt,
      usable: official.cppmet.status === "live" && official.cppmet.items.length > 0,
      reason: official.cppmet.error,
    },
  };
}

function buildNotes(options: {
  currentSource: "embrapa" | ForecastSourceKey | null;
  forecastProvider: string;
  selectedForecastKey: ForecastSourceKey;
  usingContingency: boolean;
  sources: Record<WeatherSourceKey, WeatherSourceHealth>;
  discrepancies: WeatherDiscrepancy[];
}) {
  const notes: string[] = [];

  if (options.currentSource === "embrapa") {
    notes.push("Condições atuais priorizam a medição local da Embrapa.");
  } else if (options.currentSource) {
    notes.push(`Condições atuais usam ${options.forecastProvider}.`);
  }
  if (options.usingContingency) {
    notes.push(
      "Open-Meteo não respondeu; a previsão foi assumida pela contingência do MET Norway.",
    );
  } else {
    const contingencyKey: ForecastSourceKey =
      options.selectedForecastKey === "open-meteo" ? "met-norway" : "open-meteo";
    if (!options.sources[contingencyKey].usable) {
      notes.push(
        "Contingência do MET Norway indisponível no momento; Open-Meteo segue como fonte ativa.",
      );
    }
  }
  if (options.sources.embrapa.status === "stale") {
    notes.push("A leitura da Embrapa foi preservada como contexto, mas não substituiu o modelo.");
  }
  if (options.discrepancies.length > 0) {
    notes.push("Foram detectadas diferenças relevantes entre as fontes disponíveis.");
  }

  return notes;
}

function buildMessage(
  status: AggregatedWeatherData["status"],
  degradedSources: WeatherSourceKey[],
) {
  if (status === "unavailable") {
    return "Não foi possível obter condições atuais nem previsão meteorológica.";
  }
  if (status === "degraded") {
    const labels = degradedSources.map((source) => SOURCE_LABELS[source]).join(", ");
    return labels
      ? `Dados disponíveis em modo degradado. Fontes com restrição: ${labels}.`
      : "Dados disponíveis em modo degradado.";
  }
  return null;
}

export async function fetchAggregatedPelotasWeather(): Promise<AggregatedWeatherData> {
  const [baseline, official] = await Promise.all([
    fetchPelotasWeather(),
    fetchOfficialWeatherSources(),
  ]);

  const observation = official.embrapa;
  const observationAgeMinutes = getObservationAgeMinutes(observation);
  const embrapaUsable = canUseEmbrapaObservation(observation, observationAgeMinutes);
  const current = baseline.current
    ? createCurrentFromBaseline(baseline.current)
    : embrapaUsable
      ? createCurrentFromObservation(observation)
      : null;
  const currentProvenance = baselineProvenance(baseline.current, baseline.source.key);

  if (current && embrapaUsable) {
    applyEmbrapaObservation(current, currentProvenance, observation);
  }

  const currentSource = currentProvenance.temperature ?? null;
  const hourly = baseline.hourly.map((item, index) => {
    if (index !== 0 || currentSource !== "embrapa" || !current) return item;
    return {
      ...item,
      temperature: current.temperature ?? item.temperature,
      windSpeed: current.windSpeed ?? item.windSpeed,
    };
  });

  const discrepancies = [
    ...compareCurrentSources(baseline.current, observation, embrapaUsable, baseline.source.key),
    ...compareDailyForecasts(baseline.daily, official.cppmet.items, baseline.source.key),
  ];
  const sources = createSources(
    baseline,
    observation,
    official,
    observationAgeMinutes,
    embrapaUsable,
  );

  const score = calculateQualityScore({
    baseline,
    embrapaUsable,
    embrapaStatus: observation.status,
    inmetLive: official.inmet.status === "live",
    cppmetLive: official.cppmet.status === "live",
    discrepancies,
  });
  const confidence = confidenceFromScore(score);
  const hasWeatherData = current !== null || hourly.length > 0 || baseline.daily.length > 0;

  const {
    selectedForecastKey,
    usingContingency,
    degradedSources,
    status,
    forecastSource,
    forecastProvider,
  } = deriveTraceability({ baseline, sources, confidence, hasWeatherData });

  const normalizedCurrentSource: "embrapa" | ForecastSourceKey | null =
    currentSource === "embrapa" || currentSource === "open-meteo" || currentSource === "met-norway"
      ? currentSource
      : null;

  return {
    status,
    current,
    currentProvenance,
    hourly,
    daily: baseline.daily,
    observation,
    alerts: official.inmet.alerts,
    officialForecast: official.cppmet.items,
    sources,
    quality: {
      score,
      confidence,
      currentSource: normalizedCurrentSource,
      forecastSource,
      forecastProvider,
      degradedSources,
      observationAgeMinutes,
      discrepancies,
      notes: buildNotes({
        currentSource: normalizedCurrentSource,
        forecastProvider: forecastProvider ?? FORECAST_PROVIDER_LABELS[selectedForecastKey],
        selectedForecastKey,
        usingContingency,
        sources,
        discrepancies,
      }),
    },
    source: {
      name: "MOBI Tempo Pelotas",
      kind: "aggregated",
      fetchedAt: new Date().toISOString(),
    },
    message: buildMessage(status, degradedSources),
  };
}
