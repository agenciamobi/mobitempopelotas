import "server-only";

import type {
  RedemetBounds,
  RedemetImageFrame,
  RedemetImageLayerResponse,
  RedemetSatelliteType,
  RedemetStormFrame,
  RedemetStormLayerResponse,
} from "@/lib/redemet-types";

const DEFAULT_BASE_URL = "https://api-redemet.decea.mil.br/";
const PROVIDER = "REDEMET / DECEA" as const;
const TIMEZONE = "America/Sao_Paulo";
const IMAGE_PROXY_PATH = "/api/redemet/image";
const PELOTAS_COORDINATES = { latitude: -31.7654, longitude: -52.3376 };
const STORM_RADIUS_KM = 450;

const RADAR_AREA = process.env.REDEMET_RADAR_AREA?.trim() || "cn";
const RADAR_PRODUCT = process.env.REDEMET_RADAR_PRODUCT?.trim() || "maxcappi";

const SATELLITE_LABELS: Record<RedemetSatelliteType, string> = {
  realcada: "Satélite infravermelho realçado",
  ir: "Satélite infravermelho",
  vis: "Satélite visível",
};

const ALLOWED_IMAGE_HOSTS = new Set([
  "api-redemet.decea.mil.br",
  "estatico-redemet.decea.mil.br",
  "redemet.decea.mil.br",
  "redemet.decea.gov.br",
]);

type JsonRecord = Record<string, unknown>;

type RawImageFrame = {
  path: string;
  data: string | null;
  bounds: RedemetBounds | null;
};

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  const normalized =
    typeof value === "string" ? value.trim().replace(",", ".") : value;
  const number = typeof normalized === "number" ? normalized : Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function clampFrameCount(value: number, maximum: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(maximum, Math.round(value)));
}

function apiBaseUrl() {
  const configured = process.env.REDEMET_API_BASE_URL?.trim();
  return configured || DEFAULT_BASE_URL;
}

function apiKey() {
  return process.env.REDEMET_API_KEY?.trim() || null;
}

