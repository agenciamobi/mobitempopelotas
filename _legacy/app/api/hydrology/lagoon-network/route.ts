import { NextResponse } from "next/server";
import { getLagoonMonitoringNetwork } from "@/lib/lagoon-monitoring-network";

export const revalidate = 300;

export async function GET() {
  const network = await getLagoonMonitoringNetwork();

  return NextResponse.json(network, {
    status: network.status === "unavailable" ? 503 : 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control":
        "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
