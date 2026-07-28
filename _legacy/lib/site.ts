const canonicalUrl = "https://tempopelotas.com.br";
const localUrl = "http://localhost:5175";

export const siteUrl = (
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SITE_URL || localUrl
    : canonicalUrl
).replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
