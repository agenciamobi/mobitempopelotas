import { CANONICAL_SITE_URL } from "./site-config.ts";

const CANONICAL_HOSTNAME = new URL(CANONICAL_SITE_URL).hostname;
const TECHNICAL_HOST_SUFFIXES = [
  ["lovable", "app"].join("."),
  ["vercel", "app"].join("."),
];

function isTechnicalHost(hostname: string) {
  return TECHNICAL_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

export function getCanonicalRedirectUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  const hostname = url.hostname.toLowerCase();
  const isCanonicalHost = hostname === CANONICAL_HOSTNAME;
  const shouldRedirect =
    isTechnicalHost(hostname) ||
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
