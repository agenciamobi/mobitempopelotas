import { NextResponse } from "next/server";
import { getWeatherCameras } from "@/lib/weather-cameras";

export const revalidate = 180;

export async function GET() {
  const cameras = await getWeatherCameras();
  const camera = cameras.find((item) => item.id === "laranjal");

  if (!camera) {
    return NextResponse.json(
      {
        status: "unavailable",
        available: false,
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      status: camera.status,
      available: camera.status === "online" && Boolean(camera.embedUrl),
      broadcastStatus: camera.broadcastStatus,
      title: camera.streamTitle,
      provider: camera.provider,
      publicUrl: camera.publicUrl,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=180, stale-while-revalidate=300",
      },
    },
  );
}
