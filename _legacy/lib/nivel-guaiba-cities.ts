export type NivelGuaibaCity = {
  name: string;
  slug: string;
  url: string;
  jsonUrl: string;
  isPrimary?: boolean;
};

const NIVEL_GUAIBA_BASE_URL = "https://nivelguaiba.com.br";

function city(
  name: string,
  slug: string,
  options: { isPrimary?: boolean } = {},
): NivelGuaibaCity {
  return {
    name,
    slug,
    url: options.isPrimary
      ? `${NIVEL_GUAIBA_BASE_URL}/`
      : `${NIVEL_GUAIBA_BASE_URL}/${slug}`,
    jsonUrl: `${NIVEL_GUAIBA_BASE_URL}/${slug}.json`,
    ...options,
  };
}

export const NIVEL_GUAIBA_CITIES: NivelGuaibaCity[] = [
  city("Porto Alegre", "portoalegre", { isPrimary: true }),
  city("São Leopoldo", "saoleopoldo"),
  city("Lajeado", "lajeado"),
  city("Bom Retiro do Sul", "bomretirodosul"),
  city("Cachoeira do Sul", "cachoeiradosul"),
  city("Dona Francisca", "donafrancisca"),
  city("Encantado", "encantado"),
  city("Feliz", "feliz"),
  city("Gravataí", "gravatai"),
  city("Muçum", "mucum"),
  city("Rio Pardo", "riopardo"),
  city("São Sebastião do Caí", "saosebastiaodocai"),
  city("Taquara", "taquara"),
];

export { NIVEL_GUAIBA_BASE_URL };
