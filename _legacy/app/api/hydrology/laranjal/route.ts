import { NextResponse } from "next/server";
import { getLaranjalLevelData } from "@/lib/laranjal-level";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const data = await getLaranjalLevelData();

  return NextResponse.json(data, {
    status: data.status === "unavailable" ? 503 : 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
