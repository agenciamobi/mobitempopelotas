import {
  buildOpenWeatherRadarUrl,
  isAllowedRadarTileRequest,
} from "@/lib/weather-radar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RadarTileRouteContext = {
  params: Promise<{
    timestamp: string;
    z: string;
    x: string;
    y: string;
  }>;
};

function errorResponse(message: string, status: number) {
  return Response.json(
    { success: false, error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function GET(_request: Request, context: RadarTileRouteContext) {
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();

  if (!apiKey) {
    return errorResponse("Radar não configurado", 503);
  }

  const params = await context.params;
  const timestamp = Number(params.timestamp);
  const zoom = Number(params.z);
  const x = Number(params.x);
  const y = Number(params.y);

  if (!isAllowedRadarTileRequest(timestamp, zoom, x, y)) {
    return errorResponse("Tile de radar inválido ou fora da janela permitida", 400);
  }

  try {
    const upstreamUrl = buildOpenWeatherRadarUrl(
      apiKey,
      timestamp,
      zoom,
      x,
      y,
    );
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "image/png,image/*;q=0.9" },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      console.error(
        `OpenWeather radar respondeu com status ${upstream.status} para z${zoom}/${x}/${y}`,
      );
      return errorResponse("Tile meteorológico temporariamente indisponível", 502);
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    const image = await upstream.arrayBuffer();

    return new Response(image, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Falha ao carregar tile do radar OpenWeather:", error);
    return errorResponse("Não foi possível carregar o tile meteorológico", 504);
  }
}
