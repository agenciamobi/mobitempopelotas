import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { WindForecastPageV3 } from "@/components/weather/WindForecastPageV3";
import { WIND_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Vento em Pelotas";
const PAGE_DESCRIPTION =
  "Veja vento atual com procedência, direção, rajadas previstas por hora nas próximas 24 horas, maiores valores da janela, previsão para 7 dias e avisos oficiais em Pelotas.";
const PAGE_PATH = "/vento-em-pelotas";

const WIND_PAGE_CONTENT = {
  ...WIND_EDITORIAL_CONTENT,
  eyebrow: "Entenda os dados de vento",
  title: "Como ler velocidade, direção e rajadas em Pelotas",
  answer:
    "A velocidade atual, a direção e as rajadas futuras podem vir de fontes diferentes. O portal identifica a procedência de cada campo, trata rajada como um pico breve e não repete a direção atual como previsão para horários em que a fonte não publica direção.",
  facts: [
    "Velocidade sustentada e rajada não representam a mesma medida: a rajada é um pico breve e normalmente mais forte.",
    "A direção informa de onde o vento vem. Vento sul sopra do sul em direção ao norte.",
    "A condição atual é consolidada campo a campo; velocidade e direção podem ter procedências distintas.",
    "As próximas 24 horas exibem velocidade e rajada previstas por horário, sem inventar direção horária ausente.",
    "As faixas visuais da página são editoriais e não substituem alertas oficiais do INMET ou de outros órgãos competentes.",
    "Orla, áreas abertas, pontes e pontos com árvores ou objetos soltos podem ter exposição diferente do local representado pela estação ou pelo modelo.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre velocidade do vento e rajada?",
      answer:
        "A velocidade representa o vento sustentado ou instantâneo informado pela fonte. A rajada é um aumento breve e mais intenso, por isso costuma apresentar valor superior.",
    },
    {
      question: "O que significa a direção do vento?",
      answer:
        "A direção indica de onde o vento sopra. Quando a página mostra sul, significa que o vento vem do sul e segue em direção ao norte.",
    },
    {
      question: "O vento mostrado agora foi medido?",
      answer:
        "A página consulta a procedência específica da velocidade e da direção. Quando o campo vem da Estação Embrapa, ele é identificado como observação local; quando vem de um modelo, aparece como estimativa.",
    },
    {
      question: "Por que a direção não aparece em cada horário futuro?",
      answer:
        "A série horária atualmente integrada fornece velocidade e rajada, mas não direção por hora. O portal não reutiliza a direção atual como se ela permanecesse igual durante toda a previsão.",
    },
    {
      question: "As faixas de intensidade da página são alertas oficiais?",
      answer:
        "Não. Elas apenas ajudam a organizar visualmente os valores previstos. Avisos oficiais vigentes e orientações dos órgãos emissores têm prioridade.",
    },
    {
      question: "Quando as rajadas exigem mais atenção?",
      answer:
        "Rajadas mais fortes podem afetar objetos soltos, árvores, estruturas leves, navegação e atividades ao ar livre. Considere o local de exposição e consulte os avisos oficiais.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja a condição atual e a evolução de temperatura, chuva e vento por horário.",
    },
    {
      label: "Previsão de 7 dias",
      href: "/previsao-7-dias-pelotas" as const,
      description: "Compare temperatura, chuva e rajadas previstas para cada dia.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Observe sistemas meteorológicos associados a chuva, tempestade e mudanças de vento.",
    },
    {
      label: "Situação das águas",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Entenda como vento e chuva podem influenciar a distribuição da água na Lagoa dos Patos.",
    },
    {
      label: "Avisos oficiais",
      href: "/alertas" as const,
      description: "Consulte avisos relacionados a vento forte, tempestade e outros riscos meteorológicos.",
    },
  ],
};

export const Route = createFileRoute("/vento-em-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Vento em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Vento atual em Pelotas",
          "Procedência da velocidade e direção do vento",
          "Rajadas de vento em Pelotas",
          "Direção do vento em Pelotas",
          "Previsão de vento por hora em Pelotas",
          "Maiores rajadas nas próximas 24 horas",
          "Previsão de rajadas para 7 dias",
          "Vento observado pela Embrapa em Pelotas",
          "Avisos oficiais de vento em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, WIND_PAGE_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: VentoPage,
});

function VentoPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--wind"
      showOfficialAlerts={false}
    >
      <WindForecastPageV3 data={weather} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-de-vento"
        content={WIND_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
