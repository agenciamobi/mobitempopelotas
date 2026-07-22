import { NextRequest, NextResponse } from "next/server";
import { getRedemetSatellite } from "@/lib/redemet";
import { withRedemetLastGood } from "@/lib/redemet-last-good";
import type { RedemetSatelliteType } from "@/lib/redemet-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set<RedemetSatelliteType>(["realcada", "ir", "vis"]);

export async function GET(request: NextRequest) {
  const rawType = request.nextUrl.searchParams.get("type") ?? "realcada";
  const type = ALLOWED_TYPES.has(rawType as RedemetSatelliteType)
    ? (rawType as RedemetSatelliteType)
    : "realcada";
  const requested = Number(request.nextUrl.searchParams.get("frames") ?? 10);
  const payload = await withRedemetLastGood(
    `satellite:${type}:${requested}`,
    () => getRedemetSatellite(type, requested),
  );

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
