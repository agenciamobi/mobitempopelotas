import { TodayRetailHero } from "@/components/weather/TodayRetailHero";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";

import {
  regionalAdvisoryLevel,
  toRegionalRetailWeather,
} from "./regional-city-forecast-story";

export function RegionalCityHero({ data }: { data: RegionalCityWeatherData }) {
  const city = data.city;
  const condition = data.current?.condition ?? "Condição em atualização";

  return (
    <TodayRetailHero
      weather={toRegionalRetailWeather(data)}
      advisoryLevel={regionalAdvisoryLevel(data)}
      officialAlertCount={data.alerts.items.length}
      locationName={city.name}
      locationState="RS"
      primaryHref="#previsao-hoje"
      secondaryHref="#tendencia"
      secondaryLabel="Ver próximos dias"
      alertHref="#avisos-municipais"
      currentIsObserved={false}
      description={`${condition} agora em ${city.name}. Acompanhe a previsão por hora, chuva, vento e a tendência dos próximos dias para o município.`}
    />
  );
}