function buildApiUrl(
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const base = apiBaseUrl().endsWith("/")
    ? apiBaseUrl()
    : `${apiBaseUrl()}/`;
  const url = new URL(path.replace(/^\//, ""), base);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  return url;
}

async function fetchRedemet(
  path: string,
  params: Record<string, string | number | undefined>,
  revalidate: number,
) {
  const key = apiKey();
  if (!key) throw new Error("REDEMET_API_KEY não configurada");

  const response = await fetch(buildApiUrl(path, params), {
    headers: {
      Accept: "application/json",
      "X-Api-Key": key,
      "User-Agent": "TempoPelotas/1.0 (+https://tempopelotas.com.br)",
    },
    next: { revalidate },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`REDEMET respondeu com status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const root = asRecord(payload);

  if (root?.status === false) {
    throw new Error(
      asString(root.message) || "REDEMET informou indisponibilidade",
    );
  }

  return payload;
}

function normalizeOfficialImageUrl(value: string) {
  try {
    const base = apiBaseUrl().endsWith("/")
      ? apiBaseUrl()
      : `${apiBaseUrl()}/`;
    const url = new URL(value, base);
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

function readBounds(record: JsonRecord | null): RedemetBounds | null {
  if (!record) return null;

  const west = asNumber(
    record.lon_min ?? record.longitude_min ?? record.west ?? record.xmin,
  );
  const east = asNumber(
    record.lon_max ?? record.longitude_max ?? record.east ?? record.xmax,
  );
  const south = asNumber(
    record.lat_min ?? record.latitude_min ?? record.south ?? record.ymin,
  );
  const north = asNumber(
    record.lat_max ?? record.latitude_max ?? record.north ?? record.ymax,
  );

  if (west === null || east === null || south === null || north === null) {
    return null;
  }
  if (west >= east || south >= north) return null;
  if (west < -180 || east > 180 || south < -90 || north > 90) return null;

  return { west, south, east, north };
}

function findFirstBounds(value: unknown): RedemetBounds | null {
  const record = asRecord(value);
  if (record) {
    const direct = readBounds(record);
    if (direct) return direct;

    for (const nested of Object.values(record)) {
      const found = findFirstBounds(nested);
      if (found) return found;
    }
  } else if (Array.isArray(value)) {
    for (const nested of value) {
      const found = findFirstBounds(nested);
      if (found) return found;
    }
  }

  return null;
}

function collectImageFrames(
  value: unknown,
  inheritedBounds: RedemetBounds | null = null,
): RawImageFrame[] {
  const output: RawImageFrame[] = [];
  const record = asRecord(value);

  if (record) {
    const bounds = readBounds(record) ?? inheritedBounds;
    const rawPath = asString(
      record.path ?? record.url ?? record.imagem ?? record.image ?? record.arquivo,
    );
    const path = rawPath ? normalizeOfficialImageUrl(rawPath) : null;

    if (path) {
      output.push({
        path,
        data: asString(
          record.data ??
            record.date ??
            record.datetime ??
            record.horario ??
            record.timestamp,
        ),
        bounds,
      });
    }

    for (const nested of Object.values(record)) {
      output.push(...collectImageFrames(nested, bounds));
    }
  } else if (Array.isArray(value)) {
    for (const nested of value) {
      output.push(...collectImageFrames(nested, inheritedBounds));
    }
  }

  return output;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();

  const compact = trimmed.match(
    /^(20\d{2})(\d{2})(\d{2})[T_ -]?(\d{2})(\d{2})(\d{2})?$/,
  );
  if (compact) {
    const [, year, month, day, hour, minute, second = "00"] = compact;
    const parsed = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const brazilian = trimmed.match(
    /^(\d{2})\/(\d{2})\/(20\d{2})[ ,T]+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (brazilian) {
    const [, day, month, year, hour, minute, second = "00"] = brazilian;
    const parsed = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`,
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const date = new Date(withZone);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFrameLabel(value: string | null, fallbackIndex: number) {
  const date = parseDate(value);

  if (date) {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  return value?.slice(-16) || `Quadro ${fallbackIndex + 1}`;
}

function proxyImageUrl(path: string) {
  return `${IMAGE_PROXY_PATH}?src=${encodeURIComponent(path)}`;
}

function normalizeImageFrames(
  raw: RawImageFrame[],
  fallbackBounds: RedemetBounds | null,
) {
  const unique = new Map<string, RawImageFrame>();

  for (const frame of raw) {
    if (!frame.bounds && !fallbackBounds) continue;
    unique.set(frame.path, frame);
  }

  return [...unique.values()]
    .sort((a, b) => {
      const aTime = parseDate(a.data)?.getTime() ?? 0;
      const bTime = parseDate(b.data)?.getTime() ?? 0;
      return aTime - bTime;
    })
    .map<RedemetImageFrame>((frame, index) => ({
      id: `${index}-${frame.data ?? frame.path}`,
      label: formatFrameLabel(frame.data, index),
      observedAt: parseDate(frame.data)?.toISOString() ?? null,
      imageUrl: proxyImageUrl(frame.path),
      bounds: frame.bounds ?? fallbackBounds!,
    }));
}

function emptyImageLayer(
  product: string,
  sourceLabel: string,
  error: string,
): RedemetImageLayerResponse {
  return {
    configured: Boolean(apiKey()),
    available: false,
    provider: PROVIDER,
    product,
    sourceLabel,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error,
  };
}

function emptyStormLayer(error: string): RedemetStormLayerResponse {
  return {
    configured: Boolean(apiKey()),
    available: false,
    provider: PROVIDER,
    product: "STSC — ocorrências de trovoada",
    sourceLabel: `STSC em até ${STORM_RADIUS_KM} km de Pelotas`,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error,
  };
}

function findProperty(value: unknown, property: string): unknown {
  const record = asRecord(value);

  if (record) {
    if (property in record) return record[property];

    for (const nested of Object.values(record)) {
      const found = findProperty(nested, property);
      if (found !== undefined) return found;
    }
  } else if (Array.isArray(value)) {
    for (const nested of value) {
      const found = findProperty(nested, property);
      if (found !== undefined) return found;
    }
  }

  return undefined;
}

function extractAnimationLabels(value: unknown) {
  const anima = findProperty(value, "anima");
  return Array.isArray(anima)
    ? anima.map(asString).filter((item): item is string => Boolean(item))
    : [];
}

function distanceKm(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function collectStormPoints(value: unknown) {
  const points: Array<{ latitude: number; longitude: number }> = [];
  const record = asRecord(value);

  if (record) {
    const latitude = asNumber(
      record.la ?? record.lat ?? record.latitude ?? record.y,
    );
    const longitude = asNumber(
      record.lo ?? record.lon ?? record.longitude ?? record.lng ?? record.x,
    );

    if (
      latitude !== null &&
      longitude !== null &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      const point = { latitude, longitude };
      if (distanceKm(PELOTAS_COORDINATES, point) <= STORM_RADIUS_KM) {
        points.push(point);
      }
    }

    for (const nested of Object.values(record)) {
      points.push(...collectStormPoints(nested));
    }
  } else if (Array.isArray(value)) {
    for (const nested of value) points.push(...collectStormPoints(nested));
  }

  const unique = new Map<string, { latitude: number; longitude: number }>();
  for (const point of points) {
    unique.set(`${point.latitude.toFixed(4)}:${point.longitude.toFixed(4)}`, point);
  }
  return [...unique.values()];
}

function extractStormFrames(value: unknown) {
  const rawFrames = findProperty(value, "stsc");
  const labels = extractAnimationLabels(value);

  if (!Array.isArray(rawFrames)) return [];

  return rawFrames.map<RedemetStormFrame>((rawFrame, frameIndex) => {
    const rawLabel = labels[frameIndex] || null;
    const observedAt = parseDate(rawLabel)?.toISOString() ?? null;

    return {
      id: `${frameIndex}-${rawLabel ?? "quadro"}`,
      label: formatFrameLabel(rawLabel, frameIndex),
      observedAt,
      points: collectStormPoints(rawFrame),
    };
  });
}

export async function getRedemetRadar(
  frameCount = 10,
): Promise<RedemetImageLayerResponse> {
  const framesRequested = clampFrameCount(frameCount, 15, 10);
  const product = `Radar meteorológico de Canguçu — ${RADAR_PRODUCT}`;
  const sourceLabel = "Radar de Canguçu / RS";

  if (!apiKey()) {
    return emptyImageLayer(
      product,
      sourceLabel,
      "Integração REDEMET aguardando configuração da chave.",
    );
  }

  try {
    const payload = await fetchRedemet(
      `produtos/radar/${encodeURIComponent(RADAR_PRODUCT)}`,
      { area: RADAR_AREA, anima: framesRequested },
      180,
    );
    const frames = normalizeImageFrames(
      collectImageFrames(payload),
      findFirstBounds(payload),
    ).slice(-framesRequested);

    if (!frames.length) {
      return emptyImageLayer(
        product,
        sourceLabel,
        "A REDEMET não retornou imagens recentes do radar de Canguçu.",
      );
    }

    return {
      configured: true,
      available: true,
      provider: PROVIDER,
      product,
      sourceLabel,
      frames,
      currentIndex: frames.length - 1,
      updatedAt: frames.at(-1)?.observedAt ?? new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    console.error("[redemet] Falha ao consultar radar:", error);
    return emptyImageLayer(
      product,
      sourceLabel,
      "Radar REDEMET temporariamente indisponível.",
    );
  }
}

export async function getRedemetSatellite(
  type: RedemetSatelliteType = "realcada",
  frameCount = 10,
): Promise<RedemetImageLayerResponse> {
  const framesRequested = clampFrameCount(frameCount, 15, 10);
  const product = SATELLITE_LABELS[type];
  const sourceLabel = "Satélite meteorológico REDEMET";

  if (!apiKey()) {
    return emptyImageLayer(
      product,
      sourceLabel,
      "Integração REDEMET aguardando configuração da chave.",
    );
  }

  try {
    const payload = await fetchRedemet(
      `produtos/satelite/${type}`,
      { anima: framesRequested },
      300,
    );
    const frames = normalizeImageFrames(
      collectImageFrames(payload),
      findFirstBounds(payload),
    ).slice(-framesRequested);

    if (!frames.length) {
      return emptyImageLayer(
        product,
        sourceLabel,
        "A REDEMET não retornou imagens recentes de satélite.",
      );
    }

    return {
      configured: true,
      available: true,
      provider: PROVIDER,
      product,
      sourceLabel,
      frames,
      currentIndex: frames.length - 1,
      updatedAt: frames.at(-1)?.observedAt ?? new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    console.error("[redemet] Falha ao consultar satélite:", error);
    return emptyImageLayer(
      product,
      sourceLabel,
      "Satélite REDEMET temporariamente indisponível.",
    );
  }
}

export async function getRedemetStorms(
  frameCount = 20,
): Promise<RedemetStormLayerResponse> {
  const framesRequested = clampFrameCount(frameCount, 60, 20);

  if (!apiKey()) {
    return emptyStormLayer(
      "Integração REDEMET aguardando configuração da chave.",
    );
  }

  try {
    const payload = await fetchRedemet(
      "produtos/stsc",
      { anima: framesRequested },
      120,
    );
    const frames = extractStormFrames(payload).slice(-framesRequested);

    if (!frames.length) {
      return emptyStormLayer(
        "A REDEMET não retornou quadros recentes de trovoadas.",
      );
    }

    return {
      configured: true,
      available: true,
      provider: PROVIDER,
      product: "STSC — ocorrências de trovoada",
      sourceLabel: `STSC em até ${STORM_RADIUS_KM} km de Pelotas`,
      frames,
      currentIndex: frames.length - 1,
      updatedAt: frames.at(-1)?.observedAt ?? new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    console.error("[redemet] Falha ao consultar trovoadas:", error);
    return emptyStormLayer(
      "Monitoramento de trovoadas REDEMET temporariamente indisponível.",
    );
  }
}

export function isAllowedRedemetImageUrl(value: string) {
  return normalizeOfficialImageUrl(value) !== null;
}
