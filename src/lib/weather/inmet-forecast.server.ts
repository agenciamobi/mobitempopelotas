import type { InmetForecast, InmetForecastPeriod } from "./official-sources.types";
import { WEATHER_SOURCE_REQUEST_TIMEOUT_MS } from "./source-policy.ts";

const PELOTAS_IBGE_CODE = "4314407";
const FORECAST_URL = `https://apiprevmet3.inmet.gov.br/previsao/${PELOTAS_IBGE_CODE}`;
const INMET_PORTAL_URL = "https://portal.inmet.gov.br/";

type JsonRecord = Record<string, unknown>;

const SUMMARY_KEYS = [
  "resumo",
  "summary",
  "descricao",
  "descrição",
  "condicao",
  "condição",
  "previsao",
  "previsão",
  "frase",
  "texto",
] as const;
const MINIMUM_KEYS = ["temp_min", "temperatura_min", "minima", "mínima", "min"] as const;
const MAXIMUM_KEYS = ["temp_max", "temperatura_max", "maxima", "máxima", "max"] as const;
const HUMIDITY_MINIMUM_KEYS = ["umidade_min", "umid_min", "ur_min"] as const;
const HUMIDITY_MAXIMUM_KEYS = ["umidade_max", "umid_max", "ur_max"] as const;
const WIND_DIRECTION_KEYS = ["dir_vento", "vento_direcao", "direcao_vento"] as const;
const WIND_INTENSITY_KEYS = ["int_vento", "vento_intensidade", "intensidade_vento"] as const;
const ICON_KEYS = ["icone", "ícone", "icon", "codigo", "código"] as const;
const PERIOD_KEYS = ["periodo", "período", "turno"] as const;
const DATE_KEYS = ["data", "date", "dia"] as const;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function normalizedKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findValue(record: JsonRecord, keys: readonly string[]) {
  const normalized = new Map(Object.entries(record).map(([key, value]) => [normalizedKey(key), value]));
  for (const key of keys) {
    const value = normalized.get(normalizedKey(key));
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function asText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = typeof value === "string" ? value.replace(",", ".").replace(/[^\d.-]/g, "") : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function dateFrom(value: unknown, path: string[]) {
  const candidates = [asText(value), ...path].filter((item): item is string => Boolean(item));
  for (const candidate of candidates) {
    const iso = candidate.match(/\b(20\d{2})[-/]?(\d{2})[-/]?(\d{2})\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const brazilian = candidate.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
    if (brazilian) return `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}`;
  }
  return null;
}

function periodFrom(value: unknown, path: string[]) {
  const explicit = asText(value);
  if (explicit) return explicit;
  const labels: Record<string, string> = {
    madrugada: "Madrugada",
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
    integral: "Dia inteiro",
  };
  for (const segment of [...path].reverse()) {
    const normalized = normalizedKey(segment).replace(/[^a-z]/g, "");
    if (labels[normalized]) return labels[normalized];
  }
  return "Previsão diária";
}

function collectForecastPeriods(value: unknown, path: string[] = []): InmetForecastPeriod[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectForecastPeriods(item, [...path, String(index)]));
  }

  const record = asRecord(value);
  if (!record) return [];

  const summary = asText(findValue(record, SUMMARY_KEYS));
  const minimum = asNumber(findValue(record, MINIMUM_KEYS));
  const maximum = asNumber(findValue(record, MAXIMUM_KEYS));
  const humidityMinimum = asNumber(findValue(record, HUMIDITY_MINIMUM_KEYS));
  const humidityMaximum = asNumber(findValue(record, HUMIDITY_MAXIMUM_KEYS));
  const windDirection = asText(findValue(record, WIND_DIRECTION_KEYS));
  const windIntensity = asText(findValue(record, WIND_INTENSITY_KEYS));
  const icon = asText(findValue(record, ICON_KEYS));
  const date = dateFrom(findValue(record, DATE_KEYS), path);
  const period = periodFrom(findValue(record, PERIOD_KEYS), path);

  const ownPeriod =
    summary || minimum !== null || maximum !== null
      ? [
          {
            id: [date ?? "sem-data", period, summary ?? "sem-resumo"].join(":"),
            date,
            period,
            summary: summary ?? "Condição não detalhada pelo INMET.",
            minimum,
            maximum,
            humidityMinimum,
            humidityMaximum,
            windDirection,
            windIntensity,
            icon,
          } satisfies InmetForecastPeriod,
        ]
      : [];

  const nested = Object.entries(record).flatMap(([key, nestedValue]) =>
    collectForecastPeriods(nestedValue, [...path, key]),
  );
  return [...ownPeriod, ...nested];
}

function deduplicatePeriods(periods: InmetForecastPeriod[]) {
  const unique = new Map<string, InmetForecastPeriod>();
  for (const period of periods) {
    const key = [period.date, normalizedKey(period.period), normalizedKey(period.summary)].join("|");
    if (!unique.has(key)) unique.set(key, period);
  }
  return [...unique.values()]
    .sort((first, second) => {
      const dateOrder = (first.date ?? "9999-99-99").localeCompare(second.date ?? "9999-99-99");
      if (dateOrder !== 0) return dateOrder;
      const periodOrder = ["madrugada", "manha", "tarde", "noite", "dia inteiro", "previsao diaria"];
      return (
        periodOrder.indexOf(normalizedKey(first.period)) -
        periodOrder.indexOf(normalizedKey(second.period))
      );
    })
    .slice(0, 24);
}

function unavailable(error: string): InmetForecast {
  return {
    status: "unavailable",
    periods: [],
    source: { name: "INMET", url: FORECAST_URL, fetchedAt: new Date().toISOString() },
    error,
  };
}

export function parseInmetForecastPayload(payload: unknown) {
  return deduplicatePeriods(collectForecastPeriods(payload));
}

export async function fetchInmetForecast(): Promise<InmetForecast> {
  try {
    const response = await fetch(FORECAST_URL, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(WEATHER_SOURCE_REQUEST_TIMEOUT_MS.inmet),
    });
    if (!response.ok) throw new Error(`INMET respondeu com HTTP ${response.status}.`);

    const periods = parseInmetForecastPayload((await response.json()) as unknown);
    if (!periods.length) {
      throw new Error("A previsão municipal do INMET não retornou períodos reconhecíveis.");
    }

    return {
      status: "live",
      periods,
      source: {
        name: "INMET",
        url: INMET_PORTAL_URL,
        fetchedAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    return unavailable(
      error instanceof Error ? error.message : "Falha desconhecida ao consultar a previsão do INMET.",
    );
  }
}
