import type {
  RedemetStormFrame,
  RedemetStormLayerResponse,
  RedemetStormPoint,
} from "./redemet.types";

const DEFAULT_BASE_URL = "https://api-redemet.decea.mil.br/";
const PROVIDER = "REDEMET / DECEA" as const;
const PRODUCT = "STSC — ocorrências de trovoada" as const;
const TIMEZONE = "America/Sao_Paulo";
const STORM_RADIUS_KM = 450;
const REQUEST_TIMEOUT_MS = 12_000;
const PELOTAS_COORDINATES = { latitude: -31.7654, longitude: -52.3376 };

const ALLOWED_API_HOSTS = new Set([
  "api-redemet.decea.mil.br",
  "api-redemet.decea.gov.br",
]);

type JsonRecord = Record<string, unknown>;

type RuntimeWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function readServerEnvironment(name: string) {
  return (globalThis as RuntimeWithProcess).process?.env?.[name]?.trim() || null;
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

function clampFrameCount(value: number, maximum: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(maximum, Math.round(value)));
}

function parseDate(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}-03:00`;
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
  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(calculation));
}

function parsePoints(value: unknown): RedemetStormPoint[] {
  if (!Array.isArray(value)) return [];

  const unique = new Map<string, RedemetStormPoint>();

  for (const rawPoint of value) {
    const point = asRecord(rawPoint);
    if (!point) continue;

    const latitude = asNumber(point.la ?? point.lat ?? point.latitude);
    const longitude = asNumber(point.lo ?? point.lon ?? point.lng ?? point.longitude);
    if (latitude === null || longitude === null) continue;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;

    const normalized = { latitude, longitude };
    if (distanceKm(PELOTAS_COORDINATES, normalized) > STORM_RADIUS_KM) continue;

    unique.set(`${latitude.toFixed(4)}:${longitude.toFixed(4)}`, normalized);
  }

  return [...unique.values()];
}

function officialFrames(payload: unknown) {
  const root = asRecord(payload);
  return Array.isArray(root?.data) ? root.data : null;
}

function legacyFrames(payload: unknown) {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  return Array.isArray(data?.stsc) ? data.stsc : null;
}

function legacyLabels(payload: unknown) {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  return Array.isArray(data?.anima)
    ? data.anima.map(asString).filter((value): value is string => Boolean(value))
    : [];
}

export function parseRedemetStscPayload(payload: unknown): RedemetStormFrame[] {
  const direct = officialFrames(payload);

  if (direct) {
    return direct
      .map<RedemetStormFrame>((rawFrame, frameIndex) => {
        const frame = asRecord(rawFrame);
        const rawDate = frame
          ? asString(
              frame.ultima_ocorrencia ?? frame.horario ?? frame.stop ?? frame.start,
            )
          : null;

        return {
          id: `${frameIndex}-${rawDate ?? "quadro"}`,
          label: formatFrameLabel(rawDate, frameIndex),
          observedAt: parseDate(rawDate)?.toISOString() ?? null,
          points: parsePoints(frame?.pontos),
        };
      })
      .sort((first, second) =>
        (first.observedAt ?? "").localeCompare(second.observedAt ?? ""),
      );
  }

  const legacy = legacyFrames(payload);
  if (!legacy) return [];
  const labels = legacyLabels(payload);

  return legacy.map<RedemetStormFrame>((rawFrame, frameIndex) => {
    const rawDate = labels[frameIndex] ?? null;
    const frame = asRecord(rawFrame);
    return {
      id: `${frameIndex}-${rawDate ?? "quadro"}`,
      label: formatFrameLabel(rawDate, frameIndex),
      observedAt: parseDate(rawDate)?.toISOString() ?? null,
      points: parsePoints(frame?.pontos ?? rawFrame),
    };
  });
}

function emptyStormLayer(error: string): RedemetStormLayerResponse {
  return {
    configured: Boolean(apiKey()),
    available: false,
    provider: PROVIDER,
    product: PRODUCT,
    sourceLabel: `STSC em até ${STORM_RADIUS_KM} km de Pelotas`,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error,
  };
}

async function requestOfficialStsc() {
  const key = apiKey();
  if (!key) throw new Error("REDEMET_API_KEY não configurada");

  const url = new URL("produtos/stsc/0", apiBaseUrl());
  url.searchParams.set("api_key", key);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TempoPelotas/1.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`REDEMET respondeu com HTTP ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const root = asRecord(payload);
  if (root?.status === false) {
    throw new Error(asString(root.message) || "REDEMET informou indisponibilidade");
  }

  return payload;
}

export async function fetchRedemetStorms(
  frameCount = 20,
): Promise<RedemetStormLayerResponse> {
  const framesRequested = clampFrameCount(frameCount, 60, 20);

  if (!apiKey()) {
    return emptyStormLayer("Integração REDEMET aguardando configuração da chave.");
  }

  try {
    const payload = await requestOfficialStsc();
    const frames = parseRedemetStscPayload(payload).slice(-framesRequested);

    if (!frames.length) {
      return emptyStormLayer("A REDEMET não retornou quadros recentes de trovoadas.");
    }

    return {
      configured: true,
      available: true,
      provider: PROVIDER,
      product: PRODUCT,
      sourceLabel: `STSC em até ${STORM_RADIUS_KM} km de Pelotas`,
      frames,
      currentIndex: frames.length - 1,
      updatedAt: frames.at(-1)?.observedAt ?? new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    console.error("[redemet/storms] Consulta indisponível", {
      message: error instanceof Error ? error.message : "Falha desconhecida",
    });
    return emptyStormLayer("Monitoramento de trovoadas REDEMET temporariamente indisponível.");
  }
}
