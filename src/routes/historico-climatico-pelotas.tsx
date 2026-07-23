import { createFileRoute } from "@tanstack/react-router";

import { WeatherHistoryPage } from "@/components/history/WeatherHistoryPage";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getPelotasWeatherHistory } from "@/lib/weather/history.functions";

const PAGE_TITLE = "Como foi o tempo nos últimos 30 dias em Pelotas";
const PAGE_DESCRIPTION =
  "Compare temperaturas máximas e mínimas, chuva e rajadas dos últimos 30 dias completos em Pelotas, com fonte e metodologia explícitas.";
const PAGE_PATH = "/historico-climatico-pelotas";

export const Route = createFileRoute(PAGE_PATH)({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Histórico climático recente", path: PAGE_PATH },
        ],
        about: ["Histórico meteorológico de Pelotas", "Chuva e temperatura recentes"],
      }),
    ]),
  loader: () => getPelotasWeatherHistory(),
  staleTime: 6 * 60 * 60 * 1_000,
  component: HistoricoClimaticoPage,
});

function HistoricoClimaticoPage() {
  const history = Route.useLoaderData();
  return <WeatherHistoryPage history={history} />;
}
