import { createFileRoute } from "@tanstack/react-router";

import { WeatherAlertsPage } from "@/components/weather/WeatherAlertsPage";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Alertas meteorológicos em Pelotas";
const PAGE_DESCRIPTION =
  "Avisos meteorológicos oficiais do INMET para Pelotas e região, organizados por severidade e período.";
const PAGE_PATH = "/alertas";

export const Route = createFileRoute(PAGE_PATH)({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Avisos meteorológicos", path: PAGE_PATH },
        ],
        about: ["Avisos meteorológicos do INMET", "Segurança meteorológica em Pelotas"],
      }),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: AlertasPage,
});

function AlertasPage() {
  const weather = Route.useLoaderData();
  return <WeatherAlertsPage data={weather} />;
}
