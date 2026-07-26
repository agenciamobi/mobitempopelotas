import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegionalCityWeatherPage } from "@/components/regional/RegionalCityWeatherPage";
import { createPageHead } from "@/lib/page-meta";
import { regionalCityPath } from "@/lib/regional-cities";
import { getRegionalCityWeather } from "@/lib/weather/regional-city-weather.functions";

export const Route = createFileRoute("/tempo-em/$citySlug")({
  loader: async ({ params }) => {
    const data = await getRegionalCityWeather({ data: { slug: params.citySlug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const city = loaderData?.city;
    if (!city) return {};
    const title = `Tempo em ${city.name}, RS`;
    const description = `Previsão do tempo para ${city.name}, com temperatura, chuva, vento, próximos 7 dias e avisos meteorológicos do INMET.`;
    return createPageHead(title, description, regionalCityPath(city));
  },
  staleTime: 5 * 60 * 1_000,
  component: RegionalCityRoute,
});

function RegionalCityRoute() {
  return <RegionalCityWeatherPage data={Route.useLoaderData()} />;
}
