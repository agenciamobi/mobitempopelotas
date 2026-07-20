import { NextResponse } from "next/server";
import { getNivelGuaibaRegionalObservations } from "@/lib/nivel-guaiba-regional";

export const revalidate = 300;

export async function GET() {
  const observations = await getNivelGuaibaRegionalObservations();
  const available = observations.filter(
    (observation) =>
      observation.status !== "unavailable" && observation.currentLevel !== null,
  ).length;

  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      source: "Nível Guaíba",
      available,
      total: observations.length,
      observations,
    },
    {
      status: available > 0 ? 200 : 503,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control":
          "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
