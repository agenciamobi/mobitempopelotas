import { useEffect, useState } from "react";

import {
  recoverRegionalCityWeatherInBrowser,
  regionalCityNeedsBrowserRecovery,
} from "@/lib/weather/regional-city-weather-client";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import { RegionalCityWeatherPage } from "./RegionalCityWeatherPage";

export function RegionalCityWeatherPageClient({
  data: initialData,
}: {
  data: RegionalCityWeatherData;
}) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
    if (!regionalCityNeedsBrowserRecovery(initialData)) return;

    const controller = new AbortController();
    void recoverRegionalCityWeatherInBrowser(initialData, controller.signal)
      .then((recovered) => {
        if (!controller.signal.aborted) setData(recovered);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("[weather/regional-city-client] Falha ao recuperar previsão regional", {
          city: initialData.city.slug,
          message: error instanceof Error ? error.message : String(error),
        });
      });

    return () => controller.abort();
  }, [initialData]);

  return <RegionalCityWeatherPage data={data} />;
}
