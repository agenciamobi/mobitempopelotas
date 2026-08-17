import type {
  RedemetBounds,
  RedemetImageFrame,
  RedemetImageLayerResponse,
} from "./redemet.types";

const DEFAULT_BASE_URL = "https://api-redemet.decea.mil.br/";
const PROVIDER = "REDEMET / DECEA" as const;
const OFFICIAL_RADAR_URL = "https://redemet.decea.mil.br/radar/";
const IMAGE_PROXY_PATH = "/api/redemet/image";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 12_000;
const DEFAULT_RADAR_AREA = "cn";
const DEFAULT_RADAR_PRODUCT = "maxcappi";
const FALLBACK_RADAR_PRODUCTS = ["10km", "07km", "05km", "03km"] as const;

const ALLOWED_API_HOSTS = new Set(["api-redemet.decea.mil.br", "api-redemet.decea.gov.br"]);
const ALLOWED_IMAGE_HOSTS = new Set([
  "api-redemet.decea.mil.br",
  "api-redemet.decea.gov.br",
  "estatico-redemet.decea.mil.br",
  "estatico-redemet.decea.gov.br",
  "redemet.decea.mil.br",
  "redemet.decea.gov.br",
]);

type JsonRecord = Record<string, unknown>;
type RuntimeWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

type RawRadarFrame = {
  path: string;
  data: string | null;
  bounds: RedemetBounds;
};

type ParsedRadarPayload = {
  frames: RedemetImageFrame[];
  matchingRecords: number;
  recordsWithPath: number;
};

function readServerEnvironment(name: string) {
  return (globalThis as RuntimeWithProcess).process?.env?.[name]?.trim() || null;
}

function configuredRadarArea() {
  const area = readServerEnvironment("REDEMET_RADAR_AREA")?.toLowerCase();
  return area && /^[a-z0-9_-]{1,20}$/.test(area) ? area : DEFAULT_RADAR_AREA;
}

function configuredRadarProduct() {
  const product = readServerEnvironment("REDEMET_RADAR_PRODUCT")?.toLowerCase();
  return product && /^[a-z0-9_-]{1,40}$/.test(product) ? product : DEFAULT_RADAR_PRODUCT;
}

function apiKey() {
  return readServerEnvironment("REDEMET_API_KEY");
}

