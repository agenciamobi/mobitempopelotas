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
  "Entenda o clima de Pelotas, as estações do ano, influência da Lagoa dos Patos, frio, calor, chuva, vento e a diferença entre climatologia e tempo recente.";
const PAGE_PATH = "/clima-em-pelotas";

const CLIMATE_CONTENT = {
  eyebrow: "Entenda o clima local",
  title: "Como interpretar clima, normais e histórico recente em Pelotas",
  answer:
    "Clima representa o comportamento de longo prazo da atmosfera e exige séries extensas, padronizadas e controladas. A previsão descreve os próximos horários ou dias; o histórico recente mostra apenas o período passado consultado. Por isso, os últimos 30 dias exibidos no portal não são apresentados como normal climatológica.",
  facts: [
    "As Normais Climatológicas do INMET são referências oficiais calculadas para períodos padronizados de muitos anos.",
    "Uma frente fria, uma onda de calor ou um mês chuvoso não definem isoladamente o clima de Pelotas.",
    "A Lagoa dos Patos, a proximidade do Atlântico, a umidade, o vento e as passagens de frentes ajudam a explicar variações locais.",
    "Verão, outono, inverno e primavera descrevem tendências sazonais, mas situações fora do padrão podem ocorrer em qualquer época.",
    "O histórico de 30 dias serve para verificar o que ocorreu recentemente, sem classificar o período como normal, seco, chuvoso, quente ou frio em relação à climatologia.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre tempo e clima?",
      answer:
        "Tempo descreve a condição atual e a evolução prevista para horas ou dias. Clima resume padrões, médias e variações observados durante períodos longos e tecnicamente padronizados.",
    },
    {
      question: "Os últimos 30 dias mostram o clima normal de Pelotas?",
      answer:
        "Não. Eles formam apenas um recorte recente. Uma normal climatológica exige décadas de observações, controle de qualidade e um período de referência definido.",
    },
    {
      question: "Por que o tempo muda rapidamente em Pelotas?",
      answer:
        "A cidade está exposta a passagens de frentes e massas de ar, além da influência de umidade e vento associados à Lagoa dos Patos e ao Atlântico. A combinação desses fatores pode produzir mudanças relevantes em poucas horas.",
    },
    {
      question: "Chove somente em uma estação do ano em Pelotas?",
      answer:
        "Não. A chuva pode ocorrer ao longo do ano, associada a frentes, sistemas de baixa pressão e instabilidade atmosférica. A frequência e a intensidade variam de um período para outro.",
    },
    {
      question: "Onde consultar as Normais Climatológicas oficiais?",
      answer:
        "O Instituto Nacional de Meteorologia disponibiliza as Normais Climatológicas do Brasil para períodos oficiais, incluindo 1991–2020. A página oferece acesso direto ao produto do INMET.",
    },
  ],
  relatedLinks: [
    {
      label: "Histórico climático recente",
      href: "/historico-climatico-pelotas" as const,
      description: "Compare máximas, mínimas, chuva e rajadas dos últimos 30 dias completos.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Consulte a condição atual e a previsão das próximas horas.",
    },
    {
      label: "Meteograma de Pelotas",
      href: "/meteograma-pelotas" as const,
      description: "Acompanhe temperatura, chuva, nuvens, visibilidade, pressão e vento hora a hora.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia" as const,
      description: "Veja a função, atualização e os limites de cada fonte usada pelo portal.",
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
