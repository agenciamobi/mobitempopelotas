import { createFileRoute } from "@tanstack/react-router";

const ICON_BASE64 = "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";
const ICON_BYTES = Uint8Array.from(Buffer.from(ICON_BASE64, "base64"));

export const Route = createFileRoute("/brand/tempo-pelotas-maskable.png")({
  server: {
    handlers: {
      GET: () =>
        new Response(ICON_BYTES, {
          headers: {
            "Cache-Control": "public, max-age=31536000, immutable",
            "CDN-Cache-Control": "max-age=31536000, immutable",
            "Content-Type": "image/png",
            "Content-Length": String(ICON_BYTES.byteLength),
            "X-Content-Type-Options": "nosniff",
          },
        }),
    },
  },
});
