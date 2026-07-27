import { z } from "zod";

const SACE_BASE_URL = "https://sace.sgb.gov.br/guaiba";
const SACE_PUBLIC_URL = `${SACE_BASE_URL}/`;
const STATIONS_URL = `${SACE_BASE_URL}/api/geojson/point`;
const ALERTS_URL = `${SACE_BASE_URL}/rest/alertas`;
const BOUNDS_URL = `${SACE_BASE_URL}/api/geojson/bounds`;
const WMS_CONFIG_URL = `${SACE_BASE_URL}/wms-config`;
const REQUEST_TIMEOUT_MS = 8_000;

const finiteNumber = z.number().finite();
const nullableNumber = finiteNumber.nullable().optional();
const nullableString = z.string().nullable().optional();

const stationPropertiesSchema = z
  .object({
    id: z.number().int(),
    nome: z.string().min(1),
    sigla: z.string().optional().default(""),
    rio: z.string().optional().default(""),
    localizacao: z.string().optional().default(""),
    latitude: finiteNumber,
    longitude: finiteNumber,
    areaDrenagem: nullableNumber,
    tipoAlerta: z.string().optional().default("SEM_INFORMACAO"),
    corAlerta: nullableString,
    nomeFiltroAlerta: nullableString,
    ordemLegenda: nullableNumber,
  })
  .passthrough();

const stationsSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      geometry: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([finiteNumber, finiteNumber]),
      }),
      properties: stationPropertiesSchema,
    }),
  ),
});

const alertLegendSchema = z.array(
  z
    .object({
      prioridade: finiteNumber.nullable().optional(),
      tipoAlerta: z.string().min(1),
      ordemLegenda: finiteNumber,
      nome: z.string().min(1),
      cor: z.string().min(1),
    })
    .passthrough(),
);

const boundsSchema = z.object({
  minx: finiteNumber,
  miny: finiteNumber,
  maxx: finiteNumber,
  maxy: finiteNumber,
});

const wmsConfigSchema = z.object({
  camadas: z.array(
    z.object({
      title: z.string().min(1),
      url: z.string().url(),
      layerName: z.string().min(1),
      options: z
        .object({
          version: z.string().optional(),
          format: z.string().optional(),
          transparent: z.boolean().optional(),
        })
        .passthrough()
        .optional(),
    }),
  ),
});

export type SaceRiverSystem =
  | "Guaíba e Delta"
  | "Jacuí"
  | "Taquari-Antas"
  | "Caí"
  | "Sinos"
  | "Gravataí"
  | "Outros afluentes";

export type SaceGuaibaStation = {
  id: number;
  name: string;
  code: string;
  river: string;
  location: string;
  longitude: number;
  latitude: number;
  drainageAreaKm2: number | null;
  alertType: string;
  alertLabel: string;
  alertColor: string;
  legendOrder: number | null;
  riverSystem: SaceRiverSystem;
  transmitting: boolean;
};

export type SaceGuaibaLegendItem = {
  priority: number | null;
  alertType: string;
  order: number;
  label: string;
  color: string;
};

export type SaceGuaibaLayer = {
  title: string;
  url: string;
  layerName: string;
  version: string;
  format: string;
  transparent: boolean;
};

export type SaceGuaibaData = {
  status: "live" | "partial" | "unavailable";
  stations: SaceGuaibaStation[];
  highlightedStations: SaceGuaibaStation[];
  legend: SaceGuaibaLegendItem[];
  bounds: [number, number, number, number] | null;
  layers: SaceGuaibaLayer[];
  counts: {
    total: number;
    transmitting: number;
    normal: number;
    aboveNormal: number;
    withoutTransmission: number;
  };
  systems: Array<{ name: SaceRiverSystem; total: number; aboveNormal: number }>;
  source: {
    name: "SACE Guaíba / Serviço Geológico do Brasil";
    url: string;
    fetchedAt: string;
    endpoints: string[];
  };
  error: string | null;
};

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function resolveRiverSystem(value: string): SaceRiverSystem {
  const normalized = normalizeText(value);
  if (/guaiba|delta do jacui|cais maua|gasometro|ipanema/.test(normalized)) return "Guaíba e Delta";
  if (/taquari|antas/.test(normalized)) return "Taquari-Antas";
  if (/jacui/.test(normalized)) return "Jacuí";
  if (/\bcai\b/.test(normalized)) return "Caí";
  if (/sinos/.test(normalized)) return "Sinos";
  if (/gravatai/.test(normalized)) return "Gravataí";
  return "Outros afluentes";
}

