import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

function isStaticRequest(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/pwa-icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.includes(".")
  );
}

export async function proxy(request: NextRequest) {
  if (isStaticRequest(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/:path*"],
};
