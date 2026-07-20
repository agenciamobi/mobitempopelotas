import { NextResponse } from "next/server";
import { getGuaibaObservation } from "@/lib/guaiba-monitor";

export const revalidate = 300;

export async function GET() {
  const observation = await getGuaibaObservation();

  return NextResponse.json(observation, {
    status: observation.status === "unavailable" ? 503 : 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
