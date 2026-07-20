import { NextResponse } from "next/server";
import { getPelotasWeatherHistory } from "@/lib/weather-history-service";

export const revalidate = 21600;

export async function GET() {
  const history = await getPelotasWeatherHistory();

  return NextResponse.json(history, {
    headers: {
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
