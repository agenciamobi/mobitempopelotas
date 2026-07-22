import "server-only";

import { unstable_cache } from "next/cache";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ORIGIN = "https://www.youtube.com";
export const YOUTUBE_LARANJAL_CHANNEL_URL =
  "https://www.youtube.com/@praiadolaranjal/streams";

export type YouTubeStreamStatus = "live" | "replay";

export type YouTubeLatestStream = {
  videoId: string;
  title: string;
  status: YouTubeStreamStatus;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string;
};

type ChannelResponse = {
  items?: Array<{
    id: string;
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
};

type PlaylistResponse = {
  items?: Array<{
    contentDetails?: { videoId?: string };
  }>;
};

type VideosResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    liveStreamingDetails?: {
      actualStartTime?: string;
      actualEndTime?: string;
      scheduledStartTime?: string;
    };
    status?: { embeddable?: boolean; privacyStatus?: string };
  }>;
};

async function youtubeRequest<T>(
  resource: string,
  parameters: Record<string, string>,
  apiKey: string,
): Promise<T> {
  const url = new URL(`${YOUTUBE_API}/${resource}`);
  Object.entries(parameters).forEach(([name, value]) => {
    url.searchParams.set(name, value);
  });
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`YouTube ${resource} respondeu com status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function thumbnailUrl(
  thumbnails: Record<string, { url?: string }> | undefined,
) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

function streamFromVideoId(
  videoId: string,
  title = "Praia do Laranjal ao vivo",
): YouTubeLatestStream {
  return {
    videoId,
    title,
    status: "live",
    watchUrl: `${YOUTUBE_ORIGIN}/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: new Date().toISOString(),
  };
}

function normalizeVideoId(value: string | undefined) {
  const videoId = value?.trim();
  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
}

function decodeJsonText(value: string | undefined) {
  if (!value) return null;

  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return value.replace(/\\u0026/g, "&").replace(/\\n/g, " ").trim();
  }
}

function extractPublicLiveStream(html: string) {
  const liveMarkers = [...html.matchAll(/"isLiveNow":true/g)];

  for (const marker of liveMarkers) {
    const markerIndex = marker.index ?? 0;
    const start = Math.max(0, markerIndex - 12_000);
    const context = html.slice(start, markerIndex + 2_000);
    const videoMatches = [...context.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)];
    const videoId = videoMatches.at(-1)?.[1];

    if (!videoId) continue;

    const videoIndex = context.lastIndexOf(`"videoId":"${videoId}"`);
    const titleContext = context.slice(Math.max(0, videoIndex - 2_000), videoIndex + 4_000);
    const title =
      decodeJsonText(
        titleContext.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/)?.[1],
      ) ??
      decodeJsonText(
        titleContext.match(/"title":\{"simpleText":"((?:\\.|[^"\\])*)"/)?.[1],
      ) ??
      "Praia do Laranjal ao vivo";

    return streamFromVideoId(videoId, title);
  }

  return null;
}

const getCachedLatestStream = unstable_cache(
  async (apiKey: string, handle: string): Promise<YouTubeLatestStream | null> => {
    const channels = await youtubeRequest<ChannelResponse>(
      "channels",
      { part: "id,contentDetails", forHandle: handle },
      apiKey,
    );
    const uploadsPlaylist =
      channels.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylist) return null;

    const playlist = await youtubeRequest<PlaylistResponse>(
      "playlistItems",
      {
        part: "contentDetails",
        playlistId: uploadsPlaylist,
        maxResults: "12",
      },
      apiKey,
    );
    const videoIds = (playlist.items ?? [])
      .map((item) => item.contentDetails?.videoId)
      .filter((videoId): videoId is string => Boolean(videoId));

    if (!videoIds.length) return null;

    const videos = await youtubeRequest<VideosResponse>(
      "videos",
      {
        part: "snippet,liveStreamingDetails,status",
        id: videoIds.join(","),
      },
      apiKey,
    );

    const streams = (videos.items ?? [])
      .filter(
        (video) =>
          video.liveStreamingDetails &&
          video.status?.embeddable !== false &&
          video.status?.privacyStatus === "public" &&
          video.snippet?.publishedAt &&
          video.snippet?.title,
      )
      .sort(
        (a, b) =>
          new Date(b.snippet!.publishedAt!).getTime() -
          new Date(a.snippet!.publishedAt!).getTime(),
      );

    const selected =
      streams.find(
        (video) =>
          video.liveStreamingDetails?.actualStartTime &&
          !video.liveStreamingDetails?.actualEndTime,
      ) ?? streams.find((video) => video.liveStreamingDetails?.actualEndTime);

    if (!selected) return null;

    const status: YouTubeStreamStatus =
      selected.liveStreamingDetails?.actualStartTime &&
      !selected.liveStreamingDetails?.actualEndTime
        ? "live"
        : "replay";

    return {
      videoId: selected.id,
      title: selected.snippet!.title!,
      status,
      watchUrl: `${YOUTUBE_ORIGIN}/watch?v=${selected.id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${selected.id}`,
      thumbnailUrl: thumbnailUrl(selected.snippet?.thumbnails),
      publishedAt: selected.snippet!.publishedAt!,
    };
  },
  ["youtube-laranjal-latest-stream-v1"],
  { revalidate: 300 },
);

const getCachedPublicLiveStream = unstable_cache(
  async (handle: string): Promise<YouTubeLatestStream | null> => {
    const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;
    const response = await fetch(
      `${YOUTUBE_ORIGIN}/${normalizedHandle}/streams`,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (compatible; TempoPelotas/1.0; +https://www.tempopelotas.com.br)",
        },
        next: { revalidate: 180 },
        signal: AbortSignal.timeout(8_000),
      },
    );

    if (!response.ok) {
      throw new Error(`Página pública do YouTube respondeu com status ${response.status}`);
    }

    const html = await response.text();
    return extractPublicLiveStream(html);
  },
  ["youtube-laranjal-public-live-v1"],
  { revalidate: 180 },
);

function logResolvedStream(
  source: "manual" | "api" | "public-page",
  stream: YouTubeLatestStream,
) {
  console.info("[youtube-laranjal] transmissão localizada", {
    source,
    status: stream.status,
    videoId: stream.videoId,
  });
}

export async function getLatestLaranjalStream() {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const handle = process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || "@praiadolaranjal";
  const manualVideoId = normalizeVideoId(
    process.env.YOUTUBE_LARANJAL_VIDEO_ID,
  );

  if (manualVideoId) {
    const manualStream = streamFromVideoId(manualVideoId);
    logResolvedStream("manual", manualStream);
    return manualStream;
  }

  if (apiKey) {
    try {
      const apiStream = await getCachedLatestStream(apiKey, handle);
      if (apiStream) {
        logResolvedStream("api", apiStream);
        return apiStream;
      }
    } catch (error) {
      console.warn("[youtube-laranjal] API indisponível; tentando página pública", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  try {
    const publicStream = await getCachedPublicLiveStream(handle);
    if (publicStream) {
      logResolvedStream("public-page", publicStream);
      return publicStream;
    }

    console.info("[youtube-laranjal] nenhuma transmissão ao vivo localizada", {
      source: "public-page",
      apiConfigured: Boolean(apiKey),
    });
    return null;
  } catch (error) {
    console.warn("[youtube-laranjal] transmissão indisponível", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}
