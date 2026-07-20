import { createSvgAssetResponse } from "@/lib/svg-asset-response";
import { footerLogoChunk1 } from "./chunk-1";
import { footerLogoChunk2 } from "./chunk-2";
import { footerLogoChunk3 } from "./chunk-3";
import { footerLogoChunk4 } from "./chunk-4";
import { footerLogoChunk5 } from "./chunk-5";

const SVG_GZIP_BASE64 = [
  footerLogoChunk1,
  footerLogoChunk2,
  footerLogoChunk3,
  footerLogoChunk4,
  footerLogoChunk5,
].join("");

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  return createSvgAssetResponse(SVG_GZIP_BASE64);
}
