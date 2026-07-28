import { createFileRoute } from "@tanstack/react-router";

import "@/components/embed/LaranjalEmbedIsolation.css";
import { ObsWeatherStatusWidget } from "@/components/embed/ObsWeatherStatusWidget";
import { getObsWeatherStatus } from "@/lib/weather/obs-weather-status.functions";

const ROBOTS_POLICY = "noindex, nofollow, noarchive, nosnippet, noimageindex";

export const Route = createFileRoute("/embed/status-tempo-agora")({
  head: () => ({
    meta: [
      { title: "Status do tempo agora em Pelotas — OBS" },
      { name: "robots", content: ROBOTS_POLICY },
      { name: "googlebot", content: ROBOTS_POLICY },
      { name: "theme-color", content: "#071e2f" },
    ],
  }),
  loader: () => getObsWeatherStatus(),
  staleTime: 5 * 60 * 1_000,
  component: ObsWeatherStatusRoute,
});

function ObsWeatherStatusRoute() {
  return <ObsWeatherStatusWidget data={Route.useLoaderData()} />;
}
