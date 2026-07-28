import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  HydrologyOverviewHero,
  HydrologyOverviewV2,
} from "@/components/hydrology/HydrologyOverviewV2";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
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
  "Acompanhe a Estação Laranjal, a Lagoa dos Patos, o Guaíba e o SACE, com nível observado, tendência, atualidade, referências locais e contexto meteorológico.";
const PAGE_PATH = "/situacao-hidrologica-pelotas";

const HYDROLOGY_PAGE_CONTENT = {
  ...HYDROLOGY_EDITORIAL_CONTENT,
  eyebrow: "Entenda a rede hidrológica",
  title: "Como relacionar Laranjal, Lagoa dos Patos, Guaíba e seus afluentes",
  answer:
    "A leitura do Laranjal descreve o ponto local da UFPel e utiliza a referência técnica daquele sensor. A rede da Lagoa dos Patos, o Guaíba e o SACE ampliam o contexto regional, mas conservam cotas, horários e classificações próprias. Nenhuma estação distante prevê sozinha o nível futuro em Pelotas.",
  facts: [
    "A Estação Laranjal é a referência local apresentada pelo portal e não possui conversão automática para cotas de outras estações.",
    "Uma leitura atrasada continua identificada como último valor conhecido, nunca como nível atual sem ressalva.",
    "A rede da Lagoa dos Patos compara Itapuã, Arambaré, São Lourenço do Sul e o estuário de Rio Grande, cada ponto com referência local própria.",
    "O SACE Guaíba acrescenta contexto dos rios Jacuí, Taquari-Antas, Caí, Sinos, Gravataí, Delta e Guaíba.",
    "Categorias de atenção, alerta e inundação pertencem à estação oficial que as publicou e não são convertidas em classificação local para o Laranjal.",
    "Vento, chuva, armazenamento no Guaíba e na Lagoa, Canal São Gonçalo, drenagem local e saída oceânica influenciam a evolução observada em Pelotas.",
    "Ausência de transmissão significa ausência de dado atual; não significa que o nível esteja normal.",
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
      question: "O nível do Laranjal pode ser comparado diretamente com o nível do Guaíba?",
      answer:
        "Não. As estações usam referências, locais, instrumentos e métodos distintos. A comparação útil é observar tendência, horário e evolução dentro de cada série, não subtrair diretamente os valores absolutos.",
    },
    {
      question: "Uma leitura antiga ainda aparece na página?",
      answer:
        "Pode aparecer como última leitura conhecida, acompanhada do horário e da idade calculada. Ela não é apresentada como nível atual e não recebe tendência nova sem dados suficientes.",
    },
    {
      question: "Ausência de transmissão significa que o rio está normal?",
      answer:
        "Não. Sem transmissão indica ausência de dado atual naquela estação. O estado do rio não deve ser inferido quando a fonte não publica uma leitura válida.",
    },
  ],
  relatedLinks: [
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal" as const,
      description: "Abra a página detalhada da Estação Laranjal e sua série recente.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Consulte chuva, vento e rajadas previstos para as próximas horas.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas" as const,
      description: "Acompanhe avisos meteorológicos vigentes e orientações oficiais.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia" as const,
      description: "Veja a função, a atualização e os limites de cada integração hidrológica.",
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
          "Atualidade e tendência de leituras hidrológicas",
          "Referências locais de estações de nível",
          "Influência do vento e da chuva no nível da lagoa",
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
  staleTime: 60 * 1_000,
  component: SituacaoHidrologicaPage,
});

function SituacaoHidrologicaPage() {
  const data = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={data.weather}
      pageClassName="internal-weather-shell--hydrology"
      showOfficialAlerts={false}
      hero={() => (
        <HydrologyOverviewHero
          level={data.level}
          lagoon={data.lagoon}
          sace={data.sace}
        />
      )}
    >
      <HydrologyOverviewV2
        weather={data.weather}
        level={data.level}
        guaiba={data.guaiba}
        lagoon={data.lagoon}
        sace={data.sace}
      />
      <EditorialContentSection
        id="como-interpretar-situacao-das-aguas"
        content={HYDROLOGY_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