function apiBaseUrl() {
  const configured = readServerEnvironment("REDEMET_API_BASE_URL") || DEFAULT_BASE_URL;

  try {
    const url = new URL(configured.endsWith("/") ? configured : `${configured}/`);
    if (url.protocol !== "https:" || !ALLOWED_API_HOSTS.has(url.hostname.toLowerCase())) {
      return new URL(DEFAULT_BASE_URL);
    }
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(DEFAULT_BASE_URL);
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const number = typeof normalized === "number" ? normalized : Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function clampFrameCount(value: number) {
  if (!Number.isFinite(value)) return 10;
  return Math.max(1, Math.min(15, Math.round(value)));
}

function readBounds(record: JsonRecord): RedemetBounds | null {
  const west = asNumber(record.lon_min ?? record.longitude_min ?? record.west ?? record.xmin);
  const east = asNumber(record.lon_max ?? record.longitude_max ?? record.east ?? record.xmax);
  const south = asNumber(record.lat_min ?? record.latitude_min ?? record.south ?? record.ymin);
  const north = asNumber(record.lat_max ?? record.latitude_max ?? record.north ?? record.ymax);

  if (west === null || east === null || south === null || north === null) return null;
  if (west >= east || south >= north) return null;
  if (west < -180 || east > 180 || south < -90 || north > 90) return null;

  return { west, south, east, north };
}

function normalizeOfficialImageUrl(value: string) {
  try {
    const url = new URL(value, apiBaseUrl());
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

function parseDate(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  const compact = trimmed.match(/^(20\d{2})(\d{2})(\d{2})[T_ -]?(\d{2})(\d{2})(\d{2})?$/);

  if (compact) {
    const [, year, month, day, hour, minute, second = "00"] = compact;
    const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const brazilian = trimmed.match(
    /^(\d{2})\/(\d{2})\/(20\d{2})[ ,T]+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (brazilian) {
    const [, day, month, year, hour, minute, second = "00"] = brazilian;
    const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const parsed = new Date(withZone);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFrameLabel(value: string | null, fallbackIndex: number) {
  const date = parseDate(value);
  if (!date) return value?.slice(-16) || `Quadro ${fallbackIndex + 1}`;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function collectRadarRecords(value: unknown, area: string, output: JsonRecord[] = []) {
  const record = asRecord(value);

  if (record) {
    const locality = asString(record.localidade)?.toLowerCase();
    if (locality === area) output.push(record);

    for (const nested of Object.values(record)) {
      collectRadarRecords(nested, area, output);
    }
  } else if (Array.isArray(value)) {
    for (const nested of value) collectRadarRecords(nested, area, output);
  }

  return output;
}

export function parseRadarPayloadForArea(
  payload: unknown,
  area = DEFAULT_RADAR_AREA,
  frameCount = 10,
): ParsedRadarPayload {
  const normalizedArea = area.trim().toLowerCase();
  const requestedFrames = clampFrameCount(frameCount);
  const records = collectRadarRecords(payload, normalizedArea);
  const rawFrames: RawRadarFrame[] = records.flatMap((record) => {
    const rawPath = asString(
      record.path ?? record.url ?? record.imagem ?? record.image ?? record.arquivo,
    );
    const path = rawPath ? normalizeOfficialImageUrl(rawPath) : null;
    const bounds = readBounds(record);
    if (!path || !bounds) return [];

    return [
      {
        path,
        data: asString(
          record.data ?? record.date ?? record.datetime ?? record.horario ?? record.timestamp,
        ),
        bounds,
      },
    ];
  });
  const unique = new Map<string, RawRadarFrame>();
  for (const frame of rawFrames) unique.set(frame.path, frame);

  const frames = [...unique.values()]
    .sort((first, second) => {
      const firstTime = parseDate(first.data)?.getTime() ?? 0;
      const secondTime = parseDate(second.data)?.getTime() ?? 0;
      return firstTime - secondTime;
    })
    .slice(-requestedFrames)
    .map<RedemetImageFrame>((frame, index) => ({
      id: `${index}-${frame.data ?? frame.path}`,
      label: formatFrameLabel(frame.data, index),
      observedAt: parseDate(frame.data)?.toISOString() ?? null,
      imageUrl: `${IMAGE_PROXY_PATH}?src=${encodeURIComponent(frame.path)}`,
      bounds: frame.bounds,
    }));

  return {
    frames,
    matchingRecords: records.length,
    recordsWithPath: rawFrames.length,
  };
}

function emptyRadarLayer(product: string, error: string): RedemetImageLayerResponse {
  return {
    configured: Boolean(apiKey()),
    available: false,
    provider: PROVIDER,
    product: `Radar meteorológico de Canguçu — ${product}`,
    sourceLabel: "Radar de Canguçu / RS",
    officialUrl: OFFICIAL_RADAR_URL,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error,
  };
}

async function fetchRadarProduct(
  product: string,
  area: string,
  frameCount: number,
): Promise<ParsedRadarPayload> {
  const key = apiKey();
  if (!key) throw new Error("REDEMET_API_KEY não configurada");

  const url = new URL(`produtos/radar/${encodeURIComponent(product)}`, apiBaseUrl());
  url.searchParams.set("area", area);
  url.searchParams.set("anima", String(frameCount));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": key,
      "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const payload = (await response.json()) as unknown;
  const root = asRecord(payload);
  if (root?.status === false) throw new Error("upstream-status-false");

  return parseRadarPayloadForArea(payload, area, frameCount);
}

export async function fetchRedemetRadarResilient(
  frameCount = 10,
): Promise<RedemetImageLayerResponse> {
  const requestedFrames = clampFrameCount(frameCount);
  const area = configuredRadarArea();
  const configuredProduct = configuredRadarProduct();

  if (!apiKey()) {
    return emptyRadarLayer(
      configuredProduct,
      "Integração REDEMET aguardando configuração da chave.",
    );
  }

  const products = [
    configuredProduct,
    ...FALLBACK_RADAR_PRODUCTS.filter((product) => product !== configuredProduct),
  ];

  for (const product of products) {
    try {
      const parsed = await fetchRadarProduct(product, area, requestedFrames);

      if (parsed.frames.length > 0) {
        const isFallback = product !== configuredProduct;
        return {
          configured: true,
          available: true,
          provider: PROVIDER,
          product: `Radar meteorológico de Canguçu — ${product}`,
          sourceLabel: isFallback
            ? "Radar de Canguçu / RS · produto alternativo REDEMET"
            : "Radar de Canguçu / RS",
          officialUrl: OFFICIAL_RADAR_URL,
          frames: parsed.frames,
          currentIndex: parsed.frames.length - 1,
          updatedAt: parsed.frames.at(-1)?.observedAt ?? new Date().toISOString(),
          error: null,
        };
      }

      console.warn("[redemet/radar] Produto sem imagem utilizável", {
        area,
        product,
        matchingRecords: parsed.matchingRecords,
        recordsWithPath: parsed.recordsWithPath,
      });
    } catch (error) {
      console.warn("[redemet/radar] Produto indisponível", {
        area,
        product,
        reason: error instanceof Error ? error.message : "falha-desconhecida",
      });
    }
  }

  return emptyRadarLayer(
    configuredProduct,
    "A REDEMET não retornou imagens recentes do radar de Canguçu nos produtos consultados.",
  );
}
