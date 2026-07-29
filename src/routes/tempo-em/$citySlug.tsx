import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { RegionalCityWeatherPageClient } from "@/components/regional/RegionalCityWeatherPageClient";
import { createPageHead } from "@/lib/page-meta";
import { REGIONAL_HOME_CITY_SLUG, regionalCityPath } from "@/lib/regional-cities";
import { getRegionalCityWeather } from "@/lib/weather/regional-city-weather.functions";

export const Route = createFileRoute("/tempo-em/$citySlug")({
  beforeLoad: ({ params }) => {
    if (params.citySlug === REGIONAL_HOME_CITY_SLUG) {
      throw redirect({
        to: "/",
        statusCode: 301,
        replace: true,
      });
    }
  },
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
  return <RegionalCityWeatherPageClient data={Route.useLoaderData()} />;
}
