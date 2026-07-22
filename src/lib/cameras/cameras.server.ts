import type { WeatherCamera, WeatherCameraData } from "./cameras.types";
import { getLatestLaranjalStream, YOUTUBE_LARANJAL_CHANNEL_URL } from "./youtube.server";

type CameraDefinition = Omit<
  WeatherCamera,
  | "status"
  | "broadcastStatus"
  | "streamTitle"
  | "embedUrl"
  | "publicUrl"
  | "thumbnailUrl"
  | "publishedAt"
  | "provider"
  | "source"
> & {
  embedEnv: string;
  publicEnv: string;
  providerEnv: string;
};

const CAMERA_DEFINITIONS: CameraDefinition[] = [
  {
    id: "laranjal",
    name: "Câmera Praia do Laranjal",
    shortName: "Laranjal",
    area: "Praia do Laranjal",
    description:
      "Visão da orla para observar nebulosidade, visibilidade, vento aparente e condições gerais da Lagoa dos Patos.",
    observation: "Orla e Lagoa dos Patos",
    latitude: -31.7715,
    longitude: -52.2361,
    embedEnv: "CAMERA_LARANJAL_EMBED_URL",
    publicEnv: "CAMERA_LARANJAL_PUBLIC_URL",
    providerEnv: "CAMERA_LARANJAL_PROVIDER",
  },
  {
    id: "centro",
    name: "Câmera Centro de Pelotas",
    shortName: "Centro",
    area: "Centro histórico",
    description:
      "Ponto previsto para acompanhar chuva, formação de nuvens e condições de visibilidade na área central.",
    observation: "Área urbana central",
    latitude: -31.7654,
    longitude: -52.3376,
    embedEnv: "CAMERA_CENTRO_EMBED_URL",
    publicEnv: "CAMERA_CENTRO_PUBLIC_URL",
    providerEnv: "CAMERA_CENTRO_PROVIDER",
  },
  {
    id: "sao-goncalo",
    name: "Câmera Canal São Gonçalo",
    shortName: "São Gonçalo",
    area: "Canal São Gonçalo",
    description:
      "Ponto previsto para observar o céu e o entorno do canal, sem substituir medições hidrológicas oficiais.",
    observation: "Canal e zona portuária",
    latitude: -31.7908,
    longitude: -52.3252,
    embedEnv: "CAMERA_SAO_GONCALO_EMBED_URL",
    publicEnv: "CAMERA_SAO_GONCALO_PUBLIC_URL",
    providerEnv: "CAMERA_SAO_GONCALO_PROVIDER",
  },
];

function normalizeUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    const localHttp =
      url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (url.protocol !== "https:" && !localHttp) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeProvider(value: string | undefined) {
  const provider = value?.trim();
  return provider ? provider.slice(0, 80) : null;
}

export async function fetchWeatherCameras(): Promise<WeatherCameraData> {
  const fetchedAt = new Date().toISOString();
  const latestLaranjalStream = await getLatestLaranjalStream();

  const cameras = CAMERA_DEFINITIONS.map((camera): WeatherCamera => {
    const configuredEmbedUrl = normalizeUrl(process.env[camera.embedEnv]);
    const configuredPublicUrl = normalizeUrl(process.env[camera.publicEnv]);
    const configuredProvider = normalizeProvider(process.env[camera.providerEnv]);
    const isLaranjal = camera.id === "laranjal";
    const resolvedStream = isLaranjal && !configuredEmbedUrl ? latestLaranjalStream : null;
    const embedUrl = configuredEmbedUrl ?? resolvedStream?.embedUrl ?? null;
    const publicUrl =
      configuredPublicUrl ??
      resolvedStream?.watchUrl ??
      (isLaranjal ? YOUTUBE_LARANJAL_CHANNEL_URL : null);

    return {
      id: camera.id,
      name: camera.name,
      shortName: camera.shortName,
      area: camera.area,
      description: camera.description,
      observation: camera.observation,
      latitude: camera.latitude,
      longitude: camera.longitude,
      status: embedUrl ? "online" : "preparing",
      broadcastStatus: resolvedStream?.status ?? null,
      streamTitle: resolvedStream?.title ?? null,
      embedUrl,
      publicUrl,
      thumbnailUrl: resolvedStream?.thumbnailUrl ?? null,
      publishedAt: resolvedStream?.publishedAt ?? null,
      provider:
        configuredProvider ??
        (configuredEmbedUrl
          ? "Fonte configurada no portal"
          : resolvedStream
            ? "Praia do Laranjal · YouTube"
            : null),
      source: configuredEmbedUrl ? "configured" : (resolvedStream?.source ?? null),
    };
  });

  const laranjal = cameras.find((camera) => camera.id === "laranjal");
  const warning =
    laranjal?.status === "online"
      ? null
      : "Nenhuma transmissão pública está disponível no Laranjal neste momento. O canal e os pontos previstos continuam acessíveis.";

  return {
    cameras,
    source: {
      name: "Praia do Laranjal / YouTube e fontes configuradas",
      url: YOUTUBE_LARANJAL_CHANNEL_URL,
      fetchedAt,
    },
    warning,
  };
}
