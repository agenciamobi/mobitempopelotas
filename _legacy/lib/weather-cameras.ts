import {
  getLatestLaranjalStream,
  YOUTUBE_LARANJAL_CHANNEL_URL,
  type YouTubeStreamStatus,
} from "@/lib/youtube-latest-stream";

export type WeatherCameraStatus = "online" | "preparing";

export type WeatherCamera = {
  id: string;
  name: string;
  shortName: string;
  area: string;
  description: string;
  observation: string;
  latitude: number;
  longitude: number;
  status: WeatherCameraStatus;
  broadcastStatus: YouTubeStreamStatus | null;
  streamTitle: string | null;
  embedUrl: string | null;
  publicUrl: string | null;
  provider: string | null;
};

type CameraDefinition = Omit<
  WeatherCamera,
  | "status"
  | "broadcastStatus"
  | "streamTitle"
  | "embedUrl"
  | "publicUrl"
  | "provider"
> & {
  embedEnv: keyof NodeJS.ProcessEnv;
  publicEnv: keyof NodeJS.ProcessEnv;
  providerEnv: keyof NodeJS.ProcessEnv;
};

const CAMERA_DEFINITIONS: CameraDefinition[] = [
  {
    id: "laranjal",
    name: "Câmera Praia do Laranjal",
    shortName: "Laranjal",
    area: "Praia do Laranjal",
    description:
      "Visão da orla para observar nebulosidade, visibilidade, vento e condições gerais da Lagoa dos Patos.",
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
      "Referência visual urbana para acompanhar chuva, formação de nuvens e condições de visibilidade na área central.",
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
      "Imagem de apoio para observar as condições do céu e do entorno do canal, sem substituir medições hidrológicas oficiais.",
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
    const isLocalHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if (url.protocol !== "https:" && !isLocalHttp) return null;

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeProvider(value: string | undefined) {
  const provider = value?.trim();
  return provider ? provider.slice(0, 80) : null;
}

export async function getWeatherCameras(): Promise<WeatherCamera[]> {
  const latestLaranjalStream = await getLatestLaranjalStream();

  return CAMERA_DEFINITIONS.map((camera) => {
    const configuredEmbedUrl = normalizeUrl(process.env[camera.embedEnv]);
    const configuredPublicUrl = normalizeUrl(process.env[camera.publicEnv]);
    const isLaranjal = camera.id === "laranjal";
    const youtubeStream = isLaranjal ? latestLaranjalStream : null;
    const embedUrl = configuredEmbedUrl ?? youtubeStream?.embedUrl ?? null;
    const publicUrl =
      configuredPublicUrl ??
      youtubeStream?.watchUrl ??
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
      broadcastStatus: youtubeStream?.status ?? null,
      streamTitle: youtubeStream?.title ?? null,
      embedUrl,
      publicUrl,
      provider:
        normalizeProvider(process.env[camera.providerEnv]) ??
        (youtubeStream ? "Praia do Laranjal · YouTube" : null),
    };
  });
}
