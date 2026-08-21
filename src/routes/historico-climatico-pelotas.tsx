import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  WeatherHistoryHero,
  WeatherHistoryPage,
} from "@/components/history/WeatherHistoryPage";
import "@/components/history/WeatherHistoryHomeContract.css";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { HISTORY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getPelotasWeatherHistory } from "@/lib/weather/history.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Histórico de 30 dias em Pelotas";
const PAGE_DESCRIPTION =
  "Compare temperaturas máximas e mínimas, chuva, rajadas e variações dos últimos 30 dias completos em Pelotas.";
const PAGE_PATH = "/historico-climatico-pelotas";

const HISTORY_PAGE_CONTENT = {
  ...HISTORY_EDITORIAL_CONTENT,
  eyebrow: "Como interpretar o período",
  title: "O que os últimos 30 dias mostram sobre o tempo em Pelotas",
  answer:
    "A página reúne dias completos recentes para comparar temperatura, chuva e rajadas. Os resultados valem somente para o período indicado e para o local de referência usado pela fonte. Eles não representam o clima normal nem recordes históricos oficiais do município.",
  facts: [
    "A média das máximas e a média das mínimas usam apenas os dias que possuem esses valores.",
    "A chuva no período é a soma dos acumulados diários informados.",
    "Dias com chuva consideram pelo menos 1 mm; dias sem chuva informada usam acumulado abaixo de 0,1 mm.",
    "A variação diária de temperatura é a diferença entre a máxima e a mínima do mesmo dia.",
    "Informações ausentes continuam indisponíveis e não são substituídas por zero ou números demonstrativos.",
    "Trinta dias não permitem concluir sozinhos se o período foi normal, quente, frio, seco ou chuvoso em relação ao clima de Pelotas.",
  ],
  faqs: [
    {
      question: "Os dados representam medições da Estação Embrapa?",
      answer:
        "Não necessariamente. A página identifica a origem dos dados históricos e usa um local de referência para Pelotas. As medições da Estação Embrapa aparecem separadamente na página da estação.",
    },
    {
      question: "O dia mais quente é um recorde histórico de Pelotas?",
      answer:
        "Não. Ele é apenas o maior valor encontrado entre os dias consultados e nas informações usadas por esta página.",
    },
    {
      question: "Como é calculada a variação diária de temperatura?",
      answer:
        "Ela é a diferença entre a temperatura máxima e a mínima do mesmo dia. A página também mostra a média dessas diferenças no período.",
    },
    {
      question: "Por que alguns dias não têm chuva ou rajada informada?",
      answer:
        "A origem dos dados pode não publicar determinada informação em todos os dias. Quando isso ocorre, a página mantém o campo como indisponível em vez de completar com um valor estimado.",
    },
    {
      question: "Trinta dias são suficientes para definir o clima de Pelotas?",
      answer:
        "Não. O estudo do clima exige muitos anos de observações, períodos padronizados e controle de qualidade. Esta página mostra apenas o comportamento recente.",
    },
  ],
  relatedLinks: [
    {
      label: "Clima de Pelotas",
      href: "/clima-em-pelotas" as const,
      description: "Entenda as estações do ano e por que o tempo varia na cidade.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas" as const,
      description: "Consulte temperatura, umidade, vento e chuva medidos em Pelotas.",
    },
    {
      label: "Previsão de 7 dias",
      href: "/previsao-7-dias-pelotas" as const,
      description: "Compare os últimos dias com a previsão para a próxima semana.",
    },
    {
      label: "Como os dados funcionam",
      href: "/metodologia" as const,
      description: "Veja de onde vêm os dados, quando atualizam e quais são seus limites.",
    },
  ],
};

export const Route = createFileRoute("/historico-climatico-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Histórico de 30 dias", path: PAGE_PATH },
        ],
        about: [
          "Histórico meteorológico de Pelotas",
          "Temperaturas máximas e mínimas recentes",
          "Chuva acumulada nos últimos 30 dias",
          "Rajadas de vento recentes",
          "Amplitude térmica diária",
          "Disponibilidade dos dados meteorológicos",
          "Diferença entre histórico recente e climatologia",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, HISTORY_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, history] = await Promise.all([
      getWeatherIntelligence(),
      getPelotasWeatherHistory(),
    ]);
    return { weather, history };
  },
  staleTime: 6 * 60 * 60 * 1_000,
  component: HistoricoClimaticoPage,
});

function HistoricoClimaticoPage() {
  const { weather, history } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--history"
      showOfficialAlerts={false}
      hero={() => <WeatherHistoryHero history={history} />}
    >
      <WeatherHistoryPage history={history} />
      <EditorialContentSection
        id="como-interpretar-historico-recente"
        content={HISTORY_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
