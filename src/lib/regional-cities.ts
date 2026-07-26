export type RegionalCityGroup = "Pelotas e entorno" | "Costa Doce" | "Fronteira Sul" | "Campanha";

export type RegionalCity = {
  slug: string;
  name: string;
  state: "RS";
  ibgeCode: string;
  latitude: number;
  longitude: number;
  group: RegionalCityGroup;
  descriptor: string;
};

export const REGIONAL_CITIES: RegionalCity[] = [
  { slug: "pelotas-rs", name: "Pelotas", state: "RS", ibgeCode: "4314407", latitude: -31.7654, longitude: -52.3376, group: "Pelotas e entorno", descriptor: "principal centro urbano da Zona Sul do Rio Grande do Sul" },
  { slug: "capao-do-leao-rs", name: "Capão do Leão", state: "RS", ibgeCode: "4304663", latitude: -31.7565, longitude: -52.4889, group: "Pelotas e entorno", descriptor: "município vizinho a Pelotas e conectado à dinâmica meteorológica regional" },
  { slug: "cangucu-rs", name: "Canguçu", state: "RS", ibgeCode: "4304507", latitude: -31.395, longitude: -52.6756, group: "Pelotas e entorno", descriptor: "município da Serra do Sudeste com forte atividade rural" },
  { slug: "morro-redondo-rs", name: "Morro Redondo", state: "RS", ibgeCode: "4312450", latitude: -31.5887, longitude: -52.6265, group: "Pelotas e entorno", descriptor: "município serrano próximo a Pelotas" },
  { slug: "turucu-rs", name: "Turuçu", state: "RS", ibgeCode: "4322327", latitude: -31.4173, longitude: -52.1706, group: "Pelotas e entorno", descriptor: "município entre Pelotas e São Lourenço do Sul" },
  { slug: "arroio-do-padre-rs", name: "Arroio do Padre", state: "RS", ibgeCode: "4301073", latitude: -31.4389, longitude: -52.4247, group: "Pelotas e entorno", descriptor: "município rural da região de Pelotas" },
  { slug: "pedro-osorio-rs", name: "Pedro Osório", state: "RS", ibgeCode: "4314209", latitude: -31.8642, longitude: -52.8184, group: "Pelotas e entorno", descriptor: "município às margens do rio Piratini" },
  { slug: "cerrito-rs", name: "Cerrito", state: "RS", ibgeCode: "4305124", latitude: -31.8418, longitude: -52.8003, group: "Pelotas e entorno", descriptor: "município da Zona Sul próximo a Pedro Osório" },
  { slug: "piratini-rs", name: "Piratini", state: "RS", ibgeCode: "4314605", latitude: -31.4472, longitude: -53.1042, group: "Pelotas e entorno", descriptor: "município histórico da Serra do Sudeste" },
  { slug: "rio-grande-rs", name: "Rio Grande", state: "RS", ibgeCode: "4315602", latitude: -32.035, longitude: -52.0986, group: "Costa Doce", descriptor: "cidade portuária entre a Lagoa dos Patos e o oceano Atlântico" },
  { slug: "sao-jose-do-norte-rs", name: "São José do Norte", state: "RS", ibgeCode: "4318507", latitude: -32.0151, longitude: -52.0417, group: "Costa Doce", descriptor: "município costeiro na margem leste da Lagoa dos Patos" },
  { slug: "sao-lourenco-do-sul-rs", name: "São Lourenço do Sul", state: "RS", ibgeCode: "4318804", latitude: -31.365, longitude: -51.9787, group: "Costa Doce", descriptor: "cidade da Costa Doce às margens da Lagoa dos Patos" },
  { slug: "cristal-rs", name: "Cristal", state: "RS", ibgeCode: "4306056", latitude: -31.0046, longitude: -52.0504, group: "Costa Doce", descriptor: "município da Costa Doce junto ao rio Camaquã" },
  { slug: "jaguarao-rs", name: "Jaguarão", state: "RS", ibgeCode: "4311007", latitude: -32.5667, longitude: -53.3758, group: "Fronteira Sul", descriptor: "cidade de fronteira com o Uruguai" },
  { slug: "arroio-grande-rs", name: "Arroio Grande", state: "RS", ibgeCode: "4301305", latitude: -32.2376, longitude: -53.0862, group: "Fronteira Sul", descriptor: "município da planície costeira do extremo sul" },
  { slug: "herval-rs", name: "Herval", state: "RS", ibgeCode: "4307104", latitude: -32.0236, longitude: -53.3958, group: "Fronteira Sul", descriptor: "município rural da fronteira sul" },
  { slug: "santa-vitoria-do-palmar-rs", name: "Santa Vitória do Palmar", state: "RS", ibgeCode: "4317301", latitude: -33.5189, longitude: -53.3681, group: "Fronteira Sul", descriptor: "município do extremo sul entre lagoas e oceano" },
  { slug: "chui-rs", name: "Chuí", state: "RS", ibgeCode: "4305439", latitude: -33.6911, longitude: -53.4567, group: "Fronteira Sul", descriptor: "município mais ao sul do Brasil, na fronteira com o Uruguai" },
  { slug: "pinheiro-machado-rs", name: "Pinheiro Machado", state: "RS", ibgeCode: "4314506", latitude: -31.5783, longitude: -53.3811, group: "Campanha", descriptor: "município da Serra do Sudeste e da Campanha" },
  { slug: "pedras-altas-rs", name: "Pedras Altas", state: "RS", ibgeCode: "4314175", latitude: -31.7326, longitude: -53.5819, group: "Campanha", descriptor: "município da Campanha próximo à fronteira" },
  { slug: "bage-rs", name: "Bagé", state: "RS", ibgeCode: "4301602", latitude: -31.33, longitude: -54.1069, group: "Campanha", descriptor: "principal centro urbano da Campanha gaúcha" },
  { slug: "candiota-rs", name: "Candiota", state: "RS", ibgeCode: "4304358", latitude: -31.5583, longitude: -53.6725, group: "Campanha", descriptor: "município da Campanha com atividade energética e rural" },
  { slug: "acegua-rs", name: "Aceguá", state: "RS", ibgeCode: "4300034", latitude: -31.864, longitude: -54.1636, group: "Campanha", descriptor: "município de fronteira na Campanha" },
  { slug: "dom-pedrito-rs", name: "Dom Pedrito", state: "RS", ibgeCode: "4306601", latitude: -30.9828, longitude: -54.6734, group: "Campanha", descriptor: "município da Campanha com forte atividade agropecuária" },
];

export function findRegionalCity(slug: string) {
  return REGIONAL_CITIES.find((city) => city.slug === slug) ?? null;
}

export function regionalCityPath(city: RegionalCity) {
  return `/tempo-em/${city.slug}`;
}

export const REGIONAL_CITY_GROUPS = Array.from(
  REGIONAL_CITIES.reduce((groups, city) => {
    const items = groups.get(city.group) ?? [];
    items.push(city);
    groups.set(city.group, items);
    return groups;
  }, new Map<RegionalCityGroup, RegionalCity[]>()),
  ([name, cities]) => ({ name, cities }),
);
