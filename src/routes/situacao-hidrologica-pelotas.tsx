import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { OfficialDataAccessNotice } from "@/components/content/OfficialDataAccessNotice";
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
  "Acompanhe o nível no Laranjal, pontos da Lagoa dos Patos, o Guaíba e rios ligados ao SACE, com horário, tendência e informações sobre chuva e vento.";
const PAGE_PATH = "/situacao-hidrologica-pelotas";

const HYDROLOGY_PAGE_CONTENT = {
  ...HYDROLOGY_EDITORIAL_CONTENT,
  eyebrow: "Como acompanhar os níveis da água",
  title: "Entenda o que cada estação mostra e por que os valores não são iguais",
  answer:
    "A Estação Laranjal é a leitura local apresentada para Pelotas. Os demais pontos da Lagoa dos Patos, do Guaíba e dos rios acompanhados pelo SACE ajudam a entender a situação regional, mas cada estação usa seu próprio local, horário e referência de medição. Por isso, os números não devem ser comparados por simples subtração.",
  facts: [
    "O Tempo Pelotas possui acesso autorizado à plataforma integrada da ANA para coleta e exibição de informações hidrometeorológicas da Rede Hidrometeorológica Nacional; a integração dessas estações está sendo implantada gradualmente.",
    "A Rede Hidrometeorológica Nacional integra o SNIRH e reúne dados observados como níveis, vazões e chuvas, mantendo identificação própria de cada estação.",
    "A Estação Laranjal é a referência local do portal e não recebe automaticamente as cotas de outras estações.",
    "Uma leitura atrasada aparece como último valor conhecido e não como nível atual.",
    "Itapuã, Arambaré, São Lourenço do Sul e Rio Grande ajudam a acompanhar diferentes partes da Lagoa dos Patos.",
    "O SACE mostra a situação de rios como Jacuí, Taquari-Antas, Caí, Sinos e Gravataí, além do Delta e do Guaíba.",
    "As categorias Atenção, Alerta e Inundação pertencem à estação que as publicou e não são convertidas em classificação para o Laranjal.",
    "Vento, chuva, armazenamento de água, Canal São Gonçalo, drenagem local e saída oceânica podem influenciar a evolução em Pelotas.",
    "Quando uma estação não transmite, não há dado atual para interpretar; isso não significa que o nível esteja normal.",
  ],
  faqs: [
    ...HYDROLOGY_EDITORIAL_CONTENT.faqs,
    {
      question: "Como o Tempo Pelotas pretende usar os dados da ANA e da RHN?",
      answer:
        "O portal possui acesso autorizado à plataforma integrada da ANA para coleta e exibição de informações hidrometeorológicas da Rede Hidrometeorológica Nacional. A integração está sendo implantada de forma gradual, validando unidade, referência, horário e situação de cada estação antes de incorporá-la às páginas públicas.",
    },
    {
      question: "Uma estação elevada no SACE significa que o Laranjal vai subir?",
      answer:
        "Não necessariamente. A situação dos rios ajuda a entender o cenário, mas o nível no Laranjal também depende do tempo de deslocamento da água, do Guaíba, da Lagoa dos Patos, do vento, da chuva local e da saída em Rio Grande.",
    },
    {
      question: "O que significa acima de normal no SACE?",
      answer:
        "Significa que aquela estação foi publicada em uma categoria diferente de Normal, como Atenção, Alerta ou Inundação. A página reproduz a classificação da própria estação sem transformá-la em risco para Pelotas.",
    },
    {
      question: "O nível do Laranjal pode ser comparado diretamente com o nível do Guaíba?",
      answer:
        "Não. As estações ficam em locais diferentes e usam referências e instrumentos próprios. O mais útil é acompanhar a tendência e a evolução de cada ponto ao longo do tempo.",
    },
    {
      question: "Uma leitura antiga ainda aparece na página?",
      answer:
        "Pode aparecer como última leitura conhecida, sempre acompanhada do horário e da idade calculada. Ela não é apresentada como nível atual.",
    },
    {
      question: "Ausência de transmissão significa que o rio está normal?",
      answer:
        "Não. Significa apenas que não há uma leitura atual disponível naquela estação. O estado do rio não deve ser concluído sem dados válidos.",
    },
  ],
  relatedLinks: [
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal" as const,
      description: "Veja a página detalhada da Estação Laranjal e sua evolução recente.",
    },
    {
      label: "Enchente de 2024 em Pelotas",
      href: "/enchente-2024-pelotas-laranjal" as const,
      description: "Veja a linha do tempo da cheia e como a água avançou do Guaíba até Pelotas e o Laranjal.",
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
      label: "Como os dados funcionam",
      href: "/metodologia" as const,
      description: "Veja a origem, a atualização e os limites de cada fonte de nível.",
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
          "Rede Hidrometeorológica Nacional",
          "Agência Nacional de Águas e Saneamento Básico",
          "Sistema Nacional de Informações sobre Recursos Hídricos",
          "Portal HidroWeb e Hidrotelemetria",
          "Medições de nível na região",
          "Situação das águas em Pelotas",
          "Medições automáticas da Lagoa dos Patos",
          "Guaíba e Delta do Jacuí",
          "SACE Guaíba do Serviço Geológico do Brasil",
          "Rios Jacuí, Taquari-Antas, Caí, Sinos e Gravataí",
          "Horário e tendência das leituras de nível",
          "Referências locais de estações",
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
      <OfficialDataAccessNotice scope="hydrology" />
      <EditorialContentSection
        id="como-interpretar-situacao-das-aguas"
        content={HYDROLOGY_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
