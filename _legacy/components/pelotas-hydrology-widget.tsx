import {
  PelotasHydrologyWidgetClient,
  type WidgetHeading,
} from "@/components/pelotas-hydrology-widget-client";
import {
  getLaranjalLevelData,
  type LaranjalLevelData,
} from "@/lib/laranjal-level";
import { getPelotasWeather } from "@/lib/weather-service";

export type PelotasHydrologyWidgetProps = {
  initialData?: LaranjalLevelData;
  weather?: {
    windSpeed: number;
    windDirection: string;
    windGust: number;
    precipitation: number;
  };
  headingLevel?: WidgetHeading;
  className?: string;
};

export async function PelotasHydrologyWidget({
  initialData,
  weather,
  headingLevel = "h2",
  className,
}: PelotasHydrologyWidgetProps = {}) {
  const [resolvedData, weatherData] = await Promise.all([
    initialData ?? getLaranjalLevelData(),
    weather ? Promise.resolve(null) : getPelotasWeather(),
  ]);
  const today = weatherData?.daily[0];
  const resolvedWeather =
    weather ??
    ({
      windSpeed: weatherData!.current.windSpeed,
      windDirection: weatherData!.current.windDirection,
      windGust: Math.max(
        weatherData!.current.windGust,
        ...weatherData!.hourly.map((hour) => hour.windGust),
      ),
      precipitation: today?.precipitation ?? 0,
    } satisfies NonNullable<PelotasHydrologyWidgetProps["weather"]>);

  return (
    <PelotasHydrologyWidgetClient
      initialData={resolvedData}
      weather={resolvedWeather}
      headingLevel={headingLevel}
      className={className}
    />
  );
}
