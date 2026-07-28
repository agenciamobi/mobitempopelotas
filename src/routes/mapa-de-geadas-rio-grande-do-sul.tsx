import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { FrostMapHero, FrostMapPageV2 } from "@/components/inmet/FrostMapPageV2";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { getInmetFrostOverview } from "@/lib/inmet/frost.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Mapa de geadas observadas no Rio Grande do Sul";
const PAGE_DESCRIPTION =
  "Consulte registros de geada por estação do INMET no Rio Grande do Sul, com período, tipo de estação, temperatura mínima, classificação, mapa e tabela acessível.";
const PAGE_PATH = "/mapa-de-geadas-rio-grande-do-sul";

const FROST_PAGE_CONTENT = {
  eyebrow: "Entenda o monitoramento de geadas",
  title: "Como interpretar os registros de geada das estações do INMET",
  answer:
    "O mapa reúne registros passados associados a estações meteorológicas do INMET. Cada ponto representa o local da estação e não uma área contínua atingida. A ausência de registro nos filtros selecionados não comprova ausência de geada em todo o município, região ou estado.",
  facts: [
    "O produto é observacional: mostra registros de datas passadas e não prevê geada para a próxima madrugada.",
    "Estações convencionais podem receber classificação fraca, moderada ou forte conforme os critérios processados pelo produto.",
    "Estações automáticas são apresentadas como possível ocorrência e não recebem necessariamente a mesma gradação das convencionais.",
    "Agrupamentos no mapa indicam somente marcadores próximos no nível de zoom, não extensão territorial do fenômeno.",
    "Baixadas, áreas rurais, lavouras e microclimas podem registrar geada mesmo quando a estação mais próxima não retornou ocorrência.",
    "Decisões agrícolas devem combinar observação, previsão agrometeorológica e orientação técnica local.",
  ],
  faqs: [
    {
      question: "O mapa mostra previsão de geada?",
      answer:
        "Não. Ele mostra registros observados em datas passadas pelas estações retornadas pelo produto do INMET. Para risco futuro, consulte previsão meteorológica e orientação agrometeorológica.",
    },
    {
      question: "Nenhum ponto no mapa significa que não houve geada no Rio Grande do Sul?",
      answer:
        "Não. Significa apenas que nenhum registro foi retornado para o período, tipo de estação, estado e dados disponíveis naquela consulta. Locais sem estação ou com microclima diferente podem ter apresentado geada.",
    },
    {
      question: "Qual é a diferença entre estação convencional e automática?",
      answer:
        "São redes e métodos observacionais diferentes. Nesta visualização, as convencionais podem receber gradação de intensidade, enquanto as automáticas aparecem como possível ocorrência conforme o produto consultado.",
    },
    {
      question: "Os círculos agrupados mostram o tamanho da área com geada?",
      answer:
        "Não. Eles apenas agrupam estações próximas para facilitar a navegação no mapa. Ao ampliar o zoom, os marcadores individuais são exibidos.",
    },
    {
      question: "A menor temperatura é um recorde histórico do estado?",
      answer:
        "Não. É somente a menor temperatura mínima entre os registros retornados pelos filtros atuais. Não representa recorde histórico oficial do Rio Grande do Sul.",
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
      description: "Entenda sazonalidade, frio, massas de ar e diferença entre tempo e clima.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas" as const,
      description: "Veja medições locais, extremos e procedência da observação em Pelotas.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia" as const,
      description: "Confira origem, atualização, função e limites das integrações meteorológicas.",
    },
  ],
};

export const Route = createFileRoute("/mapa-de-geadas-rio-grande-do-sul")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Monitoramento", path: "/radar-e-satelite-pelotas" },
          { name: "Mapa de geadas observadas no RS", path: PAGE_PATH },
        ],
        about: [
          "Geadas observadas no Rio Grande do Sul",
          "Estações meteorológicas do INMET",
          "Temperatura mínima por estação",
          "Classificação de intensidade de geada",
          "Estações convencionais e automáticas",
          "Monitoramento agrometeorológico",
          "Diferença entre observação e previsão de geada",
          "Cobertura espacial de estações meteorológicas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, FROST_PAGE_CONTENT.faqs),
    ]),
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
