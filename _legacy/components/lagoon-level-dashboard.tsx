import { PelotasHydrologyWidget } from "@/components/pelotas-hydrology-widget";

type LagoonLevelDashboardProps = {
  windSpeed: number;
  windDirection: string;
  windGust: number;
  precipitation: number;
  condition: string;
  updatedAt: string;
};

export async function LagoonLevelDashboard({
  windSpeed,
  windDirection,
  windGust,
  precipitation,
}: LagoonLevelDashboardProps) {
  return (
    <PelotasHydrologyWidget
      weather={{
        windSpeed,
        windDirection,
        windGust,
        precipitation,
      }}
      headingLevel="h2"
      className="pelotas-hydrology-widget--dashboard"
    />
  );
}
