export const CANONICAL_SITE_URL = "https://tempopelotas.com.br";
export const SITE_URL = CANONICAL_SITE_URL;

export const SITE_NAME = "Tempo Pelotas";
export const SITE_TITLE = "Tempo Pelotas | Previsão do tempo em Pelotas e região";
export const SITE_DESCRIPTION =
  "Previsão do tempo, condições atuais, chuva, vento e informações meteorológicas de Pelotas e da Zona Sul do Rio Grande do Sul.";

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export const WEBSITE_JSON_LD_ID = absoluteUrl("/#website");
export const SOCIAL_IMAGE_URL = absoluteUrl("/brand/tempo-pelotas-primary.svg");

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_JSON_LD_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "pt-BR",
  };
}
