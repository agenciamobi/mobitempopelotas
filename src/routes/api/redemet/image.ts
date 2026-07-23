import { createFileRoute } from "@tanstack/react-router";

import { isAllowedRedemetImageUrl } from "@/lib/redemet/redemet.server";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const Route = createFileRoute("/api/redemet/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const source = new URL(request.url).searchParams.get("src")?.trim();

        if (!source || !isAllowedRedemetImageUrl(source)) {
          return errorResponse("Imagem REDEMET inválida.", 400);
        }

        try {
          const response = await fetch(source, {
            headers: {
              Accept: "image/png,image/webp,image/jpeg,image/gif;q=0.8",
              "User-Agent": "TempoPelotas/1.0 (+https://tempopelotas.com.br)",
            },
            signal: AbortSignal.timeout(12_000),
          });
          const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
          const declaredLength = Number(response.headers.get("content-length") ?? 0);

          if (!response.ok || !ALLOWED_CONTENT_TYPES.has(contentType)) {
            return errorResponse("Imagem REDEMET temporariamente indisponível.", 502);
          }

          if (!isAllowedRedemetImageUrl(response.url)) {
            return errorResponse("Redirecionamento de imagem não autorizado.", 502);
          }

          if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem REDEMET excede o limite permitido.", 413);
          }

          const image = await response.arrayBuffer();
          if (image.byteLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem REDEMET excede o limite permitido.", 413);
          }

          return new Response(image, {
            status: 200,
            headers: {
              "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
              "CDN-Cache-Control": "max-age=900, stale-while-revalidate=1800",
              "Content-Length": String(image.byteLength),
              "Content-Type": contentType,
              "X-Content-Type-Options": "nosniff",
              "X-Robots-Tag": "noindex, nofollow",
            },
          });
        } catch (error) {
          console.error("[redemet/image] Entrega indisponível", {
            message: error instanceof Error ? error.message : "Falha desconhecida",
          });
          return errorResponse("Imagem REDEMET temporariamente indisponível.", 502);
        }
      },
    },
  },
});