function fallbackAlertLabel(type: string) {
  if (type === "NORMAL") return "Normal";
  if (type === "SEM_INFORMACAO") return "Sem transmissão";
  if (type === "BAIXO") return "Cota de Atenção";
  if (type === "MEDIO") return "Cota de Alerta";
  if (type === "ALTO") return "Situação elevada";
  return "Situação não informada";
}

function stationIsAboveNormal(station: SaceGuaibaStation) {
  return station.transmitting && station.alertType !== "NORMAL";
}

function normalizeLegend(payload: unknown) {
  const parsed = alertLegendSchema.safeParse(payload);
  if (!parsed.success) return [];

  return parsed.data
    .map<SaceGuaibaLegendItem>((item) => ({
      priority: item.prioridade ?? null,
      alertType: item.tipoAlerta.trim().toUpperCase(),
      order: item.ordemLegenda,
      label: item.nome.trim(),
      color: normalizeHexColor(item.cor, "#78909c"),
    }))
    .sort((first, second) => first.order - second.order);
}

function normalizeStations(
  payload: z.infer<typeof stationsSchema>,
  legend: SaceGuaibaLegendItem[],
) {
  const legendByLabel = new Map(legend.map((item) => [normalizeText(item.label), item]));
  const legendByType = new Map<string, SaceGuaibaLegendItem[]>();
  for (const item of legend) {
    const values = legendByType.get(item.alertType) ?? [];
    values.push(item);
    legendByType.set(item.alertType, values);
  }

  return payload.features.map<SaceGuaibaStation>((feature) => {
    const properties = feature.properties;
    const alertType = (properties.tipoAlerta.trim() || "SEM_INFORMACAO").toUpperCase();
    const explicitLabel = properties.nomeFiltroAlerta?.trim() || "";
    const alertLabel = explicitLabel || fallbackAlertLabel(alertType);
    const matchedLegend =
      legendByLabel.get(normalizeText(alertLabel)) ?? legendByType.get(alertType)?.at(-1);
    const transmitting = alertType !== "SEM_INFORMACAO" && !/sem transmiss/i.test(alertLabel);

    return {
      id: properties.id,
      name: properties.nome.trim(),
      code: properties.sigla.trim(),
      river: properties.rio.trim() || "Rio não informado",
      location: properties.localizacao.trim(),
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      drainageAreaKm2: properties.areaDrenagem ?? null,
      alertType,
      alertLabel,
      alertColor: normalizeHexColor(properties.corAlerta, matchedLegend?.color ?? "#78909c"),
      legendOrder: properties.ordemLegenda ?? matchedLegend?.order ?? null,
      riverSystem: resolveRiverSystem(`${properties.rio} ${properties.nome}`),
      transmitting,
    };
  });
}

function selectHighlightedStations(stations: SaceGuaibaStation[]) {
  const elevated = stations
    .filter(stationIsAboveNormal)
    .sort((first, second) => (first.legendOrder ?? 99) - (second.legendOrder ?? 99));
  const patterns = [
    /cais mau[aá]/i,
    /gas[oô]metro/i,
    /estrel/i,
    /encantado/i,
    /bom retiro do sul/i,
    /dona francisca/i,
    /campo bom/i,
    /barca do ca[ií]/i,
  ];
  const strategic = patterns
    .map((pattern) => stations.find((station) => pattern.test(station.name)))
    .filter((station): station is SaceGuaibaStation => Boolean(station));

  return [...new Map([...elevated, ...strategic].map((station) => [station.id, station])).values()].slice(
    0,
    12,
  );
}

function countStations(stations: SaceGuaibaStation[]) {
  const transmitting = stations.filter((station) => station.transmitting).length;
  const normal = stations.filter(
    (station) => station.transmitting && station.alertType === "NORMAL",
  ).length;
  const aboveNormal = stations.filter(stationIsAboveNormal).length;
  return {
    total: stations.length,
    transmitting,
    normal,
    aboveNormal,
    withoutTransmission: stations.length - transmitting,
  };
}

