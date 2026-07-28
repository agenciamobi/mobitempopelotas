import { createFileRoute } from "@tanstack/react-router";

import { ClimatePelotasHero, ClimatePelotasPage } from "@/components/climate/ClimatePelotasPage";
import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getPelotasWeatherHistory } from "@/lib/weather/history.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Clima de Pelotas";
const PAGE_DESCRIPTION =
  "Entenda as estações do ano, a influência da Lagoa dos Patos e por que frio, calor, chuva e vento podem mudar rapidamente em Pelotas.";
const PAGE_PATH = "/clima-em-pelotas";

const CLIMATE_CONTENT = {
  eyebrow: "Entenda o clima local",
  title: "Por que o tempo varia tanto em Pelotas",
  answer:
    "Clima descreve o comportamento do tempo ao longo de muitos anos. A previsão mostra o que pode acontecer nas próximas horas ou dias, enquanto o histórico de 30 dias mostra apenas o que ocorreu recentemente. Por isso, um mês isolado não representa o clima normal da cidade.",
  facts: [
    "As Normais Climatológicas do INMET são referências oficiais calculadas com muitos anos de observações.",
    "Uma frente fria, uma onda de calor ou um mês chuvoso não definem sozinhos o clima de Pelotas.",
    "A Lagoa dos Patos, o Atlântico, a umidade, o vento e as passagens de frentes ajudam a explicar as mudanças locais.",
    "Verão, outono, inverno e primavera apresentam tendências diferentes, mas situações fora do padrão podem ocorrer em qualquer época.",
    "O histórico de 30 dias ajuda a entender o período recente, sem afirmar sozinho se ele foi normal, seco, chuvoso, quente ou frio.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre tempo e clima?",
      answer:
        "Tempo descreve a condição atual e a previsão para horas ou dias. Clima resume médias, padrões e variações observados durante muitos anos.",
    },
    {
      question: "Os últimos 30 dias mostram o clima normal de Pelotas?",
      answer:
        "Não. Eles mostram apenas um período recente. Uma normal climatológica exige décadas de observações, controle de qualidade e um período de referência definido.",
    },
    {
      question: "Por que o tempo muda rapidamente em Pelotas?",
      answer:
        "A cidade recebe frentes e massas de ar e também sofre influência da umidade e do vento associados à Lagoa dos Patos e ao Atlântico. A combinação desses fatores pode mudar o tempo em poucas horas.",
    },
    {
      question: "Chove somente em uma estação do ano em Pelotas?",
      answer:
        "Não. A chuva pode ocorrer ao longo do ano, ligada a frentes, áreas de baixa pressão e períodos de tempo instável. A frequência e a intensidade mudam de um período para outro.",
    },
    {
      question: "Onde consultar as Normais Climatológicas oficiais?",
      answer:
        "O Instituto Nacional de Meteorologia disponibiliza as Normais Climatológicas do Brasil para períodos oficiais, incluindo 1991–2020. A página oferece acesso direto às informações do INMET.",
    },
  ],
  relatedLinks: [
    {
      label: "Histórico de 30 dias",
      href: "/historico-climatico-pelotas" as const,
      description: "Compare máximas, mínimas, chuva e rajadas dos últimos dias.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Consulte a condição atual e a previsão das próximas horas.",
    },
    {
      label: "Previsão hora a hora",
      href: "/meteograma-pelotas" as const,
      description: "Acompanhe temperatura, chuva, nuvens, visibilidade, pressão e vento.",
    },
    {
      label: "Como os dados funcionam",
      href: "/metodologia" as const,
      description: "Veja de onde vêm os dados, quando atualizam e quais são seus limites.",
    },
  ],
};

export const Route = createFileRoute("/clima-em-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Clima de Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Clima de Pelotas",
          "Estações do ano em Pelotas",
          "Normais Climatológicas do INMET",
          "Climatologia de Pelotas",
          "Chuva ao longo do ano em Pelotas",
          "Frentes frias e massas de ar no sul do Rio Grande do Sul",
          "Influência da Lagoa dos Patos no tempo local",
          "Histórico meteorológico recente de Pelotas",
          "Diferença entre tempo e clima",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, CLIMATE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, history] = await Promise.all([
      getWeatherIntelligence(),
      getPelotasWeatherHistory(),
    ]);
    return { weather, history };
  },
  staleTime: 30 * 60 * 1_000,
  component: ClimaEmPelotasPage,
});

function ClimaEmPelotasPage() {
  const { weather, history } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--climate"
      showOfficialAlerts={false}
      hero={() => <ClimatePelotasHero history={history} />}
    >
      <ClimatePelotasPage history={history} />
      <EditorialContentSection id="como-interpretar-clima-pelotas" content={CLIMATE_CONTENT} />
    </InternalWeatherPageShell>
  );
}
