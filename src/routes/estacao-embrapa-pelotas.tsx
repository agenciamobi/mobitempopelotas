import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  EmbrapaStationHero,
  EmbrapaStationPageV2,
} from "@/components/embrapa/EmbrapaStationPageV2";
import "@/components/embrapa/EmbrapaStationPageV2Refinement.css";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { EMBRAPA_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Estação meteorológica da Embrapa em Pelotas";
const PAGE_DESCRIPTION =
  "Consulte temperatura, umidade, pressão, vento, chuva, evapotranspiração, extremos, horário e origem dos dados da Estação Embrapa em Pelotas.";
const PAGE_PATH = "/estacao-embrapa-pelotas";

const EMBRAPA_PAGE_CONTENT = {
  ...EMBRAPA_EDITORIAL_CONTENT,
  eyebrow: "Como ler as medições da estação",
  title: "Entenda o que a Estação Embrapa mede em Pelotas",
  answer:
    "A estação registra as condições em um ponto específico e em horários próprios. A página separa o horário da medição do momento em que o Tempo Pelotas consultou a fonte, avisa quando a leitura está atrasada e mostra quais informações da Embrapa foram usadas no resumo atual.",
  facts: [
    "Temperatura, umidade, pressão, vento, chuva e evapotranspiração representam o local onde os instrumentos estão instalados.",
    "O horário da medição informa quando o valor foi registrado; a última atualização informa quando o portal consultou a fonte.",
    "Uma leitura atrasada pode continuar visível como último valor conhecido, mas não é apresentada como condição atual.",
    "A chuva acumulada representa o pluviômetro da estação e pode ser diferente em outros bairros, na zona rural e no Laranjal.",
    "A Embrapa pode fornecer parte das informações atuais, enquanto a previsão das próximas horas vem de modelos meteorológicos identificados separadamente.",
    "Quando um valor não é informado, a página mantém o campo indisponível em vez de preencher com zero ou estimativa não identificada.",
  ],
  faqs: [
    {
      question: "A temperatura da Embrapa representa toda Pelotas?",
      answer:
        "Não. Ela representa o local e o horário da estação. Urbanização, vegetação, distância, proximidade da Lagoa e chuva localizada podem produzir diferenças em outros pontos do município.",
    },
    {
      question: "Qual é a diferença entre horário da medição e última atualização?",
      answer:
        "O horário da medição informa quando a estação registrou ou publicou o valor. A última atualização indica quando o Tempo Pelotas consultou a fonte. Uma consulta recente pode encontrar uma medição antiga.",
    },
    {
      question: "O que significa leitura atrasada?",
      answer:
        "Significa que o último valor conhecido ultrapassou o limite de atualidade usado pelo portal. Ele pode ser mostrado como referência anterior, mas não é tratado como observação atual.",
    },
    {
      question: "A chuva diária da Embrapa confirma quanto choveu em todos os bairros?",
      answer:
        "Não. Pancadas podem ser muito localizadas. O acumulado descreve o pluviômetro da estação e deve ser comparado com radar, outros pontos de observação e relatos locais.",
    },
    {
      question: "A Embrapa fornece a previsão das próximas horas?",
      answer:
        "Nesta página, a Embrapa é usada para mostrar medições locais. A previsão horária e diária aparece separadamente e identifica o modelo responsável.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Compare a medição local com a previsão das próximas horas.",
    },
    {
      label: "Histórico de 30 dias",
      href: "/historico-climatico-pelotas" as const,
      description: "Consulte máximas, mínimas, chuva, rajadas e amplitude do período recente.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Compare a chuva no pluviômetro com as áreas de precipitação observadas na região.",
    },
    {
      label: "Como os dados funcionam",
      href: "/metodologia" as const,
      description: "Veja como as medições da estação são usadas e quais são seus limites.",
    },
  ],
};

export const Route = createFileRoute("/estacao-embrapa-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Estação Embrapa em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Observação meteorológica em Pelotas",
          "Embrapa Clima Temperado",
          "Posto Meteorológico da Sede",
          "Medições meteorológicas locais",
          "Temperatura e umidade observadas",
          "Pressão e vento medidos em Pelotas",
          "Chuva acumulada na Estação Embrapa",
          "Evapotranspiração em Pelotas",
          "Horário e idade da observação",
          "Origem dos dados da condição atual",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, EMBRAPA_PAGE_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 60 * 1_000,
  component: EstacaoEmbrapaPage,
});

function EstacaoEmbrapaPage() {
  const data = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={data}
      pageClassName="internal-weather-shell--embrapa"
      showOfficialAlerts={false}
      hero={() => <EmbrapaStationHero data={data} />}
    >
      <EmbrapaStationPageV2 data={data} />
      <EditorialContentSection
        id="como-interpretar-estacao-embrapa"
        content={EMBRAPA_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
