import { NextRequest, NextResponse } from "next/server";
import { isAllowedRedemetImageUrl } from "@/lib/redemet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("src")?.trim();

  if (!source || !isAllowedRedemetImageUrl(source)) {
    return errorResponse("Imagem REDEMET inválida.", 400);
  }

  try {
    const response = await fetch(source, {
      headers: {
        Accept: "image/png,image/webp,image/jpeg,image/*;q=0.8",
        "User-Agent": "TempoPelotas/1.0 (+https://tempopelotas.com.br)",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(12_000),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const declaredLength = Number(response.headers.get("content-length") ?? 0);

    if (!response.ok || !contentType.startsWith("image/")) {
      return errorResponse("Imagem REDEMET temporariamente indisponível.", 502);
    }

    if (!isAllowedRedemetImageUrl(response.url)) {
      return errorResponse("Redirecionamento de imagem não autorizado.", 502);
    }

    if (declaredLength > MAX_IMAGE_BYTES) {
      return errorResponse("Imagem REDEMET excede o limite permitido.", 413);
    }

    const image = await response.arrayBuffer();
    if (image.byteLength > MAX_IMAGE_BYTES) {
      return errorResponse("Imagem REDEMET excede o limite permitido.", 413);
    }

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(image.byteLength),
        "Cache-Control":
          "public, max-age=300, s-maxage=900, stale-while-revalidate=1800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[redemet] Falha ao entregar imagem:", error);
    return errorResponse("Imagem REDEMET temporariamente indisponível.", 502);
  }
}
