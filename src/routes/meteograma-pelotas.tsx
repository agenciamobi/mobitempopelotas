import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { MeteogramHero, MeteogramPage } from "@/components/weather/MeteogramPage";
import "@/components/weather/MeteogramRefinement.css";
import { getPelotasMeteogram } from "@/lib/weather/meteogram.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Meteograma de Pelotas";
const PAGE_DESCRIPTION =
  "Meteograma de Pelotas com temperatura, ponto de orvalho, chuva por hora, nuvens, visibilidade, pressão, vento, rajadas e CAPE nas próximas 24 ou 48 horas.";
const PAGE_PATH = "/meteograma-pelotas";

const METEOGRAM_CONTENT = {
  eyebrow: "Entenda o meteograma",
  title: "Como interpretar a evolução da atmosfera hora a hora",
  answer:
    "O meteograma reúne variáveis previstas para os mesmos horários, permitindo observar como temperatura, umidade, chuva, nuvens, visibilidade, pressão e vento evoluem em conjunto. Os gráficos representam uma previsão de modelo e não medições contínuas realizadas em todos os bairros de Pelotas.",
  facts: [
    "Temperatura e ponto de orvalho próximos indicam ar perto da saturação, mas neblina também depende de vento, nuvens baixas e visibilidade.",
    "Chance de chuva informa possibilidade; volume em milímetros estima quanto pode precipitar no intervalo. Os dois valores não são equivalentes.",
    "Nuvens baixas, médias e altas usam percentuais independentes e não devem ser somadas como se fossem partes de um único total.",
    "Velocidade do vento é uma média prevista para o período; rajada representa um pico breve e normalmente mais forte.",
    "CAPE indica energia disponível para convecção. Um valor elevado isoladamente não confirma temporal e deve ser comparado com radar, nuvens, chuva, vento e avisos oficiais.",
    "Previsões de 48 horas podem mudar entre atualizações. Para decisões imediatas, confirme o horário mais próximo, a observação local e os avisos vigentes.",
  ],
  faqs: [
    {
      question: "O meteograma mostra dados medidos ou previstos?",
      answer:
        "Os gráficos horários são previsões do modelo identificado na página. A observação atual da Embrapa é mantida separada e descreve apenas o ponto e o horário medidos pela estação.",
    },
    {
      question: "Qual é a diferença entre chance e volume de chuva?",
      answer:
        "A chance indica a probabilidade de ocorrer precipitação no intervalo. O volume em milímetros estima quanto pode acumular durante aquela hora. Chance alta pode ocorrer com pouco volume, e volume relevante pode aparecer em uma janela curta.",
    },
    {
      question: "Ponto de orvalho próximo da temperatura confirma neblina?",
      answer:
        "Não. A proximidade indica ar úmido perto da saturação. Neblina depende também de vento, resfriamento, nuvens baixas, visibilidade e condições locais que podem variar entre bairros, áreas rurais e a orla.",
    },
    {
      question: "O que significa CAPE no meteograma?",
      answer:
        "CAPE é uma medida da energia potencial disponível para movimentos convectivos. Valores maiores podem favorecer nuvens de grande desenvolvimento, mas não confirmam tempestade sem outros ingredientes atmosféricos.",
    },
    {
      question: "Por que a previsão de 48 horas pode mudar?",
      answer:
        "Modelos são recalculados quando recebem novas observações. Chuva, neblina, rajadas e instabilidade podem apresentar mudanças relevantes conforme o horário se aproxima.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja a condição atual e o resumo das próximas horas.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Compare chance e volume previstos em uma leitura dedicada.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Acompanhe imagens observadas, nuvens e atividade elétrica regional.",
    },
    {
      label: "Avisos oficiais",
      href: "/alertas" as const,
      description: "Consulte severidade, validade e orientações dos avisos do INMET.",
    },
  ],
};

export const Route = createFileRoute("/meteograma-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Meteograma de Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Meteograma de Pelotas",
          "Previsão horária de temperatura e ponto de orvalho",
          "Chance e volume de chuva por hora",
          "Nuvens baixas, médias e altas",
          "Visibilidade prevista em Pelotas",
          "Pressão atmosférica",
          "Vento e rajadas por hora",
          "CAPE e instabilidade convectiva",
          "Open-Meteo Best Match",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, METEOGRAM_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, meteogram] = await Promise.all([
      getWeatherIntelligence(),
      getPelotasMeteogram(),
    ]);
    return { weather, meteogram };
  },
  staleTime: 5 * 60 * 1_000,
  component: MeteogramaPelotasPage,
});

function MeteogramaPelotasPage() {
  const { weather, meteogram } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--meteogram"
      showOfficialAlerts={false}
      hero={() => <MeteogramHero weather={weather} meteogram={meteogram} />}
    >
      <MeteogramPage weather={weather} meteogram={meteogram} />
      <EditorialContentSection id="como-interpretar-meteograma" content={METEOGRAM_CONTENT} />
    </InternalWeatherPageShell>
  );
}
