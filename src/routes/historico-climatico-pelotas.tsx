import { createFileRoute } from "@tanstack/react-router";

import { WeatherHistoryPage } from "@/components/history/WeatherHistoryPage";
import { createPageHead } from "@/lib/page-meta";
import { getPelotasWeatherHistory } from "@/lib/weather/history.functions";

export const Route = createFileRoute("/historico-climatico-pelotas")({
  head: () =>
    createPageHead(
      "Como foi o tempo nos últimos 30 dias em Pelotas",
      "Compare temperaturas máximas e mínimas, chuva e rajadas dos últimos 30 dias completos em Pelotas, com fonte e metodologia explícitas.",
      "/historico-climatico-pelotas",
    ),
  loader: () => getPelotasWeatherHistory(),
  staleTime: 6 * 60 * 60 * 1_000,
  component: HistoricoClimaticoPage,
});

function HistoricoClimaticoPage() {
  const history = Route.useLoaderData();
  return <WeatherHistoryPage history={history} />;
}
