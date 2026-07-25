import { createFileRoute } from "@tanstack/react-router";

import {
  buildInmetSatelliteFrameUrl,
  isValidInmetSatelliteToken,
} from "@/lib/weather/inmet-satellite.server";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
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

export const Route = createFileRoute("/api/inmet/satellite-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const search = new URL(request.url).searchParams;
        const date = search.get("date")?.trim() ?? "";
        const hour = search.get("hour")?.trim() ?? "";

        if (!isValidInmetSatelliteToken(date) || !isValidInmetSatelliteToken(hour)) {
          return errorResponse("Quadro de satélite do INMET inválido.", 400);
        }

        try {
          const response = await fetch(buildInmetSatelliteFrameUrl(date, hour), {
            headers: {
              Accept: "image/png,image/webp,image/jpeg,image/gif;q=0.8",
              "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
            },
            signal: AbortSignal.timeout(10_000),
          });
          const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
          const declaredLength = Number(response.headers.get("content-length") ?? 0);

          if (!response.ok || !ALLOWED_CONTENT_TYPES.has(contentType)) {
            return errorResponse("Imagem de satélite do INMET temporariamente indisponível.", 502);
          }
          if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem de satélite excede o limite permitido.", 413);
          }

          const image = await response.arrayBuffer();
          if (image.byteLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem de satélite excede o limite permitido.", 413);
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
          console.error("[inmet/satellite-image] Entrega indisponível", {
            message: error instanceof Error ? error.message : "Falha desconhecida",
          });
          return errorResponse("Imagem de satélite do INMET temporariamente indisponível.", 502);
        }
      },
    },
  },
});
