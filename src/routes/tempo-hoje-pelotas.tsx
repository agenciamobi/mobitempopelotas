import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { TodayForecastPageV5 } from "@/components/weather/TodayForecastPageV5";
import { TodayRetailHero } from "@/components/weather/TodayRetailHero";
import { TODAY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Tempo hoje em Pelotas";
const PAGE_DESCRIPTION =
  "Tempo hoje em Pelotas com condições atuais, previsão por hora, ponto de orvalho, nuvens, visibilidade, chuva, vento, radar e alertas oficiais.";
const PAGE_PATH = "/tempo-hoje-pelotas";

const TODAY_PAGE_CONTENT = {
  ...TODAY_EDITORIAL_CONTENT,
  eyebrow: "Entenda os dados",
  title: "O que foi medido e o que é previsão nesta página",
  answer:
    "A condição atual usa a medição local quando a estação está disponível. Os horários futuros, máxima, mínima, chuva, rajadas, visibilidade e camadas de nuvens são previsões. A avaliação de neblina combina vários dados previstos e não confirma que ela ocorrerá em todos os pontos da cidade.",
  facts: [
    "Temperatura, sensação térmica, umidade, pressão, vento e ponto de orvalho atuais usam a medição local quando ela está disponível.",
    "Máxima, mínima, chance de chuva, volume, rajadas, visibilidade, instabilidade e camadas de nuvens são previsões meteorológicas.",
    "Ponto de orvalho próximo da temperatura, umidade elevada, nuvens baixas e visibilidade reduzida aumentam a possibilidade de neblina, mas não garantem que ela ocorrerá em todo o município.",
    "Antes de sair, atualize a página e confira radar e avisos oficiais quando houver mudança rápida no tempo.",
  ],
  faqs: [
    {
      question: "A temperatura mostrada agora foi medida?",
      answer:
        "Quando há uma leitura local recente, sim. A página identifica a estação e o horário. Quando a medição está indisponível, a estimativa para agora aparece identificada separadamente.",
    },
    {
      question: "O que significa ponto de orvalho?",
      answer:
        "É a temperatura em que o ar precisaria chegar para ficar saturado. Quando o ponto de orvalho e a temperatura ficam próximos, aumenta a possibilidade de condensação, neblina ou sensação de ar muito úmido. Vento, nuvens e visibilidade também influenciam.",
    },
    {
      question: "A avaliação confirma que haverá neblina?",
      answer:
        "Não. Ela combina ponto de orvalho, umidade, nuvens baixas e visibilidade prevista para indicar os horários com maior possibilidade. A ocorrência pode variar entre bairros, áreas rurais e a orla.",
    },
    {
      question: "Chance de chuva e volume previsto são a mesma coisa?",
      answer:
        "Não. A chance indica a possibilidade de chover no período. O volume em milímetros estima quanto pode acumular.",
    },
    {
      question: "Quando devo conferir a previsão novamente?",
      answer:
        "Confira perto do horário de saída e antes de atividades ao ar livre. Quando houver chuva, rajadas, baixa visibilidade ou aviso oficial, consulte também radar e alertas.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo amanhã em Pelotas",
      href: "/tempo-amanha-pelotas" as const,
      description: "Veja máxima, mínima, chuva e vento previstos para o próximo dia.",
    },
    {
      label: "Chuva por horário em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Compare chance, volume e os períodos com maior possibilidade de chuva.",
    },
    {
      label: "Radar e satélite em Pelotas",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Compare chuva, nuvens, trovoadas e o horário das imagens meteorológicas.",
    },
    {
      label: "Avisos oficiais do INMET",
      href: "/alertas" as const,
      description: "Consulte validade, abrangência e orientações dos avisos para Pelotas.",
    },
  ],
};

export const Route = createFileRoute("/tempo-hoje-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Tempo hoje em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão do tempo",
          "Condições meteorológicas em Pelotas",
          "Temperatura atual em Pelotas",
          "Ponto de orvalho em Pelotas",
          "Previsão de neblina e nuvens baixas em Pelotas",
          "Visibilidade prevista em Pelotas",
          "Camadas de nuvens baixas, médias e altas",
          "Previsão por hora em Pelotas",
          "Melhores horários para atividades ao ar livre em Pelotas",
          "Janelas de chuva e vento nas próximas horas",
          "Medição meteorológica da Embrapa em Pelotas",
          "Alertas meteorológicos do INMET em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, TODAY_PAGE_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoHojePage,
});

function TempoHojePage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--today"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <TodayRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      <TodayForecastPageV5 data={weather} />
      <EditorialContentSection id="como-interpretar-hoje" content={TODAY_PAGE_CONTENT} />
    </InternalWeatherPageShell>
  );
}
