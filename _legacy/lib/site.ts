const fallbackUrl = "http://localhost:5175";
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  vercelUrl ||
  fallbackUrl
).replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
