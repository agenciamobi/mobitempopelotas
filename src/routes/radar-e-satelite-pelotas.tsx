import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { OfficialDataAccessNotice } from "@/components/content/OfficialDataAccessNotice";
import { RadarForecastContext } from "@/components/redemet/RadarForecastContext";
import { RedemetOverview } from "@/components/redemet/RedemetOverview";
import { RADAR_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Radar e satélite em Pelotas";
const PAGE_DESCRIPTION =
  "Veja áreas de chuva, imagens de satélite e trovoadas na região de Pelotas, com horário, sequência de imagens e comparação com a previsão por hora.";
const PAGE_PATH = "/radar-e-satelite-pelotas";

const RADAR_PAGE_CONTENT = {
  ...RADAR_EDITORIAL_CONTENT,
  eyebrow: "Como interpretar as imagens",
  title: "Acompanhe chuva, nuvens e trovoadas na região de Pelotas",
  answer:
    "Confira o horário de cada imagem e depois reproduza a sequência. O radar ajuda a localizar áreas associadas à chuva; o satélite mostra a cobertura e a organização das nuvens; e os registros de trovoadas indicam atividade elétrica detectada. Os valores exibidos ao lado pertencem à previsão por hora mais próxima, enquanto as imagens mostram o passado recente.",
  facts: [
    "Os produtos de radar, satélite e STSC são coletados por integração server-side com acesso autorizado à API da REDEMET/DECEA; a origem e o horário permanecem identificados no portal.",
    "Reproduzir a sequência ajuda a perceber deslocamento e mudança, mas não garante que o mesmo movimento continuará.",
    "O radar oferece uma visão regional e não confirma sozinho chuva em um endereço ou bairro específico.",
    "Quando uma estação de radar não fornece imagem recente, o portal pode usar outra estação oficial cuja cobertura inclua Pelotas; a origem e o horário do quadro permanecem identificados.",
    "Nuvens no satélite não significam necessariamente chuva no solo em Pelotas.",
    "Trovoada detectada indica atividade elétrica e não substitui um aviso oficial de risco.",
    "Cada imagem pode ter um horário diferente; compare registros feitos em momentos próximos.",
    "Temperatura, chance de chuva, vento, nuvens baixas e visibilidade são valores previstos e não são medidos pela imagem.",
  ],
  faqs: [
    {
      question: "Como o Tempo Pelotas recebe os dados da REDEMET?",
      answer:
        "O portal possui acesso autorizado à API da REDEMET/DECEA e consulta os produtos oficiais por conexão entre sistemas no servidor. A credencial não é enviada ao navegador, e cada quadro mantém a identificação da fonte e do horário recebido.",
    },
    {
      question: "Como usar a reprodução automática das imagens?",
      answer:
        "Selecione Reproduzir sequência para avançar pelas imagens disponíveis. Pause para examinar uma imagem, use a linha do tempo para escolher outro horário ou retorne à imagem mais recente. A sequência mostra registros passados e recentes, não uma projeção futura.",
    },
    {
      question: "O radar mostra se está chovendo exatamente no meu bairro?",
      answer:
        "Não com precisão absoluta. O radar oferece uma visão regional e pode ter limitações de distância, resolução, altura do feixe e intensidade da chuva. Confirme com observação local, previsão por horário e avisos oficiais.",
    },
    {
      question: "Nuvens no satélite significam chuva em Pelotas?",
      answer:
        "Não necessariamente. O satélite mostra cobertura e características das nuvens. Para avaliar chuva, compare a imagem com radar, previsão, horário e observações próximas.",
    },
    {
      question: "Uma ocorrência de trovoada é um alerta meteorológico?",
      answer:
        "Não. Ela indica atividade elétrica detectada em uma área e horário. Alertas oficiais são emitidos por órgãos responsáveis com critérios próprios de risco, abrangência e validade.",
    },
    {
      question: "Por que as imagens podem mostrar horários diferentes?",
      answer:
        "Radar, satélite e trovoadas são atualizados em intervalos próprios. Por isso, confira o horário mostrado em cada bloco e evite comparar imagens de momentos muito diferentes como se fossem simultâneas.",
    },
    {
      question: "Os valores ao lado do radar foram medidos pela imagem?",
      answer:
        "Não. Temperatura, chance de chuva, vento, nuvens baixas e visibilidade vêm da previsão por hora mais próxima. A imagem do radar permanece uma observação independente da REDEMET/DECEA.",
    },
  ],
  relatedLinks: [
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Compare as imagens com chance e volume de chuva previstos por horário.",
    },
    {
      label: "Avisos oficiais do INMET",
      href: "/alertas" as const,
      description: "Consulte abrangência, validade e orientações dos avisos para Pelotas.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja temperatura, chuva, vento, ponto de orvalho, nuvens e visibilidade.",
    },
  ],
};

export const Route = createFileRoute("/radar-e-satelite-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Radar e satélite em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Radar meteorológico de Santiago com cobertura sobre Pelotas",
          "Seleção operacional de estação REDEMET conforme disponibilidade e cobertura",
          "API autorizada da REDEMET/DECEA",
          "Imagens de satélite sobre Pelotas",
          "Monitoramento regional de trovoadas",
          "Precipitação na Zona Sul do Rio Grande do Sul",
          "REDEMET e INMET",
          "Horário das imagens meteorológicas",
          "Sequência de imagens de radar",
          "Comparação entre radar e previsão horária",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, RADAR_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [redemet, weather] = await Promise.all([
      getRedemetOverview(),
      getWeatherIntelligence(),
    ]);
    return { redemet, weather };
  },
  staleTime: 60 * 1_000,
  component: RedemetPage,
});

function RedemetPage() {
  const data = Route.useLoaderData();

  return (
    <div className="radar-satellite-page">
      <RedemetOverview data={data.redemet} />
      <OfficialDataAccessNotice scope="meteorology" />
      <RadarForecastContext radar={data.redemet.radar} weather={data.weather} />
      <EditorialContentSection
        id="como-interpretar-radar-satelite"
        content={RADAR_PAGE_CONTENT}
      />
    </div>
  );
}
