import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { RadarForecastContext } from "@/components/redemet/RadarForecastContext";
import { RedemetOverview } from "@/components/redemet/RedemetOverview";
import { RADAR_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Radar meteorológico e satélite em Pelotas";
const PAGE_DESCRIPTION =
  "Veja radar meteorológico, imagens de satélite e trovoadas na região de Pelotas, com sequência animada, horário de cada quadro, comparação com a previsão e fontes da REDEMET/DECEA e do INMET.";
const PAGE_PATH = "/radar-e-satelite-pelotas";

const RADAR_PAGE_CONTENT = {
  ...RADAR_EDITORIAL_CONTENT,
  eyebrow: "Entenda e compare as imagens",
  title: "Como usar radar, satélite e trovoadas para acompanhar o tempo em Pelotas",
  answer:
    "Confira primeiro o horário de cada quadro e depois reproduza a sequência. O radar mostra ecos associados à precipitação; o satélite mostra cobertura e organização das nuvens; e a camada de trovoadas registra atividade elétrica detectada. A comparação horária usa uma previsão do modelo, enquanto o movimento nas imagens é observação do passado recente, não previsão do futuro.",
  facts: [
    "Reproduzir a sequência ajuda a perceber deslocamento e mudança, mas não garante que o mesmo movimento continuará.",
    "O radar oferece leitura regional e não confirma sozinho chuva em um endereço ou bairro específico.",
    "Nuvens no satélite não significam necessariamente precipitação no solo em Pelotas.",
    "Trovoada detectada é uma observação de atividade elétrica, não um aviso oficial de risco.",
    "Cada fonte tem horário próprio; compare produtos que representem períodos próximos.",
    "Os valores meteorológicos exibidos junto ao radar pertencem à previsão mais próxima daquele horário e não são medidos pela imagem.",
  ],
  faqs: [
    {
      question: "Como usar a reprodução automática dos quadros?",
      answer:
        "Selecione Reproduzir sequência para avançar pelos quadros disponíveis. Pause para examinar uma imagem, use a linha do tempo para escolher outro horário ou retorne ao Quadro mais recente. A sequência mostra observações passadas e recentes, não uma projeção futura.",
    },
    {
      question: "O radar mostra se está chovendo exatamente no meu bairro?",
      answer:
        "Não com precisão absoluta. O radar oferece uma leitura regional e pode sofrer limitações de distância, resolução, altura do feixe e intensidade da precipitação. Confirme com observação local, previsão por horário e avisos oficiais.",
    },
    {
      question: "Nuvens no satélite significam chuva em Pelotas?",
      answer:
        "Não necessariamente. O satélite mostra cobertura e características das nuvens. Para avaliar chuva, compare a imagem com radar, previsão, horário do quadro e observações próximas.",
    },
    {
      question: "Uma ocorrência de trovoada é um alerta meteorológico?",
      answer:
        "Não. Ela indica atividade elétrica detectada em uma área e horário. Alertas oficiais são emitidos por órgãos responsáveis com critérios próprios de risco, abrangência e validade.",
    },
    {
      question: "Por que duas fontes podem mostrar horários diferentes?",
      answer:
        "Radar, satélite e trovoadas possuem produtos, rotinas e intervalos de atualização próprios. Por isso, compare o horário exibido em cada card e evite interpretar imagens de momentos muito diferentes como se fossem simultâneas.",
    },
    {
      question: "Os valores ao lado do radar foram medidos pela imagem?",
      answer:
        "Não. Temperatura, chance de chuva, vento, nuvens baixas e visibilidade vêm da hora válida mais próxima da grade de previsão. O quadro do radar continua sendo uma observação independente da REDEMET/DECEA.",
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
      description: "Consulte severidade, abrangência, validade e orientações dos avisos para Pelotas.",
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
          "Radar meteorológico de Canguçu",
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
      <RadarForecastContext radar={data.redemet.radar} weather={data.weather} />
      <EditorialContentSection
        id="como-interpretar-radar-satelite"
        content={RADAR_PAGE_CONTENT}
      />
    </div>
  );
}