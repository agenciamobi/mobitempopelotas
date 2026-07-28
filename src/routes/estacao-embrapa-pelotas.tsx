import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  EmbrapaStationHero,
  EmbrapaStationPageV2,
} from "@/components/embrapa/EmbrapaStationPageV2";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { EMBRAPA_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Estação meteorológica da Embrapa em Pelotas";
const PAGE_DESCRIPTION =
  "Consulte temperatura, umidade, pressão, vento, chuva, evapotranspiração, extremos, horário e procedência da Estação Embrapa Clima Temperado em Pelotas.";
const PAGE_PATH = "/estacao-embrapa-pelotas";

const EMBRAPA_PAGE_CONTENT = {
  ...EMBRAPA_EDITORIAL_CONTENT,
  eyebrow: "Entenda a observação local",
  title: "Como interpretar as medições da Estação Embrapa em Pelotas",
  answer:
    "A estação registra condições em um ponto específico e em um horário próprio. O portal separa o momento da medição do momento da consulta, identifica leituras atrasadas ou parciais e informa quais campos da Embrapa entraram na condição atual consolidada.",
  facts: [
    "Temperatura, umidade, pressão, vento, chuva e evapotranspiração pertencem ao ponto dos instrumentos da Embrapa.",
    "O horário da medição é publicado pela estação; o horário da consulta mostra quando o Tempo Pelotas acessou a fonte.",
    "Uma leitura atrasada pode continuar visível como último valor conhecido, mas não deve ser tratada como condição atual.",
    "A chuva acumulada representa o pluviômetro local e pode diferir bastante entre bairros, zona rural e orla do Laranjal.",
    "A condição consolidada é montada campo a campo; a Embrapa pode fornecer parte das variáveis enquanto previsão e outros produtos vêm de fontes diferentes.",
    "Campos ausentes permanecem indisponíveis e não são substituídos por estimativas sem identificação.",
  ],
  faqs: [
    {
      question: "A temperatura da Embrapa representa toda Pelotas?",
      answer:
        "Não. Ela é uma medição válida para o local e horário da estação. Distância, urbanização, vegetação, proximidade da Lagoa e chuva localizada podem produzir diferenças em outros pontos do município.",
    },
    {
      question: "Qual é a diferença entre horário da medição e horário da consulta?",
      answer:
        "O horário da medição informa quando a estação registrou ou publicou o valor. O horário da consulta indica quando o portal acessou a fonte. Uma consulta recente pode encontrar uma medição antiga.",
    },
    {
      question: "O que significa leitura atrasada?",
      answer:
        "Significa que o último valor reconhecido ultrapassou o limite de atualidade usado pelo agregador. Ele pode ser mostrado como referência anterior, mas não é usado como observação atual sem essa ressalva.",
    },
    {
      question: "A chuva diária da Embrapa confirma quanto choveu em todos os bairros?",
      answer:
        "Não. Pancadas podem ser muito localizadas. O acumulado descreve o pluviômetro da estação e deve ser comparado com radar, outros pontos de observação e relatos locais.",
    },
    {
      question: "A Embrapa fornece a previsão das próximas horas?",
      answer:
        "Nesta página, a Embrapa é usada como fonte observacional. A previsão horária e diária permanece identificada separadamente pelas fontes de modelo e pelos produtos oficiais do portal.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Compare a observação local com a previsão das próximas horas.",
    },
    {
      label: "Histórico de 30 dias",
      href: "/historico-climatico-pelotas" as const,
      description: "Consulte máximas, mínimas, chuva, rajadas e amplitude do período recente.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Compare a chuva no pluviômetro com a evolução regional das áreas de precipitação.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia" as const,
      description: "Veja como a estação participa da consolidação e quais são seus limites.",
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
          "Procedência da condição atual",
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
