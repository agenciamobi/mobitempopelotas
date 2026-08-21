import { createFileRoute } from "@tanstack/react-router";

import {
  Flood2024Hero,
  Flood2024HistoricalPage,
} from "@/components/history/Flood2024HistoricalPage";
import "@/components/history/Flood2024HomeContract.css";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Enchente de 2024 em Pelotas e no Laranjal: linha do tempo histórica";
const PAGE_DESCRIPTION =
  "Linha do tempo da enchente de 2024 em Pelotas e no Laranjal, do excesso de chuva no Centro e Norte do RS ao avanço pelo Guaíba, Lagoa dos Patos, Canal São Gonçalo e fase de reconstrução.";
const PAGE_PATH = "/enchente-2024-pelotas-laranjal";

export const Route = createFileRoute("/enchente-2024-pelotas-laranjal")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Enchente de 2024 em Pelotas e no Laranjal", path: PAGE_PATH },
        ],
        about: [
          "Enchente de 2024 em Pelotas",
          "Enchente de 2024 no Laranjal",
          "Lagoa dos Patos",
          "Canal São Gonçalo",
          "Guaíba",
          "Cheia histórica de maio de 2024",
          "Linha do tempo da enchente de Pelotas",
          "Arambaré",
          "São Lourenço do Sul",
          "São José do Norte",
          "Rio Grande",
          "Hidrologia da Lagoa dos Patos",
        ],
      }),
    ]),
  loader: async () => ({ weather: await getWeatherIntelligence() }),
  staleTime: 60 * 60 * 1_000,
  component: Enchente2024PelotasPage,
});

function Enchente2024PelotasPage() {
  const { weather } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--flood-history"
      showOfficialAlerts={false}
      hero={() => <Flood2024Hero />}
    >
      <Flood2024HistoricalPage />
    </InternalWeatherPageShell>
  );
}
