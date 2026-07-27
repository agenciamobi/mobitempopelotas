import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { HydrologyEditorialHero } from "@/components/hydrology/HydrologyEditorialHero";
import "@/components/hydrology/HydrologyEditorialRefinements.css";
import "@/components/hydrology/HydrologyEditorialRoute.css";
import { HydrologyOverviewPage } from "@/components/hydrology/HydrologyPages";
import { SaceGuaibaContext } from "@/components/hydrology/SaceGuaibaContext";
import { HYDROLOGY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { getSaceGuaibaData } from "@/lib/hydrology/sace-guaiba.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Situação das águas em Pelotas";
const PAGE_DESCRIPTION =
  "Leitura da Estação Laranjal, evolução da Lagoa dos Patos, Guaíba e estações do SACE nos rios que alimentam o sistema regional.";
const PAGE_PATH = "/situacao-hidrologica-pelotas";

const HYDROLOGY_PAGE_CONTENT = {
  ...HYDROLOGY_EDITORIAL_CONTENT,
  eyebrow: "Entenda a rede hidrológica",
  title: "Como relacionar Laranjal, Lagoa dos Patos, Guaíba e seus afluentes",
  answer:
    "A leitura do Laranjal descreve o ponto local da UFPel. As estações distribuídas pela Lagoa dos Patos ajudam a comparar diferentes trechos, enquanto o SACE Guaíba mostra a situação oficial de rios e estações a montante. Essas fontes são complementares, mas nenhuma estação distante prevê sozinha o nível futuro em Pelotas.",
  facts: [
    "A Estação Laranjal é a referência local apresentada pelo portal e não deve ser comparada diretamente com cotas de outras estações.",
    "A rede da Lagoa dos Patos mostra como os níveis variam entre Itapuã, Arambaré, São Lourenço do Sul e o estuário de Rio Grande.",
    "O SACE Guaíba acrescenta contexto dos rios Jacuí, Taquari-Antas, Caí, Sinos, Gravataí, Delta e Guaíba.",
    "Categorias de atenção, alerta e inundação pertencem à estação e à referência oficial do SACE; elas não são convertidas em classificação local para o Laranjal.",
    "Vento, chuva, saída oceânica, drenagem local e armazenamento no Guaíba e na Lagoa influenciam a evolução observada em Pelotas.",
  ],
  faqs: [
    ...HYDROLOGY_EDITORIAL_CONTENT.faqs,
    {
      question: "Uma estação elevada no SACE significa que o Laranjal vai subir?",
      answer:
        "Não necessariamente. A situação a montante é um contexto importante, mas o comportamento no Laranjal também depende do tempo de propagação, do Guaíba, da Lagoa dos Patos, do vento, da chuva local e da saída oceânica em Rio Grande.",
    },
    {
      question: "O que significa acima de normal na seção do SACE?",
      answer:
        "Significa que a própria estação foi publicada pelo SACE em uma categoria diferente de Normal, como Cota de Atenção, Cota de Alerta ou Cota de Inundação. O portal reproduz essa classificação oficial sem transformá-la em risco para Pelotas.",
    },
    {
      question: "Ausência de transmissão significa que o rio está normal?",
      answer:
        "Não. Sem transmissão indica ausência de dado atual naquela estação. O estado do rio não deve ser inferido quando a fonte não publica uma leitura válida.",
    },
  ],
};

export const Route = createFileRoute("/situacao-hidrologica-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Nível da Lagoa dos Patos",
          "Estação Laranjal",
          "Monitoramento hidrológico regional",
          "Situação das águas em Pelotas",
          "Telemetria da Lagoa dos Patos",
          "Guaíba e Delta do Jacuí",
          "SACE Guaíba do Serviço Geológico do Brasil",
          "Rios Jacuí, Taquari-Antas, Caí, Sinos e Gravataí",
          "Influência do vento no nível da lagoa",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, HYDROLOGY_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, level, guaiba, lagoon, sace] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
      getSaceGuaibaData(),
    ]);
    return { weather, level, guaiba, lagoon, sace };
  },
  staleTime: 5 * 60 * 1_000,
  component: SituacaoHidrologicaPage,
});

function SituacaoHidrologicaPage() {
  const data = Route.useLoaderData();

  return (
    <div className="hydrology-editorial-route">
      <HydrologyEditorialHero level={data.level} variant="overview" />
      <HydrologyOverviewPage
        weather={data.weather}
        level={data.level}
        guaiba={data.guaiba}
        lagoon={data.lagoon}
      />
      <SaceGuaibaContext data={data.sace} />
      <EditorialContentSection
        id="como-interpretar-situacao-das-aguas"
        content={HYDROLOGY_PAGE_CONTENT}
      />
    </div>
  );
}
