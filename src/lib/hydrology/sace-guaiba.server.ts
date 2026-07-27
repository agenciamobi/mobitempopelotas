import { z } from "zod";

const SACE_BASE_URL = "https://sace.sgb.gov.br/guaiba";
const SACE_PUBLIC_URL = `${SACE_BASE_URL}/`;
const STATIONS_URL = `${SACE_BASE_URL}/api/geojson/point`;
const ALERTS_URL = `${SACE_BASE_URL}/rest/alertas`;
const BOUNDS_URL = `${SACE_BASE_URL}/api/geojson/bounds`;
const WMS_CONFIG_URL = `${SACE_BASE_URL}/wms-config`;
const REQUEST_TIMEOUT_MS = 8_000;

const nullableNumber = z.number().finite().nullable().optional();
const nullableString = z.string().nullable().optional();

const stationPropertiesSchema = z
  .object({
    id: z.number().int(),
    nome: z.string().min(1),
    sigla: z.string().optional().default(""),
    rio: z.string().optional().default(""),
    localizacao: z.string().optional().default(""),
    latitude: z.number().finite(),
    longitude: z.number().finite(),
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
        coordinates: z.tuple([z.number().finite(), z.number().finite()]),
      }),
      properties: stationPropertiesSchema,
    }),
  ),
});

const alertLegendSchema = z.array(
  z
    .object({
      prioridade: z.number().finite(),
      tipoAlerta: z.string().min(1),
      ordemLegenda: z.number().finite(),
      nome: z.string().min(1),
      cor: z.string().min(1),
    })
    .passthrough(),
);

