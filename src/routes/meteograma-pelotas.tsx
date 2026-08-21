import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { MeteogramHero, MeteogramPage } from "@/components/weather/MeteogramPage";
import "@/components/weather/MeteogramRefinement.css";
import "@/components/weather/MeteogramHomeContract.css";
import { SimagroModelProducts } from "@/components/weather/SimagroModelProducts";
import { getPelotasMeteogram } from "@/lib/weather/meteogram.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Previsão hora a hora em Pelotas";
const PAGE_DESCRIPTION =
  "Acompanhe temperatura, chuva, nuvens, visibilidade, pressão, vento e tempestade nas próximas 24 ou 48 horas e compare produtos WRF/GFS do SIMAGRO RS para Pelotas.";
const PAGE_PATH = "/meteograma-pelotas";

const METEOGRAM_CONTENT = {
  eyebrow: "Como ler a previsão hora a hora",
  title: "Veja como o tempo pode mudar ao longo das próximas horas",
  answer:
    "A página coloca as principais informações previstas nos mesmos horários. Assim, você consegue comparar temperatura, chuva, nuvens, visibilidade, pressão e vento sem precisar abrir várias telas. Os valores vêm de modelos de previsão e não representam medições feitas continuamente em todos os bairros.",
  facts: [
    "Quando temperatura e ponto de orvalho ficam próximos, o ar está mais úmido. Isso pode favorecer neblina, mas vento, nuvens baixas e visibilidade também precisam ser considerados.",
    "A chance de chuva responde à possibilidade de chover; o volume em milímetros estima quanto pode cair durante aquele intervalo.",
    "Nuvens baixas, médias e altas são mostradas separadamente. Os percentuais não devem ser somados.",
    "A velocidade do vento representa o valor médio previsto; a rajada é um aumento breve e normalmente mais forte.",
    "O índice CAPE ajuda a avaliar a possibilidade de desenvolvimento de nuvens de tempestade. Um valor alto, sozinho, não confirma temporal.",
    "A previsão de 48 horas pode mudar conforme entram novas observações. Para decisões imediatas, confira os horários mais próximos e os avisos oficiais.",
    "Os meteogramas WRF e GFS do SIMAGRO RS aparecem como produtos gráficos complementares. O Tempo Pelotas não extrai números dessas imagens nem mistura seus valores com a série estruturada da página.",
  ],
  faqs: [
    {
      question: "Os gráficos mostram medições ou previsão?",
      answer:
        "Eles mostram previsões para cada horário. As medições da Estação Embrapa aparecem em uma página separada e descrevem somente o local e o horário observados.",
    },
    {
      question: "Qual é a diferença entre chance e volume de chuva?",
      answer:
        "A chance mostra a possibilidade de chover. O volume em milímetros estima quanto pode cair naquele intervalo. Uma chance alta pode vir acompanhada de pouco volume.",
    },
    {
      question: "Temperatura próxima do ponto de orvalho confirma neblina?",
      answer:
        "Não. Essa proximidade indica ar úmido, mas neblina também depende de vento, resfriamento, nuvens baixas, visibilidade e condições locais.",
    },
    {
      question: "O que é o índice CAPE?",
      answer:
        "É um indicador da energia disponível para o crescimento de nuvens. Valores maiores podem favorecer tempestades, mas precisam ser avaliados junto com chuva, nuvens, vento, radar e avisos oficiais.",
    },
    {
      question: "Por que a previsão de 48 horas pode mudar?",
      answer:
        "Os modelos são recalculados quando recebem novas observações. Chuva, neblina, rajadas e tempestades podem mudar de horário ou intensidade conforme o momento se aproxima.",
    },
    {
      question: "Por que o Tempo Pelotas mostra também meteogramas WRF e GFS do SIMAGRO RS?",
      answer:
        "Eles oferecem uma segunda leitura visual de modelagem para Pelotas. São exibidos como imagens oficiais da fonte, com identificação clara, e não substituem nem alteram os valores horários estruturados usados pelo Tempo Pelotas.",
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
      description: "Compare a chance de chuva e o volume previsto por horário.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Acompanhe nuvens, chuva e atividade elétrica observadas na região.",
    },
    {
      label: "Avisos oficiais",
      href: "/alertas" as const,
      description: "Consulte a validade e as orientações dos avisos do INMET.",
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
          { name: "Previsão hora a hora em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Meteograma de Pelotas",
          "Previsão horária de temperatura e ponto de orvalho",
          "Chance e volume de chuva por hora",
          "Nuvens baixas, médias e altas",
          "Visibilidade prevista em Pelotas",
          "Pressão atmosférica",
          "Vento e rajadas por hora",
          "CAPE e possibilidade de tempestade",
          "Open-Meteo Best Match",
          "SIMAGRO RS",
          "Meteograma WRF para Pelotas",
          "Meteograma GFS para Pelotas",
          "Agrometeograma GFS para Pelotas",
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
      <SimagroModelProducts />
      <EditorialContentSection id="como-interpretar-meteograma" content={METEOGRAM_CONTENT} />
    </InternalWeatherPageShell>
  );
}
