import { createFileRoute } from "@tanstack/react-router";

import { CameraPageHero, CameraPageV2 } from "@/components/cameras/CameraPageV2";
import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { getWeatherCameras } from "@/lib/cameras/cameras.functions";
import { CAMERAS_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Câmeras do Laranjal e pontos de observação em Pelotas";
const PAGE_DESCRIPTION =
  "Consulte câmeras do Laranjal e pontos de Pelotas com estado ao vivo, replay, player configurado, horário, procedência e contexto meteorológico.";
const PAGE_PATH = "/cameras-ao-vivo-pelotas";

const CAMERAS_PAGE_CONTENT = {
  ...CAMERAS_EDITORIAL_CONTENT,
  eyebrow: "Entenda a observação visual",
  title: "Como interpretar câmeras, lives e replays meteorológicos em Pelotas",
  answer:
    "Uma câmera mostra somente o enquadramento e o momento associado ao player. O portal diferencia transmissão ao vivo, replay, player configurado sem estado verificado e ponto em preparação. A imagem complementa radar, estação e previsão, mas não mede variáveis meteorológicas.",
  facts: [
    "Ao vivo significa que o provedor confirmou uma transmissão ativa na consulta mais recente.",
    "Replay é uma gravação pública anterior e não deve ser interpretada como imagem atual.",
    "Player configurado significa que existe uma incorporação, mas o estado de live ou replay não foi confirmado pela integração.",
    "Ponto em preparação permanece visível sem imagem simulada até existir uma fonte pública estável.",
    "Lente molhada, iluminação, reflexos, qualidade do vídeo e enquadramento podem alterar a percepção da cena.",
    "Temperatura, vento, chuva e nível da água devem ser consultados em medições, previsão e produtos oficiais separados.",
  ],
  faqs: [
    {
      question: "Todas as câmeras da página estão ao vivo?",
      answer:
        "Não. Cada ponto informa seu estado. Uma câmera pode estar ao vivo, exibir o replay público mais recente, ter um player configurado sem estado confirmado ou ainda estar em preparação.",
    },
    {
      question: "Como saber se a imagem é atual?",
      answer:
        "Verifique o selo do player. Somente o estado ao vivo indica transmissão confirmada no momento da consulta. Replays exibem data de publicação quando o provedor fornece essa informação.",
    },
    {
      question: "Uma câmera confirma que está chovendo em toda Pelotas?",
      answer:
        "Não. Ela pode mostrar chuva aparente no ponto enquadrado, mas não informa intensidade, volume nem abrangência. Compare com radar, pluviômetro, previsão e outros pontos de observação.",
    },
    {
      question: "Por que o vídeo só carrega depois do clique?",
      answer:
        "O carregamento sob demanda reduz requisições externas, melhora o desempenho inicial e evita iniciar players de terceiros antes da escolha do visitante.",
    },
    {
      question: "O Tempo Pelotas controla as transmissões?",
      answer:
        "Não. Os players pertencem aos provedores e responsáveis identificados em cada ponto. Eles podem sair do ar, mudar de endereço ou bloquear incorporação sem aviso ao portal.",
    },
  ],
  relatedLinks: [
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Compare a imagem local com nuvens, precipitação e trovoadas na região.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas" as const,
      description: "Consulte temperatura, umidade, pressão, vento e chuva medidos localmente.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Veja probabilidade e volume previsto para os próximos horários.",
    },
    {
      label: "Avisos oficiais",
      href: "/alertas" as const,
      description: "Em situação de risco, consulte os avisos vigentes e as autoridades responsáveis.",
    },
  ],
};

export const Route = createFileRoute("/cameras-ao-vivo-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Câmeras e observação visual", path: PAGE_PATH },
        ],
        about: [
          "Câmera da Praia do Laranjal",
          "Câmeras ao vivo em Pelotas",
          "Replay de câmera meteorológica",
          "Observação visual do tempo em Pelotas",
          "Condições visuais na Lagoa dos Patos",
          "Visibilidade e neblina no Laranjal",
          "Procedência de transmissões públicas",
          "Diferença entre live e replay",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, CAMERAS_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [cameraData, weather] = await Promise.all([
      getWeatherCameras(),
      getWeatherIntelligence(),
    ]);
    return { cameraData, weather };
  },
  staleTime: 3 * 60 * 1_000,
  component: CamerasPage,
});

function CamerasPage() {
  const { cameraData, weather } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--cameras"
      showOfficialAlerts={false}
      hero={() => <CameraPageHero cameraData={cameraData} />}
    >
      <CameraPageV2 cameraData={cameraData} weather={weather} />
      <EditorialContentSection id="como-interpretar-cameras" content={CAMERAS_PAGE_CONTENT} />
    </InternalWeatherPageShell>
  );
}
