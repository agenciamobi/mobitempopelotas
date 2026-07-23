const DEFAULT_SITE_URL = "https://tempopelotas.com.br";

export const SITE_NAME = "Tempo Pelotas";
export const SITE_TITLE = "Tempo Pelotas | Previsão do tempo em Pelotas e região";
export const SITE_DESCRIPTION =
  "Previsão do tempo, condições atuais, chuva, vento e informações meteorológicas de Pelotas e da Zona Sul do Rio Grande do Sul.";

function normalizeSiteUrl(value: string | undefined) {
  const candidate = value?.trim() || DEFAULT_SITE_URL;
  return candidate.replace(/\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export const SOCIAL_IMAGE_URL =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3f08c889-e910-4b95-8e86-5c37fa31c1c8/id-preview-9ab27e4f--d63df7b2-45db-4890-823c-87629dab73a1.lovable.app-1784525496143.png";

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "pt-BR",
  };
}
