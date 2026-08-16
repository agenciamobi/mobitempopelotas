import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { FrostMapHero, FrostMapPageV2 } from "@/components/inmet/FrostMapPageV2";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { getInmetFrostOverview } from "@/lib/inmet/frost.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Geadas observadas no Rio Grande do Sul";
const PAGE_DESCRIPTION =
  "Veja registros de geada nas estações do INMET no Rio Grande do Sul, com período, tipo de estação, temperatura mínima, classificação, mapa e tabela.";
const PAGE_PATH = "/mapa-de-geadas-rio-grande-do-sul";
const RIO_GRANDE_DO_SUL_LOCATION = {
  "@type": "AdministrativeArea",
  name: "Rio Grande do Sul, Brasil",
  containedInPlace: {
    "@type": "Country",
    name: "Brasil",
  },
};

const FROST_PAGE_CONTENT = {
  eyebrow: "Como ler o mapa de geadas",
  title: "Entenda o que os pontos de geada representam",
  answer:
    "O mapa reúne registros passados das estações meteorológicas do INMET. Cada ponto mostra o local da estação e não toda a área que pode ter registrado geada. Quando nenhum registro aparece, isso significa apenas que a consulta não encontrou ocorrências nos filtros escolhidos.",
  facts: [
    "O mapa mostra registros passados e não prevê geada para a próxima madrugada.",
    "Nas estações convencionais, a ocorrência pode aparecer como fraca, moderada ou forte.",
    "Nas estações automáticas, a página mostra possível ocorrência quando essa é a informação disponível.",
    "Os círculos com números apenas juntam estações próximas naquele nível de zoom; eles não mostram o tamanho da área atingida.",
    "Baixadas, áreas rurais, lavouras e outros microclimas podem registrar geada mesmo quando a estação mais próxima não apresenta ocorrência.",
    "Para decisões agrícolas, combine o mapa com a previsão do tempo e orientação técnica local.",
  ],
  faqs: [
    {
      question: "O mapa mostra previsão de geada?",
      answer:
        "Não. Ele mostra registros de datas passadas nas estações consultadas. Para avaliar risco futuro, use a previsão meteorológica e orientação agrometeorológica.",
    },
    {
      question: "Nenhum ponto no mapa significa que não houve geada no estado?",
      answer:
        "Não. Significa apenas que nenhum registro foi encontrado para o período, o tipo de estação e os dados disponíveis naquela consulta. Locais sem estação ou com microclima diferente podem ter registrado geada.",
    },
    {
      question: "Qual é a diferença entre estação convencional e automática?",
      answer:
        "São formas diferentes de observação. Nesta página, as convencionais podem mostrar intensidade fraca, moderada ou forte, enquanto as automáticas aparecem como possível ocorrência quando essa é a classificação disponível.",
    },
    {
      question: "Os círculos agrupados mostram o tamanho da área com geada?",
      answer:
        "Não. Eles apenas juntam estações próximas para facilitar a navegação. Ao aproximar o mapa, os pontos individuais aparecem.",
    },
    {
      question: "A menor temperatura exibida é um recorde histórico do estado?",
      answer:
        "Não. É somente a menor temperatura entre os registros encontrados pelos filtros atuais.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão para amanhã em Pelotas",
      href: "/tempo-amanha-pelotas" as const,
      description: "Consulte temperatura mínima, vento e evolução prevista para o próximo dia.",
    },
    {
      label: "Clima de Pelotas",
      href: "/clima-em-pelotas" as const,
      description: "Entenda o frio, as estações do ano e a diferença entre tempo e clima.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas" as const,
      description: "Veja medições locais e os extremos registrados em Pelotas.",
    },
    {
      label: "Como os dados funcionam",
      href: "/metodologia" as const,
      description: "Confira a origem, a atualização e os limites das fontes meteorológicas.",
    },
  ],
};

export const Route = createFileRoute("/mapa-de-geadas-rio-grande-do-sul")({
  head: () =>
    createPageHead(
      PAGE_TITLE,
      PAGE_DESCRIPTION,
      PAGE_PATH,
      [
        createEditorialPageJsonLd({
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          path: PAGE_PATH,
          breadcrumbs: [
            { name: "Início", path: "/" },
            { name: "Monitoramento", path: "/radar-e-satelite-pelotas" },
            { name: "Geadas observadas no RS", path: PAGE_PATH },
          ],
          about: [
            "Geadas observadas no Rio Grande do Sul",
            "Estações meteorológicas do INMET",
            "Temperatura mínima por estação",
            "Intensidade de geada",
            "Estações convencionais e automáticas",
            "Observação agrometeorológica",
            "Diferença entre observação e previsão de geada",
            "Cobertura de estações meteorológicas",
          ],
          location: RIO_GRANDE_DO_SUL_LOCATION,
        }),
        createFaqPageJsonLd(PAGE_PATH, FROST_PAGE_CONTENT.faqs),
      ],
      { geo: null },
    ),
  loader: async () => {
    const [frost, weather] = await Promise.all([
      getInmetFrostOverview(),
      getWeatherIntelligence(),
    ]);
    return { frost, weather };
  },
  staleTime: 15 * 60 * 1_000,
  component: FrostRoutePage,
});

function FrostRoutePage() {
  const { frost, weather } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--frost"
      showOfficialAlerts={false}
      hero={() => <FrostMapHero initialData={frost} />}
    >
      <FrostMapPageV2 initialData={frost} />
      <EditorialContentSection id="como-interpretar-mapa-de-geadas" content={FROST_PAGE_CONTENT} />
    </InternalWeatherPageShell>
  );
}
