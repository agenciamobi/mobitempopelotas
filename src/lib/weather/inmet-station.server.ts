import type { InmetStationReference } from "./official-sources.types";
import { WEATHER_SOURCE_REQUEST_TIMEOUT_MS } from "./source-policy.ts";

const PELOTAS_IBGE_CODE = "4314407";
const STATION_URL = `https://apiprevmet3.inmet.gov.br/estacao/proxima/${PELOTAS_IBGE_CODE}`;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findValue(record: JsonRecord, aliases: readonly string[]) {
  const normalized = new Map(Object.entries(record).map(([key, value]) => [normalizeKey(key), value]));
  for (const alias of aliases) {
    const value = normalized.get(normalizeKey(alias));
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function asText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || null;
}

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function stationScore(record: JsonRecord) {
  const fields = [
    findValue(record, ["cd_estacao", "codigo", "code", "id"]),
    findValue(record, ["dc_nome", "nome", "estacao", "station"]),
    findValue(record, ["vl_latitude", "latitude", "lat"]),
    findValue(record, ["vl_longitude", "longitude", "lon", "lng"]),
  ];
  return fields.filter((field) => field !== null).length;
}

function collectRecords(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.flatMap(collectRecords);
  const record = asRecord(value);
  if (!record) return [];
  return [record, ...Object.values(record).flatMap(collectRecords)];
}

export function parseInmetStationPayload(payload: unknown): InmetStationReference["station"] {
  const candidate = collectRecords(payload)
    .map((record) => ({ record, score: stationScore(record) }))
    .sort((first, second) => second.score - first.score)[0];

  if (!candidate || candidate.score < 2) return null;
  const record = candidate.record;
  const name = asText(findValue(record, ["dc_nome", "nome", "estacao", "station"]));
  if (!name) return null;

  return {
    code: asText(findValue(record, ["cd_estacao", "codigo", "code", "id"])),
    name,
    municipality: asText(findValue(record, ["municipio", "cidade", "dc_cidade"])),
    state: asText(findValue(record, ["uf", "estado", "sg_estado"])),
    latitude: asNumber(findValue(record, ["vl_latitude", "latitude", "lat"])),
    longitude: asNumber(findValue(record, ["vl_longitude", "longitude", "lon", "lng"])),
    altitude: asNumber(findValue(record, ["vl_altitude", "altitude"])),
    distanceKm: asNumber(findValue(record, ["distancia", "distancia_km", "distance", "distance_km"])),
  };
}

function unavailable(error: string): InmetStationReference {
  return {
    status: "unavailable",
    station: null,
    source: { name: "INMET", url: STATION_URL, fetchedAt: new Date().toISOString() },
    error,
  };
}

export async function fetchInmetStationReference(): Promise<InmetStationReference> {
  try {
    const response = await fetch(STATION_URL, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(WEATHER_SOURCE_REQUEST_TIMEOUT_MS.inmet),
    });
    if (!response.ok) throw new Error(`INMET respondeu com HTTP ${response.status}.`);

    const station = parseInmetStationPayload((await response.json()) as unknown);
    if (!station) throw new Error("A estação de referência do INMET não pôde ser reconhecida.");

    return {
      status: "live",
      station,
      source: { name: "INMET", url: STATION_URL, fetchedAt: new Date().toISOString() },
      error: null,
    };
  } catch (error) {
    return unavailable(
      error instanceof Error ? error.message : "Falha desconhecida ao consultar a estação do INMET.",
    );
  }
}
