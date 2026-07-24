import { CANONICAL_SITE_URL } from "./site-config";

const CANONICAL_HOSTNAME = new URL(CANONICAL_SITE_URL).hostname;
const LEGACY_HOSTNAME = ["mobitempopelotas", "lovable", "app"].join(".");

export function getCanonicalRedirectUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  const hostname = url.hostname.toLowerCase();
  const isCanonicalHost = hostname === CANONICAL_HOSTNAME;
  const shouldRedirect =
    hostname === LEGACY_HOSTNAME ||
    hostname === `www.${CANONICAL_HOSTNAME}` ||
    (isCanonicalHost && url.protocol !== "https:");

  if (!shouldRedirect) return null;

  url.protocol = "https:";
  url.hostname = CANONICAL_HOSTNAME;
  url.port = "";
  return url.toString();
}

export function createCanonicalRedirectResponse(request: Request) {
  const location = getCanonicalRedirectUrl(request.url);
  if (!location) return null;

  return new Response(null, {
    status: 308,
    headers: {
      Location: location,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
