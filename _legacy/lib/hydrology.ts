import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";

export type HydrologySourceStatus =
  | "active"
  | "official-reference"
  | "prepared"
  | "experimental";

export type HydrologyStation = {
  name: string;
  code: string;
  waterBody: string;
  city: string;
  role: string;
  officialUrl: string;
};

export type HydrologyDataSource = {
  id: string;
  name: string;
  organization: string;
  category: string;
  description: string;
  status: HydrologySourceStatus;
  statusLabel: string;
  url: string;
};

export const ANA_MONITORING_URL = "https://www.gov.br/ana/pt-br/monitoramento";
export const ANA_TELEMETRY_URL =
  "https://www.snirh.gov.br/hidrotelemetria/gerarGrafico.aspx";
export const SGB_SACE_URL = "https://www.sgb.gov.br/sace/";
export const CEMADEN_URL = "https://www.gov.br/cemaden/pt-br";
export const NOAA_STAR_URL = "https://www.star.nesdis.noaa.gov/star/index.php";
export const OPEN_METEO_URL = "https://open-meteo.com/";
export const EMBRAPA_AGROMET_URL =
  "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm";
export const GLOFAS_URL = "https://global-flood.emergency.copernicus.eu/";
export const NIVEL_GUAIBA_URL = "https://nivelguaiba.com.br/";
export const LAGOON_MONITORING_NETWORK_URL =
  "https://monitoramentolagoadospatos.com.br/";

export const HYDROLOGY_FLOW = [
  {
    title: "Rios que chegam ao Guaíba",
    description:
      "Jacuí, Taquari-Antas, Caí, Sinos, Gravataí e outros rios levam água para o Guaíba.",
  },
  {
    title: "Guaíba",
    description:
      "Parte dessa água segue para a Lagoa dos Patos e ajuda a entender o cenário regional.",
  },
  {
    title: "Outros rios e arroios",
    description:
      "Camaquã, Litoral Médio, Mirim–São Gonçalo e outros cursos de água também chegam à lagoa.",
  },
  {
    title: "Lagoa e Pelotas",
    description:
      "O nível no Laranjal também depende da chuva, do vento e da água que passa pelo Canal São Gonçalo.",
  },
  {
    title: "Saída para o oceano",
    description:
      "A água sai da lagoa pelo canal entre Rio Grande e São José do Norte.",
  },
] as const;

export const HYDROLOGY_STATIONS: HydrologyStation[] = [
  {
    name: "Cais Mauá C6",
    code: "87450004",
    waterBody: "Guaíba",
    city: "Porto Alegre / RS",
    role: "Ajuda a acompanhar uma das principais entradas de água da Lagoa dos Patos.",
    officialUrl: ANA_TELEMETRY_URL,
  },
  {
    name: "Laranjal",
    code: "87955000",
    waterBody: "Lagoa dos Patos",
    city: "Pelotas / RS",
    role: "Ponto oficial de acompanhamento do nível da lagoa na região de Pelotas.",
    officialUrl: ANA_TELEMETRY_URL,
  },
  {
    name: "Arambaré",
    code: "87540000",
    waterBody: "Lagoa dos Patos",
    city: "Arambaré / RS",
    role: "Mostra como o nível está se comportando em outra parte da Lagoa dos Patos.",
    officialUrl: ANA_TELEMETRY_URL,
  },
  {
    name: "São Lourenço",
    code: "87921000",
    waterBody: "Lagoa dos Patos",
    city: "São Lourenço do Sul / RS",
    role: "Ajuda a observar a mudança do nível entre o norte e o sul da lagoa.",
    officialUrl: ANA_TELEMETRY_URL,
  },
  {
    name: "Rio Grande / Regatas",
    code: "87980000",
    waterBody: "Lagoa dos Patos",
    city: "Rio Grande / RS",
    role: "Fica próximo da saída da lagoa para o oceano.",
    officialUrl: ANA_TELEMETRY_URL,
  },
];

