import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 300;

export async function GET() {
  const weather = await getPelotasWeather();

  return Response.json(weather, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}