import { createFileRoute } from "@tanstack/react-router";

import { CameraPage } from "@/components/cameras/CameraPage";
import { getWeatherCameras } from "@/lib/cameras/cameras.functions";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/cameras-ao-vivo-pelotas")({
  head: () =>
    createPageHead(
      "Câmeras do Laranjal e pontos de observação em Pelotas",
      "Acompanhe a câmera da Praia do Laranjal, transmissões públicas recentes e pontos previstos de observação visual em Pelotas.",
      "/cameras-ao-vivo-pelotas",
    ),
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
  return <CameraPage cameraData={data.cameraData} weather={data.weather} />;
}