function countSystems(stations: SaceGuaibaStation[]) {
  const names: SaceRiverSystem[] = [
    "Guaíba e Delta",
    "Jacuí",
    "Taquari-Antas",
    "Caí",
    "Sinos",
    "Gravataí",
    "Outros afluentes",
  ];
  return names
    .map((name) => {
      const matching = stations.filter((station) => station.riverSystem === name);
      return { name, total: matching.length, aboveNormal: matching.filter(stationIsAboveNormal).length };
    })
    .filter((item) => item.total > 0);
}

function source(fetchedAt: Date) {
  return {
    name: "SACE Guaíba / Serviço Geológico do Brasil" as const,
    url: SACE_PUBLIC_URL,
    fetchedAt: fetchedAt.toISOString(),
    endpoints: [STATIONS_URL, ALERTS_URL, BOUNDS_URL, WMS_CONFIG_URL],
  };
}

function unavailableData(error: string, fetchedAt = new Date()): SaceGuaibaData {
  return {
    status: "unavailable",
    stations: [],
    highlightedStations: [],
    legend: [],
    bounds: null,
    layers: [],
    counts: { total: 0, transmitting: 0, normal: 0, aboveNormal: 0, withoutTransmission: 0 },
    systems: [],
    source: source(fetchedAt),
    error,
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`SACE respondeu HTTP ${response.status} em ${new URL(url).pathname}.`);
  return response.json() as Promise<unknown>;
}

export async function fetchSaceGuaibaData(): Promise<SaceGuaibaData> {
  const fetchedAt = new Date();
  const [stationsResult, legendResult, boundsResult, wmsResult] = await Promise.allSettled([
    fetchJson(STATIONS_URL),
    fetchJson(ALERTS_URL),
    fetchJson(BOUNDS_URL),
    fetchJson(WMS_CONFIG_URL),
  ]);

  if (stationsResult.status === "rejected") {
    return unavailableData(
      `A rede pública de estações do SACE Guaíba não respondeu. ${String(stationsResult.reason)}`,
      fetchedAt,
    );
  }

  const parsedStations = stationsSchema.safeParse(stationsResult.value);
  if (!parsedStations.success) {
    return unavailableData("O SACE Guaíba respondeu com uma estrutura de estações inesperada.", fetchedAt);
  }

  const legend = normalizeLegend(legendResult.status === "fulfilled" ? legendResult.value : null);
  const stations = normalizeStations(parsedStations.data, legend);
  const parsedBounds =
    boundsResult.status === "fulfilled" ? boundsSchema.safeParse(boundsResult.value) : null;
  const bounds: SaceGuaibaData["bounds"] = parsedBounds?.success
    ? [parsedBounds.data.minx, parsedBounds.data.miny, parsedBounds.data.maxx, parsedBounds.data.maxy]
    : null;
  const parsedWms = wmsResult.status === "fulfilled" ? wmsConfigSchema.safeParse(wmsResult.value) : null;
  const layers: SaceGuaibaLayer[] = parsedWms?.success
    ? parsedWms.data.camadas
        .filter((layer) => new URL(layer.url).hostname.endsWith("sgb.gov.br"))
        .map((layer) => ({
          title: layer.title,
          url: layer.url,
          layerName: layer.layerName,
          version: layer.options?.version ?? "1.1.0",
          format: layer.options?.format ?? "image/png",
          transparent: layer.options?.transparent ?? true,
        }))
    : [];

  const missing = [
    legend.length === 0 ? "legenda oficial" : null,
    bounds === null ? "limites da bacia" : null,
    layers.length === 0 ? "camadas cartográficas" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    status: missing.length ? "partial" : "live",
    stations,
    highlightedStations: selectHighlightedStations(stations),
    legend,
    bounds,
    layers,
    counts: countStations(stations),
    systems: countSystems(stations),
    source: source(fetchedAt),
    error: missing.length ? `Dados disponíveis sem ${missing.join(", ")}.` : null,
  };
}
