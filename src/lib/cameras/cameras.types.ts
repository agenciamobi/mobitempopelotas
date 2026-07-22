export type YouTubeBroadcastStatus = "live" | "replay";

export type YouTubeCameraStream = {
  videoId: string;
  title: string;
  status: YouTubeBroadcastStatus;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  source: "manual" | "api" | "public-page" | "rss";
};

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
  broadcastStatus: YouTubeBroadcastStatus | null;
  streamTitle: string | null;
  embedUrl: string | null;
  publicUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  provider: string | null;
  source: YouTubeCameraStream["source"] | "configured" | null;
};

export type WeatherCameraData = {
  cameras: WeatherCamera[];
  source: {
    name: string;
    url: string;
    fetchedAt: string;
  };
  warning: string | null;
};
