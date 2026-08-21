import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { WindDirectionContext } from "@/components/weather/WindDirectionContext";
import { WindForecastPageV3 } from "@/components/weather/WindForecastPageV3";
import "@/components/weather/WindForecastHomeContract.css";
import "@/components/weather/WindNavigationAvailability.css";
import { WIND_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getPelotasMeteogram } from "@/lib/weather/meteogram.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Vento em Pelotas";
const PAGE_DESCRIPTION =
  "Veja o vento agora, direção observada, direção prevista por hora, rajadas nas próximas 24 horas, horários mais fortes, previsão para 7 dias e avisos oficiais em Pelotas.";
const PAGE_PATH = "/vento-em-pelotas";

const WIND_PAGE_CONTENT = {
  ...WIND_EDITORIAL_CONTENT,
  eyebrow: "Entenda os dados de vento",
  title: "Como ler vento, direção e rajadas em Pelotas",
  answer:
    "O vento atual e sua direção são tratados como observação quando vêm da estação. As próximas horas são previsão de modelo. A página mantém essas duas leituras separadas e agora também mostra a direção prevista por horário no perfil detalhado do Open-Meteo.",
  facts: [
    "Vento e rajada não representam a mesma medida: a rajada é um aumento rápido e normalmente mais forte.",
    "A direção informa de onde o vento vem. Vento sul sopra do sul em direção ao norte.",
    "O vento atual e a direção observada podem ter origens diferentes, informadas na própria página.",
    "A direção prevista nas próximas horas vem do perfil horário do Open-Meteo e não é apresentada como medição da estação.",
    "O resumo do topo apenas organiza os valores previstos e não substitui alertas oficiais.",
    "Orla, áreas abertas, pontes e locais com árvores ou objetos soltos podem sentir vento diferente do ponto usado pela estação ou pelo modelo.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre vento e rajada?",
      answer:
        "O vento é a velocidade sustentada ou instantânea informada pela fonte. A rajada é um aumento breve e mais intenso, por isso costuma apresentar valor superior.",
    },
    {
      question: "O que significa a direção do vento?",
      answer:
        "A direção indica de onde o vento sopra. Quando a página mostra sul, significa que o vento vem do sul e segue em direção ao norte.",
    },
    {
      question: "O vento mostrado agora foi medido?",
      answer:
        "A página informa a origem específica do vento e da direção. Quando o dado vem da Estação Embrapa, ele é uma observação local; previsões de horários futuros aparecem separadamente como dados de modelo.",
    },
    {
      question: "A direção futura é uma medição da estação?",
      answer:
        "Não. A direção por horário é previsão do perfil detalhado do Open-Meteo. Ela é mantida separada da direção observada no momento atual e pode mudar conforme o modelo é atualizado.",
    },
    {
      question: "Por que a direção prevista pode mudar ao longo do dia?",
      answer:
        "Mudanças na circulação e na passagem de sistemas meteorológicos podem alterar a direção do vento. O perfil horário mostra a direção prevista em cada intervalo disponível, sem assumir que a direção atual permanecerá igual.",
    },
    {
      question: "O resumo de intensidade do topo é um alerta oficial?",
      answer:
        "Não. Ele apenas mostra a maior rajada prevista nas próximas 24 horas. Avisos oficiais vigentes e orientações dos órgãos emissores têm prioridade.",
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
          "Origem da velocidade e direção do vento",
          "Rajadas de vento em Pelotas",
          "Direção do vento em Pelotas",
          "Direção do vento por hora em Pelotas",
          "Previsão de vento por hora em Pelotas",
          "Maiores rajadas nas próximas 24 horas",
          "Previsão de rajadas para 7 dias",
          "Vento observado pela Embrapa em Pelotas",
          "Avisos oficiais de vento em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, WIND_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, meteogram] = await Promise.all([
      getWeatherIntelligence(),
      getPelotasMeteogram(),
    ]);
    return { weather, meteogram };
  },
  staleTime: 5 * 60 * 1_000,
  component: VentoPage,
});

function VentoPage() {
  const { weather, meteogram } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--wind"
      showOfficialAlerts={false}
    >
      <WindForecastPageV3 data={weather} />
      <WindDirectionContext meteogram={meteogram} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-de-vento"
        content={WIND_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
