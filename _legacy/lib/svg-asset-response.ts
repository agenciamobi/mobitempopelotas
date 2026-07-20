import { gunzipSync } from "node:zlib";

export function createSvgAssetResponse(encodedGzip: string) {
  const svg = new Uint8Array(gunzipSync(Buffer.from(encodedGzip, "base64")));

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
