import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { OfficialDataAccessNotice } from "@/components/content/OfficialDataAccessNotice";
import { LaranjalEmbedGuide } from "@/components/embed/LaranjalEmbedGuide";
import { HydrologyEditorialHero } from "@/components/hydrology/HydrologyEditorialHero";
import "@/components/hydrology/HydrologyEditorialRefinements.css";
import "@/components/hydrology/HydrologyEditorialRoute.css";
import { LaranjalLevelPage } from "@/components/hydrology/HydrologyPages";
import "@/components/hydrology/HydrologyDetailHomeContract.css";
import { LARANJAL_LEVEL_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Nível da Lagoa dos Patos no Laranjal";
const PAGE_DESCRIPTION =
  "Acompanhe a medição da Estação Laranjal, a evolução do nível nas últimas 24 horas e informações sobre chuva e vento em Pelotas.";
const PAGE_PATH = "/nivel-da-lagoa-dos-patos-laranjal";

const LARANJAL_PAGE_CONTENT = {
  ...LARANJAL_LEVEL_EDITORIAL_CONTENT,
  eyebrow: "Como interpretar o nível no Laranjal",
  title: "Entenda o que a medição da Estação Laranjal representa",
  answer:
    "O número mostra o nível registrado no horário informado e na referência própria da Estação Laranjal. A evolução das últimas horas ajuda a acompanhar a mudança local, mas não confirma sozinha alagamento ou inundação.",
  facts: [
    "O Tempo Pelotas possui acesso autorizado à plataforma integrada da ANA para incorporar, de forma gradual, informações da Rede Hidrometeorológica Nacional ao acompanhamento regional.",
    "Dados da ANA/RHN só devem ser apresentados como leitura de uma estação depois de validar sua unidade, referência, horário e estado de atualização; valores de referências diferentes não são convertidos automaticamente para o Laranjal.",
    "A estação pode ficar sem nova medição ou sofrer interrupções; sempre confira o horário e o aviso de atualização.",
    "Uma mudança curta pode resultar de vento, oscilação local ou ruído. A sequência de medições é mais útil do que um único ponto.",
    "Em condição de risco, siga a Defesa Civil, as autoridades municipais e os comunicados oficiais.",
  ],
  faqs: [
    {
      question: "A medição exibida no Laranjal já vem da ANA/RHN?",
      answer:
        "Não necessariamente. A página identifica a fonte usada para cada leitura. O acesso à plataforma integrada da ANA/RHN está autorizado e a integração está em implantação, mas uma estação só entra como fonte pública depois de validarmos unidade, referência, horário e disponibilidade.",
    },
    {
      question: "O que representa o número exibido para o Laranjal?",
      answer:
        "Ele representa a medição da estação na referência usada pelo próprio equipamento. Não deve ser comparado diretamente com marcas físicas ou outras estações sem conhecer a referência de cada uma.",
    },
    {
      question: "Com que frequência o nível é atualizado?",
      answer:
        "A frequência depende da estação e da disponibilidade da transmissão. A página mostra o horário da última medição válida e avisa quando o dado está atrasado ou indisponível.",
    },
    {
      question: "Um valor alto confirma inundação no Laranjal?",
      answer:
        "Não por si só. O impacto depende da referência local, da evolução, do vento, da drenagem e das condições em cada trecho. Use os comunicados das autoridades para decisões de segurança.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Compare a medição local com outros pontos da Lagoa e do Guaíba.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas" as const,
      description: "Confira alertas vigentes de chuva, vento e tempestade.",
    },
    {
      label: "Câmeras do Laranjal",
      href: "/cameras-ao-vivo-pelotas" as const,
      description: "Use a imagem como complemento visual, sem substituir a medição da estação.",
    },
  ],
};

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos-laranjal")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas", path: "/situacao-hidrologica-pelotas" },
          { name: "Nível da Lagoa no Laranjal", path: PAGE_PATH },
        ],
        about: [
          "Nível da Lagoa dos Patos",
          "Estação Laranjal",
          "Praia do Laranjal",
          "Rede Hidrometeorológica Nacional",
          "Agência Nacional de Águas e Saneamento Básico",
          "Medição automática do nível em Pelotas",
          "Tendência do nível da água no Laranjal",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, LARANJAL_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, level] = await Promise.all([getWeatherIntelligence(), getLaranjalLevelData()]);
    return { weather, level };
  },
  staleTime: 60 * 1_000,
  component: NivelLagoaPage,
});

function NivelLagoaPage() {
  const data = Route.useLoaderData();

  return (
    <div className="hydrology-editorial-route">
      <HydrologyEditorialHero level={data.level} variant="detail" />
      <LaranjalLevelPage weather={data.weather} level={data.level} />
      <OfficialDataAccessNotice scope="hydrology" />
      <LaranjalEmbedGuide />
      <EditorialContentSection id="como-interpretar-nivel-laranjal" content={LARANJAL_PAGE_CONTENT} />
    </div>
  );
}
