import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { RainForecastPageV2 } from "@/components/weather/RainForecastPageV2";
import { RainHourlyVolumeContext } from "@/components/weather/RainHourlyVolumeContext";
import { RainRetailHero } from "@/components/weather/RainRetailHero";
import { RAIN_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getPelotasMeteogram } from "@/lib/weather/meteogram.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Chuva em Pelotas";
const PAGE_DESCRIPTION =
  "Veja chance e volume de chuva em Pelotas por horário, acumulados previstos para hoje e os próximos 7 dias, rajadas, radar e avisos oficiais do INMET.";
const PAGE_PATH = "/chuva-em-pelotas";

const RAIN_PAGE_CONTENT = {
  ...RAIN_EDITORIAL_CONTENT,
  eyebrow: "Entenda a previsão de chuva",
  title: "Como ler chance e volume de chuva em Pelotas",
  answer:
    "A chance percentual indica a possibilidade de chover no horário ou dia informado. O volume em milímetros estima quanto pode acumular. A página mostra também o volume previsto por hora nas próximas horas, sem tratar previsão como chuva já medida.",
  facts: [
    "Chance de chuva responde se a precipitação pode ocorrer; milímetros estimam quanto pode acumular no período.",
    "O detalhamento horário usa um perfil estruturado do Open-Meteo e mantém chance percentual e volume em milímetros como informações separadas.",
    "Os valores futuros são previsões. Chuva já registrada deve aparecer identificada como medição de estação ou pluviômetro.",
    "Em risco de temporal, alagamento ou inundação, consulte os avisos oficiais e acompanhe radar e situação hidrológica.",
  ],
  faqs: [
    {
      question: "O que significa 70% de chance de chuva?",
      answer:
        "Significa que a fonte estima uma chance alta de chover no local e período indicados. O percentual não informa sozinho quanto tempo a chuva deve durar nem quantos milímetros podem acumular.",
    },
    {
      question: "Chance de chuva alta significa muito volume?",
      answer:
        "Não necessariamente. A chance indica a possibilidade de ocorrência; o volume em milímetros estima a quantidade. Compare os dois valores antes de avaliar o possível impacto.",
    },
    {
      question: "O volume mostrado por hora já foi medido?",
      answer:
        "Não. O volume por hora desta página é uma previsão do modelo para cada intervalo futuro. Chuva observada só é apresentada como medição quando há uma fonte de estação ou pluviômetro identificada com horário.",
    },
    {
      question: "A chuva mostrada nesta página já foi medida?",
      answer:
        "Não quando o horário ou dia ainda está no futuro. Nesse caso, chance e volume são previsões. Medições observadas devem ser identificadas separadamente com fonte e horário.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja temperatura, chance de chuva e rajadas nas próximas horas.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Acompanhe a posição e o deslocamento das áreas de chuva na região.",
    },
    {
      label: "Avisos oficiais do INMET",
      href: "/alertas" as const,
      description: "Consulte validade, abrangência e orientações dos avisos para Pelotas.",
    },
  ],
};

export const Route = createFileRoute("/chuva-em-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Chuva em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão de chuva em Pelotas",
          "Probabilidade de chuva em Pelotas",
          "Volume de precipitação por hora em Pelotas",
          "Chuva por hora em Pelotas",
          "Acumulado previsto de chuva em Pelotas",
          "Melhores horários sem chuva em Pelotas",
          "Alertas oficiais de chuva em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, RAIN_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, meteogram] = await Promise.all([
      getWeatherIntelligence(),
      getPelotasMeteogram(),
    ]);
    return { weather, meteogram };
  },
  staleTime: 5 * 60 * 1_000,
  component: ChuvaPage,
});

function ChuvaPage() {
  const { weather, meteogram } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--rain"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <RainRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      <RainForecastPageV2 data={weather} />
      <RainHourlyVolumeContext meteogram={meteogram} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-de-chuva"
        content={RAIN_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
