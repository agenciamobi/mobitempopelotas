import {
  PELOTAS_LATITUDE,
  PELOTAS_LONGITUDE,
  SITE_NAME,
  SOCIAL_IMAGE_URL,
  absoluteUrl,
} from "./site-config";
import { createStructuredDataScripts } from "./structured-data";

export type PageHeadGeo = {
  region?: string;
  placename: string;
  latitude: number;
  longitude: number;
};

export type PageHeadOptions = {
  geo?: PageHeadGeo | null;
};

const PELOTAS_GEO: PageHeadGeo = {
  region: "BR-RS",
  placename: "Pelotas",
  latitude: PELOTAS_LATITUDE,
  longitude: PELOTAS_LONGITUDE,
};

export function createPageHead(
  title: string,
  description: string,
  canonicalPath: string,
  structuredData: readonly unknown[] = [],
  options: PageHeadOptions = {},
) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const robots =
    "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const geo = options.geo === null ? null : (options.geo ?? PELOTAS_GEO);

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "author", content: SITE_NAME },
      { name: "robots", content: robots },
      { name: "googlebot", content: robots },
      ...(geo
        ? [
            { name: "geo.region", content: geo.region ?? "BR-RS" },
            { name: "geo.placename", content: geo.placename },
            {
              name: "geo.position",
              content: `${geo.latitude};${geo.longitude}`,
            },
            {
              name: "ICBM",
              content: `${geo.latitude}, ${geo.longitude}`,
            },
          ]
        : []),
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
