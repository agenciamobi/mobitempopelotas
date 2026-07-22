import type {
  YouTubeBroadcastStatus,
  YouTubeCameraStream,
} from "./cameras.types";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ORIGIN = "https://www.youtube.com";
const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";
const REQUEST_TIMEOUT_MS = 8_000;
const DEFAULT_CHANNEL_HANDLE = "@praiadolaranjal";
const DEFAULT_CHANNEL_ID = "UCqvFgdUJ7kuChDA7hbnz1ZA";

export const YOUTUBE_LARANJAL_CHANNEL_URL =
  "https://www.youtube.com/@praiadolaranjal/streams";

const cameraTitlePattern = /(?:c[aâ]mera|laranjal|c[eé]u|clima)/i;

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

type RssEntry = {
  videoId: string;
  title: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
};

function normalizeVideoId(value: string | undefined) {
  const videoId = value?.trim();
  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
}

function normalizeBroadcastStatus(value: string | undefined): YouTubeBroadcastStatus {
  return value?.trim().toLowerCase() === "replay" ? "replay" : "live";
}

function decodeJsonText(value: string | undefined) {
  if (!value) return null;

  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return value.replace(/\\u0026/g, "&").replace(/\\n/g, " ").trim();
  }
}

function decodeXmlText(value: string | undefined) {
  if (!value) return null;
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function thumbnailUrl(thumbnails: Record<string, { url?: string }> | undefined) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

function streamFromVideoId({
  videoId,
  title,
  status,
  publishedAt,
  thumbnail,
  source,
}: {
  videoId: string;
  title: string;
  status: YouTubeBroadcastStatus;
  publishedAt: string | null;
  thumbnail?: string | null;
  source: YouTubeCameraStream["source"];
}): YouTubeCameraStream {
  return {
    videoId,
    title,
    status,
    watchUrl: `${YOUTUBE_ORIGIN}/watch?v=${videoId}`,
    embedUrl: `${YOUTUBE_EMBED_ORIGIN}/embed/${videoId}`,
    thumbnailUrl: thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt,
    source,
  };
}

async function youtubeRequest<T>(
  resource: string,
  parameters: Record<string, string>,
  apiKey: string,
): Promise<T> {
  const url = new URL(`${YOUTUBE_API}/${resource}`);
  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`YouTube ${resource} respondeu com HTTP ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function fetchStreamFromApi(apiKey: string, handle: string) {
  const channels = await youtubeRequest<ChannelResponse>(
    "channels",
    { part: "id,contentDetails", forHandle: handle.replace(/^@/, "") },
    apiKey,
  );
  const uploadsPlaylist = channels.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) return null;

  const playlist = await youtubeRequest<PlaylistResponse>(
    "playlistItems",
    {
      part: "contentDetails",
      playlistId: uploadsPlaylist,
      maxResults: "15",
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
        video.snippet?.title &&
        cameraTitlePattern.test(video.snippet.title),
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

  const status: YouTubeBroadcastStatus =
    selected.liveStreamingDetails?.actualStartTime &&
    !selected.liveStreamingDetails?.actualEndTime
      ? "live"
      : "replay";

  return streamFromVideoId({
    videoId: selected.id,
    title: selected.snippet!.title!,
    status,
    publishedAt: selected.snippet!.publishedAt!,
    thumbnail: thumbnailUrl(selected.snippet?.thumbnails),
    source: "api",
  });
}

function extractPublicLiveStream(html: string) {
  const liveMarkers = [...html.matchAll(/"isLiveNow":true/g)];

  for (const marker of liveMarkers) {
    const markerIndex = marker.index ?? 0;
    const start = Math.max(0, markerIndex - 15_000);
    const context = html.slice(start, markerIndex + 3_000);
    const videoMatches = [...context.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)];
    const videoId = videoMatches.at(-1)?.[1];
    if (!videoId) continue;

    const videoIndex = context.lastIndexOf(`"videoId":"${videoId}"`);
    const titleContext = context.slice(Math.max(0, videoIndex - 3_000), videoIndex + 5_000);
    const title =
      decodeJsonText(
        titleContext.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/)?.[1],
      ) ??
      decodeJsonText(
        titleContext.match(/"title":\{"simpleText":"((?:\\.|[^"\\])*)"/)?.[1],
      ) ??
      "Praia do Laranjal ao vivo";

    if (!cameraTitlePattern.test(title)) continue;

    return streamFromVideoId({
      videoId,
      title,
      status: "live",
      publishedAt: null,
      source: "public-page",
    });
  }

  return null;
}

async function fetchPublicLiveStream(handle: string) {
  const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const response = await fetch(`${YOUTUBE_ORIGIN}/${normalizedHandle}/streams`, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
      "User-Agent":
        "Mozilla/5.0 (compatible; TempoPelotas/1.0; +https://agenciamobi.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Página pública do YouTube respondeu com HTTP ${response.status}.`);
  }

  return extractPublicLiveStream(await response.text());
}

function parseRssEntries(xml: string): RssEntry[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap((match) => {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/)?.[1];
    const title = decodeXmlText(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    if (!videoId || !title) return [];

    return [
      {
        videoId,
        title,
        publishedAt: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null,
        thumbnailUrl:
          entry.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&") ??
          null,
      },
    ];
  });
}

async function fetchLatestReplay(channelId: string) {
  const response = await fetch(`${YOUTUBE_ORIGIN}/feeds/videos.xml?channel_id=${channelId}`, {
    headers: {
      Accept: "application/atom+xml,application/xml,text/xml",
      "User-Agent": "MOBI-Tempo-Pelotas/1.0 (+https://agenciamobi.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Feed público do YouTube respondeu com HTTP ${response.status}.`);
  }

  const entries = parseRssEntries(await response.text());
  const selected = entries.find((entry) => cameraTitlePattern.test(entry.title));
  if (!selected) return null;

  return streamFromVideoId({
    videoId: selected.videoId,
    title: selected.title,
    status: "replay",
    publishedAt: selected.publishedAt,
    thumbnail: selected.thumbnailUrl,
    source: "rss",
  });
}

export async function getLatestLaranjalStream() {
  const manualVideoId = normalizeVideoId(process.env.YOUTUBE_LARANJAL_VIDEO_ID);
  if (manualVideoId) {
    return streamFromVideoId({
      videoId: manualVideoId,
      title: process.env.YOUTUBE_LARANJAL_VIDEO_TITLE?.trim() || "Praia do Laranjal",
      status: normalizeBroadcastStatus(process.env.YOUTUBE_LARANJAL_VIDEO_STATUS),
      publishedAt: null,
      source: "manual",
    });
  }

  const handle = process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || DEFAULT_CHANNEL_HANDLE;
  const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim() || DEFAULT_CHANNEL_ID;
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (apiKey) {
    try {
      const apiStream = await fetchStreamFromApi(apiKey, handle);
      if (apiStream) return apiStream;
    } catch (error) {
      console.warn("[cameras/youtube] API indisponível; tentando página pública", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    const publicStream = await fetchPublicLiveStream(handle);
    if (publicStream) return publicStream;
  } catch (error) {
    console.warn("[cameras/youtube] Página pública indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    return await fetchLatestReplay(channelId);
  } catch (error) {
    console.warn("[cameras/youtube] Feed público indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
