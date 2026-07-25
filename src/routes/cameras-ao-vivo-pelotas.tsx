import { createFileRoute } from "@tanstack/react-router";

import { CameraPage } from "@/components/cameras/CameraPage";
import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { getWeatherCameras } from "@/lib/cameras/cameras.functions";
import { CAMERAS_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Câmeras do Laranjal e pontos de observação em Pelotas";
const PAGE_DESCRIPTION =
  "Acompanhe a câmera da Praia do Laranjal, transmissões públicas recentes e pontos previstos de observação visual em Pelotas.";
const PAGE_PATH = "/cameras-ao-vivo-pelotas";

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
          "Observação visual do tempo em Pelotas",
          "Câmeras ao vivo em Pelotas",
          "Condições visuais na Lagoa dos Patos",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, CAMERAS_EDITORIAL_CONTENT.faqs),
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
  const data = Route.useLoaderData();

  return (
    <>
      <CameraPage cameraData={data.cameraData} weather={data.weather} />
      <EditorialContentSection id="como-interpretar-cameras" content={CAMERAS_EDITORIAL_CONTENT} />
    </>
  );
}
