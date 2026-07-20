import { NextResponse } from "next/server";
import { getInmetAlerts } from "@/lib/inmet-alerts";

export const revalidate = 900;

export async function GET() {
  const data = await getInmetAlerts();

  return NextResponse.json(data, {
    status: data.status === "live" ? 200 : 503,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      "X-Data-Source": "INMET",
      "X-Data-Status": data.status,
    },
  });
}
