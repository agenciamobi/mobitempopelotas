import { getCppmetForecast } from "@/lib/cppmet-forecast";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET() {
  const data = await getCppmetForecast();

  return Response.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control":
        "public, max-age=60, s-maxage=600, stale-while-revalidate=1800",
      "X-Robots-Tag": "noindex",
    },
  });
}
