import {
  PELOTAS_LATITUDE,
  PELOTAS_LONGITUDE,
  SITE_NAME,
  SOCIAL_IMAGE_URL,
  absoluteUrl,
} from "./site-config";
import { createStructuredDataScripts } from "./structured-data";

export function createPageHead(
  title: string,
  description: string,
  canonicalPath: string,
  structuredData: readonly unknown[] = [],
) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const robots =
    "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "author", content: SITE_NAME },
      { name: "robots", content: robots },
      { name: "googlebot", content: robots },
      { name: "geo.region", content: "BR-RS" },
      { name: "geo.placename", content: "Pelotas" },
      {
        name: "geo.position",
        content: `${PELOTAS_LATITUDE};${PELOTAS_LONGITUDE}`,
      },
      {
        name: "ICBM",
        content: `${PELOTAS_LATITUDE}, ${PELOTAS_LONGITUDE}`,
      },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:url", content: canonicalUrl },
      { property: "og:image", content: SOCIAL_IMAGE_URL },
      { property: "og:image:alt", content: "Tempo Pelotas — meteorologia local" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:url", content: canonicalUrl },
      { name: "twitter:image", content: SOCIAL_IMAGE_URL },
      { name: "twitter:image:alt", content: "Tempo Pelotas — meteorologia local" },
    ],
    links: [
      { rel: "canonical", href: canonicalUrl },
      { rel: "alternate", hrefLang: "pt-BR", href: canonicalUrl },
      { rel: "alternate", hrefLang: "x-default", href: canonicalUrl },
    ],
    ...(structuredData.length > 0 ? { scripts: createStructuredDataScripts(structuredData) } : {}),
  };
}
