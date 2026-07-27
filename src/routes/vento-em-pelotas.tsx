import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { WindForecastPageV2 } from "@/components/weather/WindForecastPageV2";
import { WIND_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Vento em Pelotas";
const PAGE_DESCRIPTION =
  "Veja o vento em Pelotas com velocidade e direção atuais, rajadas previstas por horário e para os próximos 7 dias, além de avisos oficiais.";
const PAGE_PATH = "/vento-em-pelotas";

const WIND_PAGE_CONTENT = {
  ...WIND_EDITORIAL_CONTENT,
  eyebrow: "Entenda os dados de vento",
  title: "Como ler velocidade, direção e rajadas em Pelotas",
  answer:
    "A velocidade atual indica a intensidade do vento no momento da leitura e pode vir de uma estação ou de uma estimativa do modelo. A direção mostra de onde ele sopra. A rajada é um pico breve e mais forte; quando está em horário ou dia futuro, é uma previsão.",
  facts: [
    "Velocidade atual e rajada máxima não representam a mesma medida: a rajada é um pico de curta duração.",
    "A direção informa de onde o vento vem. Vento sul, por exemplo, sopra do sul em direção ao norte.",
    "Antes de atividades ao ar livre ou na Lagoa dos Patos, confira as rajadas por horário e os avisos oficiais.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre velocidade do vento e rajada?",
      answer:
        "A velocidade representa o vento médio ou instantâneo informado pela fonte. A rajada é um aumento breve e mais intenso, por isso costuma apresentar valor superior.",
    },
    {
      question: "O que significa a direção do vento?",
      answer:
        "A direção indica de onde o vento sopra. Quando a página mostra sul, por exemplo, significa que o vento vem do sul e segue em direção ao norte.",
    },
    {
      question: "O vento mostrado agora foi medido?",
      answer:
        "A página identifica quando o valor atual foi observado pela estação da Embrapa. Se a medição local estiver indisponível, o portal informa que o valor atual foi estimado pelo modelo.",
    },
    {
      question: "Quando as rajadas exigem mais atenção?",
      answer:
        "Rajadas mais fortes podem afetar objetos soltos, árvores, estruturas leves, navegação e atividades ao ar livre. Em caso de aviso oficial, siga as orientações do órgão emissor.",
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
      label: "Avisos oficiais do INMET",
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
          "Previsão de vento em Pelotas",
          "Rajadas de vento em Pelotas",
          "Direção do vento em Pelotas",
          "Vento por hora em Pelotas",
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
      <WindForecastPageV2 data={weather} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-de-vento"
        content={WIND_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
