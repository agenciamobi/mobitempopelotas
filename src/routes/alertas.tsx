import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { WeatherAlertsPage } from "@/components/weather/WeatherAlertsPage";
import "@/components/weather/WeatherAlertsRefinements.css";
import "@/components/weather/WeatherAlertsHomeContract.css";
import "@/components/weather/WeatherAlertsAccentContract.css";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Alertas meteorológicos em Pelotas e região";
const PAGE_DESCRIPTION =
  "Consulte alertas meteorológicos oficiais do INMET para Pelotas e região, com nível de perigo, validade, municípios afetados e orientações de segurança.";
const PAGE_PATH = "/alertas";

const ALERTS_PAGE_CONTENT = {
  eyebrow: "Como interpretar os avisos",
  title: "O que significam os alertas meteorológicos do INMET",
  answer:
    "Os avisos do INMET informam um fenômeno meteorológico, o período de validade, a área atingida e o nível de perigo. Eles devem ser lidos junto das orientações oficiais e podem ser atualizados, ampliados ou encerrados conforme a situação evolui.",
  facts: [
    "O alerta amarelo indica perigo potencial; o laranja indica perigo; e o vermelho indica grande perigo.",
    "Confira sempre os horários de início e término, porque um aviso programado ainda pode não estar em vigor.",
    "Um alerta regional ou estadual não significa, necessariamente, que todos os bairros de Pelotas terão o mesmo impacto.",
    "A ausência de alerta não elimina mudanças rápidas no tempo nem substitui o acompanhamento de radar e previsão.",
    "Quando a consulta ao INMET estiver indisponível, a página informa a falha em vez de interpretar a ausência de dados como ausência de risco.",
    "Em situação de risco, siga prioritariamente as orientações do INMET, da Defesa Civil e das autoridades locais.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre alerta amarelo, laranja e vermelho?",
      answer:
        "Amarelo representa perigo potencial, laranja representa perigo e vermelho representa grande perigo. Quanto maior o nível, maior tende a ser a necessidade de atenção e preparação, sempre conforme as orientações do próprio aviso.",
    },
    {
      question: "Nenhum alerta listado significa que não haverá temporal?",
      answer:
        "Não. Significa apenas que não há aviso ativo ou programado do INMET identificado para Pelotas nos dados consultados. Mudanças locais e rápidas ainda podem ocorrer.",
    },
    {
      question: "O que significa um alerta programado?",
      answer:
        "É um aviso publicado pelo INMET cujo horário de início ainda não chegou. A página separa avisos programados daqueles que já estão em vigor.",
    },
    {
      question: "Um alerta para o Rio Grande do Sul inclui Pelotas?",
      answer:
        "Nem sempre. A página informa quando o aviso cita Pelotas diretamente e identifica separadamente avisos regionais ou estaduais relevantes para acompanhamento.",
    },
    {
      question: "O que fazer quando os dados do INMET estiverem indisponíveis?",
      answer:
        "Não interprete a indisponibilidade como ausência de risco. Consulte novamente em alguns minutos e acompanhe os canais oficiais do INMET, da Defesa Civil e das autoridades locais.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja temperatura, chuva, vento e a evolução prevista para as próximas horas.",
    },
    {
      label: "Radar e satélite em Pelotas",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Acompanhe áreas de chuva, nuvens e imagens meteorológicas recentes.",
    },
    {
      label: "Chuva por horário em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Compare chance, volume e os períodos de maior possibilidade de chuva.",
    },
    {
      label: "Metodologia do Tempo Pelotas",
      href: "/metodologia" as const,
      description: "Entenda como as fontes oficiais são consultadas e quais são seus limites.",
    },
  ],
};

export const Route = createFileRoute("/alertas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Alertas meteorológicos", path: PAGE_PATH },
        ],
        about: [
          "Alertas meteorológicos do INMET",
          "Avisos meteorológicos em Pelotas",
          "Alerta amarelo do INMET",
          "Alerta laranja do INMET",
          "Alerta vermelho do INMET",
          "Perigo potencial, perigo e grande perigo",
          "Validade de avisos meteorológicos",
          "Municípios afetados por alertas",
          "Segurança meteorológica em Pelotas",
          "Defesa Civil e prevenção de riscos",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, ALERTS_PAGE_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: AlertasPage,
});

function AlertasPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--alerts"
      showOfficialAlerts={false}
    >
      <WeatherAlertsPage data={weather} />
      <EditorialContentSection id="como-interpretar-alertas" content={ALERTS_PAGE_CONTENT} />
    </InternalWeatherPageShell>
  );
}