const boundsSchema = z.object({
  minx: z.number().finite(),
  miny: z.number().finite(),
  maxx: z.number().finite(),
  maxy: z.number().finite(),
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

export type SaceRiverSystem =
  | "Guaíba e Delta"
  | "Jacuí"
  | "Taquari-Antas"
  | "Caí"
  | "Sinos"
  | "Gravataí"
  | "Outros afluentes";

export type SaceGuaibaLegendItem = {
  priority: number;
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

function riverSystem(value: string): SaceRiverSystem {
  const normalized = value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (/guaiba|delta do jacui|cais maua|gasometro|ipanema/.test(normalized)) return "Guaíba e Delta";
  if (/taquari|antas/.test(normalized)) return "Taquari-Antas";
  if (/jacui/.test(normalized)) return "Jacuí";
  if (/\bcai\b/.test(normalized)) return "Caí";
  if (/sinos/.test(normalized)) return "Sinos";
  if (/gravatai/.test(normalized)) return "Gravataí";
  return "Outros afluentes";
}

function fallbackAlertLabel(type: string) {
  const normalized = type.toUpperCase();
  if (normalized === "NORMAL") return "Normal";
  if (normalized === "SEM_INFORMACAO") return "Sem transmissão";
  if (normalized === "BAIXO") return "Cota de Atenção";
  if (normalized === "MEDIO") return "Cota de Alerta";
  if (normalized === "ALTO") return "Situação elevada";
  return "Situação não informada";
}

function isTransmitting(type: string, label: string) {
  return type.toUpperCase() !== "SEM_INFORMACAO" && !/sem transmiss/i.test(label);
}

function isAboveNormal(station: SaceGuaibaStation) {
  return station.transmitting && station.alertType.toUpperCase() !== "NORMAL";
}

function normalizeStations(
  payload: z.infer<typeof stationsSchema>,
  legend: SaceGuaibaLegendItem[],
): SaceGuaibaStation[] {
  const legendByLabel = new Map(legend.map((item) => [item.label.toLowerCase(), item]));
  const legendByType = new Map<string, SaceGuaibaLegendItem[]>();
  for (const item of legend) {
    const items = legendByType.get(item.alertType.toUpperCase()) ?? [];
    items.push(item);
    legendByType.set(item.alertType.toUpperCase(), items);
  }

  return payload.features.map((feature) => {
    const properties = feature.properties;
    const alertType = properties.tipoAlerta.trim() || "SEM_INFORMACAO";
    const explicitLabel = properties.nomeFiltroAlerta?.trim() || "";
    const alertLabel = explicitLabel || fallbackAlertLabel(alertType);
    const matchedLegend =
      legendByLabel.get(alertLabel.toLowerCase()) ?? legendByType.get(alertType.toUpperCase())?.at(-1);
    const transmitting = isTransmitting(alertType, alertLabel);

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
      riverSystem: riverSystem(`${properties.rio} ${properties.nome}`),
      transmitting,
    };
  });
}

function highlightStations(stations: SaceGuaibaStation[]) {
  const elevated = stations
    .filter(isAboveNormal)
    .sort((first, second) => (first.legendOrder ?? 99) - (second.legendOrder ?? 99));
  const strategicPatterns = [
    /cais mau[aá]/i,
    /gas[oô]metro/i,
    /estrel/i,
    /encantado/i,
    /bom retiro do sul/i,
    /dona francisca/i,
    /campo bom/i,
    /barca do ca[ií]/i,
  ];
  const strategic = strategicPatterns
    .map((pattern) => stations.find((station) => pattern.test(station.name)))
    .filter((station): station is SaceGuaibaStation => Boolean(station));

  return [...new Map([...elevated, ...strategic].map((station) => [station.id, station])).values()].slice(
    0,
    12,
  );
}

function networkCounts(stations: SaceGuaibaStation[]) {
  const transmitting = stations.filter((station) => station.transmitting).length;
  const normal = stations.filter(
    (station) => station.transmitting && station.alertType.toUpperCase() === "NORMAL",
  ).length;
  const aboveNormal = stations.filter(isAboveNormal).length;

  return {
    total: stations.length,
    transmitting,
    normal,
    aboveNormal,
    withoutTransmission: stations.length - transmitting,
  };
}

function systemCounts(stations: SaceGuaibaStation[]) {
  const systems: SaceRiverSystem[] = [
    "Guaíba e Delta",
    "Jacuí",
    "Taquari-Antas",
    "Caí",
    "Sinos",
    "Gravataí",
    "Outros afluentes",
  ];

  return systems
    .map((name) => {
      const matching = stations.filter((station) => station.riverSystem === name);
      return { name, total: matching.length, aboveNormal: matching.filter(isAboveNormal).length };
    })
    .filter((item) => item.total > 0);
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
    source: {
      name: "SACE Guaíba / Serviço Geológico do Brasil",
      url: SACE_PUBLIC_URL,
      fetchedAt: fetchedAt.toISOString(),
      endpoints: [STATIONS_URL, ALERTS_URL, BOUNDS_URL, WMS_CONFIG_URL],
    },
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

  const parsedLegend =
    legendResult.status === "fulfilled" ? alertLegendSchema.safeParse(legendResult.value) : null;
  const legend: SaceGuaibaLegendItem[] = parsedLegend?.success
    ? parsedLegend.data
        .map((item) => ({
          priority: item.prioridade,
          alertType: item.tipoAlerta,
          order: item.ordemLegenda,
          label: item.nome,
          color: normalizeHexColor(item.cor, "#78909c"),
        }))
        .sort((first, second) => first.order - second.order)
    : [];
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

  const errors = [
    legendResult.status === "rejected" || !parsedLegend?.success ? "legenda oficial" : null,
    boundsResult.status === "rejected" || !parsedBounds?.success ? "limites da bacia" : null,
    wmsResult.status === "rejected" || !parsedWms?.success ? "camadas cartográficas" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    status: errors.length ? "partial" : "live",
    stations,
    highlightedStations: highlightStations(stations),
    legend,
    bounds,
    layers,
    counts: networkCounts(stations),
    systems: systemCounts(stations),
    source: {
      name: "SACE Guaíba / Serviço Geológico do Brasil",
      url: SACE_PUBLIC_URL,
      fetchedAt: fetchedAt.toISOString(),
      endpoints: [STATIONS_URL, ALERTS_URL, BOUNDS_URL, WMS_CONFIG_URL],
    },
    error: errors.length ? `Dados disponíveis sem ${errors.join(", ")}.` : null,
  };
}
