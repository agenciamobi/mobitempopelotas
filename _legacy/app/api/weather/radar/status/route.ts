import { NextResponse } from "next/server";
import {
  buildOpenWeatherRadarUrl,
  buildRadarFrames,
  type RadarStatus,
} from "@/lib/weather-radar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PELOTAS_RADAR_TILE = {
  zoom: 7,
  x: 45,
  y: 75,
} as const;

function jsonResponse(status: RadarStatus) {
  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
    },
  });
}

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
  const { frames, currentIndex, currentTimestamp } = buildRadarFrames();
  const updatedAt = new Date(currentTimestamp * 1000).toISOString();

  if (!apiKey) {
    return jsonResponse({
      configured: false,
      available: false,
      provider: "OpenWeather",
      product: "Global Precipitation Map Forecast",
      frames,
      currentIndex,
      updatedAt,
      error: "Radar de precipitação em ativação.",
    });
  }

  try {
    const validationUrl = buildOpenWeatherRadarUrl(
      apiKey,
      currentTimestamp,
      PELOTAS_RADAR_TILE.zoom,
      PELOTAS_RADAR_TILE.x,
      PELOTAS_RADAR_TILE.y,
    );
    const response = await fetch(validationUrl, {
      headers: { Accept: "image/png,image/*;q=0.9" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      console.error(
        `Validação do radar OpenWeather respondeu com status ${response.status}`,
      );

      return jsonResponse({
        configured: true,
        available: false,
        provider: "OpenWeather",
        product: "Global Precipitation Map Forecast",
        frames,
        currentIndex,
        updatedAt,
        error: "Radar temporariamente indisponível.",
      });
    }

    return jsonResponse({
      configured: true,
      available: true,
      provider: "OpenWeather",
      product: "Global Precipitation Map Forecast",
      frames,
      currentIndex,
      updatedAt,
      error: null,
    });
  } catch (error) {
    console.error("Falha ao validar o radar OpenWeather:", error);

    return jsonResponse({
      configured: true,
      available: false,
      provider: "OpenWeather",
      product: "Global Precipitation Map Forecast",
      frames,
      currentIndex,
      updatedAt,
      error: "Radar temporariamente indisponível.",
    });
  }
}
