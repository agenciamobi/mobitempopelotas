import { createFileRoute } from "@tanstack/react-router";

import { isAllowedRedemetImageUrl } from "@/lib/redemet/redemet.server";
import {
  buildInmetSatelliteFrameUrl,
  isValidInmetSatelliteToken,
} from "@/lib/weather/inmet-satellite.server";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

type ImageSource = {
  provider: "REDEMET" | "INMET";
  url: string;
};

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

function resolveImageSource(requestUrl: string): ImageSource | null {
  const search = new URL(requestUrl).searchParams;

  if (search.get("provider") === "inmet") {
    const date = search.get("date")?.trim() ?? "";
    const hour = search.get("hour")?.trim() ?? "";
    if (!isValidInmetSatelliteToken(date) || !isValidInmetSatelliteToken(hour)) return null;
    return { provider: "INMET", url: buildInmetSatelliteFrameUrl(date, hour) };
  }

  const source = search.get("src")?.trim();
  return source && isAllowedRedemetImageUrl(source)
    ? { provider: "REDEMET", url: source }
    : null;
}

export const Route = createFileRoute("/api/redemet/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const source = resolveImageSource(request.url);
        if (!source) return errorResponse("Imagem meteorológica inválida.", 400);

        try {
          const response = await fetch(source.url, {
            headers: {
              Accept: "image/png,image/webp,image/jpeg,image/gif;q=0.8",
              "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
            },
            redirect: source.provider === "INMET" ? "error" : "follow",
            signal: AbortSignal.timeout(12_000),
          });
          const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
          const declaredLength = Number(response.headers.get("content-length") ?? 0);

          if (!response.ok || !ALLOWED_CONTENT_TYPES.has(contentType)) {
            return errorResponse(`Imagem ${source.provider} temporariamente indisponível.`, 502);
          }

          if (source.provider === "REDEMET" && !isAllowedRedemetImageUrl(response.url)) {
            return errorResponse("Redirecionamento de imagem não autorizado.", 502);
          }

          if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem meteorológica excede o limite permitido.", 413);
          }

          const image = await response.arrayBuffer();
          if (image.byteLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem meteorológica excede o limite permitido.", 413);
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
          console.error("[weather/image] Entrega indisponível", {
            provider: source.provider,
            message: error instanceof Error ? error.message : "Falha desconhecida",
          });
          return errorResponse(`Imagem ${source.provider} temporariamente indisponível.`, 502);
        }
      },
    },
  },
});
