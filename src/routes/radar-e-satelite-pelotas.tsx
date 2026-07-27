import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { RedemetOverview } from "@/components/redemet/RedemetOverview";
import { RADAR_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Radar e satélite em Pelotas";
const PAGE_DESCRIPTION =
  "Acompanhe radar meteorológico, imagens de satélite e trovoadas próximas de Pelotas, com horário de cada quadro e fontes da REDEMET/DECEA e do INMET.";
const PAGE_PATH = "/radar-e-satelite-pelotas";

const RADAR_PAGE_CONTENT = {
  ...RADAR_EDITORIAL_CONTENT,
  eyebrow: "Entenda as imagens meteorológicas",
  title: "Como interpretar radar, satélite e trovoadas em Pelotas",
  answer:
    "O radar mostra ecos associados à precipitação; o satélite mostra cobertura e características das nuvens; e a camada de trovoadas registra atividade elétrica detectada na região. Esses produtos devem ser comparados pelo horário e não substituem avisos oficiais ou observação local.",
  facts: [
    "O radar ajuda a acompanhar áreas associadas à chuva, mas não confirma sozinho que está chovendo exatamente no seu bairro.",
    "Uma nuvem visível no satélite não significa necessariamente chuva no solo em Pelotas.",
    "Trovoada detectada é uma observação regional de atividade elétrica, não um alerta meteorológico.",
    "Confira sempre o horário: uma imagem antiga pode não representar a condição deste momento.",
  ],
  faqs: [
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
      question: "Por que o horário da imagem é importante?",
      answer:
        "Radar, satélite e trovoadas representam um momento específico. Como nuvens e áreas de chuva podem se deslocar rapidamente, um quadro antigo pode não descrever a situação atual.",
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
      description: "Veja temperatura, chuva e vento previstos para as próximas horas.",
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
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, RADAR_PAGE_CONTENT.faqs),
    ]),
  loader: async () => getRedemetOverview(),
  staleTime: 60 * 1_000,
  component: RedemetPage,
});

function RedemetPage() {
  const data = Route.useLoaderData();

  return (
    <>
      <RedemetOverview data={data} />
      <EditorialContentSection
        id="como-interpretar-radar-satelite"
        content={RADAR_PAGE_CONTENT}
      />
    </>
  );
}
