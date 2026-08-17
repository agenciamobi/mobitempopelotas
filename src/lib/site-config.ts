export const CANONICAL_SITE_URL = "https://tempopelotas.com.br";
export const SITE_URL = CANONICAL_SITE_URL;

export const SITE_NAME = "Tempo Pelotas";
export const SITE_TITLE = "Tempo Pelotas | Previsão do tempo em Pelotas e região";
export const SITE_DESCRIPTION =
  "Previsão do tempo, condições atuais, chuva, vento e informações meteorológicas de Pelotas e da Zona Sul do Rio Grande do Sul.";

export const PELOTAS_LATITUDE = -31.7654;
export const PELOTAS_LONGITUDE = -52.3376;

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export const ORGANIZATION_JSON_LD_ID = absoluteUrl("/#organization");
export const WEBSITE_JSON_LD_ID = absoluteUrl("/#website");
export const BRAND_LOGO_URL = absoluteUrl("/brand/tempo-pelotas-primary.svg");
export const SOCIAL_IMAGE_URL = absoluteUrl("/brand/tempo-pelotas-social.png");

export function createPelotasPlaceJsonLd() {
  return {
    "@type": "Place",
    name: "Pelotas, Rio Grande do Sul, Brasil",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pelotas",
      addressRegion: "RS",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: PELOTAS_LATITUDE,
      longitude: PELOTAS_LONGITUDE,
    },
  };
}

export function createWebsiteJsonLd() {
  const pelotas = createPelotasPlaceJsonLd();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_JSON_LD_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: BRAND_LOGO_URL,
        },
        areaServed: pelotas,
        knowsAbout: [
          "Meteorologia em Pelotas",
          "Previsão do tempo",
          "Chuva e vento",
          "Alertas meteorológicos",
          "Lagoa dos Patos",
        ],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_JSON_LD_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "pt-BR",
        publisher: { "@id": ORGANIZATION_JSON_LD_ID },
        spatialCoverage: pelotas,
        about: [
          { "@type": "Thing", name: "Meteorologia" },
          { "@type": "Thing", name: "Tempo em Pelotas" },
          { "@type": "Thing", name: "Monitoramento hidrológico regional" },
        ],
      },
    ],
  };
}
