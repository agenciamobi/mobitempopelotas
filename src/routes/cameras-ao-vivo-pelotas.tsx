import { createFileRoute } from "@tanstack/react-router";

import { CameraPageHero, CameraPageV2 } from "@/components/cameras/CameraPageV2";
import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { getWeatherCameras } from "@/lib/cameras/cameras.functions";
import { CAMERAS_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Câmeras do Laranjal e de Pelotas";
const PAGE_DESCRIPTION =
  "Consulte câmeras do Laranjal e de Pelotas, saiba se a imagem está ao vivo ou é uma gravação e veja a origem e o horário de cada transmissão.";
const PAGE_PATH = "/cameras-ao-vivo-pelotas";

const CAMERAS_PAGE_CONTENT = {
  ...CAMERAS_EDITORIAL_CONTENT,
  eyebrow: "Como entender as imagens",
  title: "Saiba quando a câmera está ao vivo e o que a imagem realmente mostra",
  answer:
    "Cada câmera mostra apenas o local enquadrado e o momento associado ao vídeo. A página informa se há transmissão ao vivo, gravação anterior, vídeo disponível sem confirmação de horário ou ponto ainda sem imagem. A câmera ajuda a observar o céu e o local, mas não mede temperatura, vento, chuva ou nível da água.",
  facts: [
    "Ao vivo significa que o serviço responsável confirmou uma transmissão ativa na última consulta.",
    "Última transmissão é uma gravação anterior e não deve ser interpretada como imagem atual.",
    "Vídeo disponível sem confirmação significa que o player funciona, mas não foi possível confirmar se a imagem é ao vivo ou gravada.",
    "Um ponto em preparação permanece sem imagem até existir uma transmissão pública confiável; o portal não usa imagens simuladas.",
    "Lente molhada, iluminação, reflexos, qualidade do vídeo e enquadramento podem alterar a aparência da cena.",
    "Para confirmar temperatura, vento, chuva ou nível da água, consulte as páginas de medição, previsão, radar e alertas.",
  ],
  faqs: [
    {
      question: "Todas as câmeras da página estão ao vivo?",
      answer:
        "Não. Cada ponto informa sua situação. A câmera pode estar ao vivo, mostrar a última gravação pública, ter vídeo disponível sem horário confirmado ou ainda estar em preparação.",
    },
    {
      question: "Como saber se a imagem é atual?",
      answer:
        "Confira o selo do vídeo. Somente a indicação Ao vivo confirma transmissão ativa na última consulta. As gravações mostram a data de publicação quando essa informação está disponível.",
    },
    {
      question: "Uma câmera confirma que está chovendo em toda Pelotas?",
      answer:
        "Não. Ela mostra apenas o ponto enquadrado e não informa intensidade, volume ou abrangência da chuva. Compare com radar, pluviômetro, previsão e outros pontos de observação.",
    },
    {
      question: "Por que o vídeo só carrega depois do clique?",
      answer:
        "Isso melhora o carregamento da página e evita abrir vídeos de serviços externos antes da escolha do visitante.",
    },
    {
      question: "O Tempo Pelotas controla as transmissões?",
      answer:
        "Não. Os vídeos pertencem aos responsáveis indicados em cada ponto e podem sair do ar, mudar de endereço ou impedir a exibição no portal.",
    },
  ],
  relatedLinks: [
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Compare a imagem local com nuvens, chuva e trovoadas observadas na região.",
    },
    {
      label: "Estação Embrapa",
      href: "/estacao-embrapa-pelotas" as const,
      description: "Consulte temperatura, umidade, pressão, vento e chuva medidos localmente.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Veja a chance e o volume previsto para os próximos horários.",
    },
    {
      label: "Avisos oficiais",
      href: "/alertas" as const,
      description: "Em situação de risco, consulte os avisos vigentes e as orientações oficiais.",
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
          { name: "Câmeras do Laranjal e de Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Câmera da Praia do Laranjal",
          "Câmeras ao vivo em Pelotas",
          "Gravações de câmeras meteorológicas",
          "Observação visual do tempo em Pelotas",
          "Condições visuais na Lagoa dos Patos",
          "Visibilidade e neblina no Laranjal",
          "Origem das transmissões públicas",
          "Diferença entre transmissão ao vivo e gravação",
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
