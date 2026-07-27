import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  WeatherHistoryHero,
  WeatherHistoryPage,
} from "@/components/history/WeatherHistoryPage";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { HISTORY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getPelotasWeatherHistory } from "@/lib/weather/history.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Histórico meteorológico recente de Pelotas";
const PAGE_DESCRIPTION =
  "Compare temperaturas máximas e mínimas, chuva, rajadas, amplitude térmica e completude dos últimos 30 dias completos em Pelotas.";
const PAGE_PATH = "/historico-climatico-pelotas";

const HISTORY_PAGE_CONTENT = {
  ...HISTORY_EDITORIAL_CONTENT,
  eyebrow: "Entenda o recorte recente",
  title: "Como interpretar os últimos 30 dias em Pelotas",
  answer:
    "A página reúne dias completos recentes e permite comparar temperatura, chuva e rajadas. Os resultados valem somente para o período indicado e para o ponto de grade da fonte; não representam normais climatológicas nem recordes históricos oficiais do município.",
  facts: [
    "A média das máximas e a média das mínimas são calculadas apenas com os dias válidos da série.",
    "Chuva no período é a soma dos acumulados diários informados pela fonte.",
    "Dias com chuva consideram acumulado diário de pelo menos 1 mm; dias sem chuva informada usam acumulado abaixo de 0,1 mm.",
    "Amplitude térmica diária é a diferença entre a máxima e a mínima do mesmo dia.",
    "Campos ausentes permanecem indisponíveis e não são preenchidos com zero ou números demonstrativos.",
    "O recorte de 30 dias não permite concluir sozinho que o período foi normal, quente, frio, seco ou chuvoso em relação ao clima de Pelotas.",
  ],
  faqs: [
    {
      question: "Os dados representam observações da Estação Embrapa?",
      answer:
        "Não necessariamente. A página identifica a fonte histórica usada e trabalha com um ponto de grade para Pelotas. Medições da Estação Embrapa são apresentadas separadamente na página da estação.",
    },
    {
      question: "O dia mais quente é um recorde histórico de Pelotas?",
      answer:
        "Não. Ele é apenas o maior valor encontrado nos dias consultados e no conjunto de dados utilizado.",
    },
    {
      question: "Como é calculada a amplitude térmica?",
      answer:
        "A amplitude diária é a diferença entre a temperatura máxima e a mínima do mesmo dia. A página também mostra a média dessas diferenças no período.",
    },
    {
      question: "Por que alguns dias não têm chuva ou rajada informada?",
      answer:
        "A fonte pode não publicar determinada variável em todos os dias ou uma contingência pode fornecer apenas parte da série. O portal mantém esses campos como indisponíveis.",
    },
    {
      question: "Trinta dias são suficientes para definir o clima de Pelotas?",
      answer:
        "Não. Climatologia exige séries longas, períodos padronizados e controle de qualidade. Esta página serve para acompanhar o comportamento recente.",
    },
  ],
  relatedLinks: [
    {
      label: "Clima de Pelotas",
      href: "/clima-em-pelotas" as const,
      description: "Entenda estações do ano, fatores locais e a diferença entre tempo e clima.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas" as const,
      description: "Consulte medições locais recentes e a procedência da observação.",
    },
    {
      label: "Previsão de 7 dias",
      href: "/previsao-7-dias-pelotas" as const,
      description: "Compare o histórico recente com a tendência dos próximos dias.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia" as const,
      description: "Veja como cada fonte é usada, atualizada e limitada no portal.",
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
          { name: "Histórico meteorológico recente", path: PAGE_PATH },
        ],
        about: [
          "Histórico meteorológico de Pelotas",
          "Temperaturas máximas e mínimas recentes",
          "Chuva acumulada nos últimos 30 dias",
          "Rajadas de vento recentes",
          "Amplitude térmica diária",
          "Completude dos dados meteorológicos",
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
