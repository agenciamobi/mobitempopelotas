import { NextResponse } from "next/server";
import { getPushConfigurationStatus } from "@/lib/web-push-service";

export const dynamic = "force-dynamic";

export function GET() {
  const status = getPushConfigurationStatus();

  return NextResponse.json(
    {
      enabled: status.enabled,
      publicKey: status.publicKey,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
