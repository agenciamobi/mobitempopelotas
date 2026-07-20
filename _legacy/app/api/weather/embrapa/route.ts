import { NextResponse } from "next/server";
import { getEmbrapaObservation } from "@/lib/embrapa-observation";

export const revalidate = 300;

export async function GET() {
  const observation = await getEmbrapaObservation();

  return NextResponse.json(observation, {
    status: observation.status === "unavailable" ? 503 : 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