export const HYDROLOGY_DATA_SOURCES: HydrologyDataSource[] = [
  {
    id: "labhidrosens",
    name: "Estação Laranjal",
    organization: "LabHidroSens / UFPel",
    category: "Nível da lagoa no Laranjal",
    description:
      "Mostra o nível medido na Praia do Laranjal e sua mudança ao longo do tempo.",
    status: "active",
    statusLabel: "Em uso",
    url: LAGOON_LEVEL_SOURCE.dashboardUrl,
  },
  {
    id: "lagoon-monitoring-network",
    name: "Rede de Monitoramento da Lagoa dos Patos",
    organization: "FURG & Portos RS",
    category: "Cotas em diferentes pontos da lagoa",
    description:
      "Publica cotas atuais, cotas locais de inundação e referências históricas em Rio Grande, São Lourenço do Sul, Arambaré, São José do Norte e Itapuã.",
    status: "active",
    statusLabel: "Em uso",
    url: LAGOON_MONITORING_NETWORK_URL,
  },
  {
    id: "nivel-guaiba",
    name: "Nível do Guaíba em Porto Alegre",
    organization: "Nível Guaíba",
    category: "Acompanhamento do Guaíba",
    description:
      "Mostra o nível atual, a mudança nas últimas horas e o histórico recente do Guaíba.",
    status: "active",
    statusLabel: "Em uso",
    url: NIVEL_GUAIBA_URL,
  },
  {
    id: "ana",
    name: "Rede Nacional de Medição das Águas",
    organization: "ANA",
    category: "Níveis dos rios e chuva",
    description:
      "Reúne medições oficiais feitas em rios, lagos e lagoas de todo o Brasil.",
    status: "official-reference",
    statusLabel: "Fonte oficial",
    url: ANA_MONITORING_URL,
  },
  {
    id: "sgb",
    name: "Acompanhamento de rios e cheias",
    organization: "Serviço Geológico do Brasil",
    category: "Níveis, boletins e avisos",
    description:
      "Publica níveis de rios, chuva, boletins e avisos para ajudar na prevenção de enchentes.",
    status: "official-reference",
    statusLabel: "Fonte oficial",
    url: SGB_SACE_URL,
  },
  {
    id: "open-meteo",
    name: "Previsão do tempo",
    organization: "Open-Meteo",
    category: "Temperatura, chuva e vento",
    description:
      "Reúne previsões de grandes serviços meteorológicos e entrega os valores usados pelo portal.",
    status: "active",
    statusLabel: "Em uso",
    url: OPEN_METEO_URL,
  },
  {
    id: "embrapa-agromet",
    name: "Estação da Sede da Embrapa",
    organization: "Embrapa Clima Temperado",
    category: "Medições do tempo em Pelotas",
    description:
      "Mede temperatura, umidade, pressão, vento e chuva em um ponto da cidade.",
    status: "active",
    statusLabel: "Em uso",
    url: EMBRAPA_AGROMET_URL,
  },
  {
    id: "cemaden",
    name: "Medidores de chuva",
    organization: "CEMADEN",
    category: "Chuva observada",
    description:
      "Poderá complementar o portal com medições de chuva feitas em diferentes locais.",
    status: "prepared",
    statusLabel: "Em preparação",
    url: CEMADEN_URL,
  },
  {
    id: "noaa-star",
    name: "Imagens do satélite GOES-19",
    organization: "NOAA / NESDIS STAR",
    category: "Imagens do céu e das nuvens",
    description:
      "Poderá mostrar a aproximação e a evolução de nuvens e tempestades.",
    status: "prepared",
    statusLabel: "Em preparação",
    url: NOAA_STAR_URL,
  },
  {
    id: "glofas",
    name: "Previsão experimental de cheias",
    organization: "Copernicus / ECMWF",
    category: "Antecipação de possíveis cheias",
    description:
      "Poderá ajudar a observar possíveis aumentos de água com antecedência, sempre como informação complementar.",
    status: "experimental",
    statusLabel: "Em estudo",
    url: GLOFAS_URL,
  },
];
