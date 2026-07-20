import { GuaibaLevelCard } from "@/components/guaiba-level-card";
import { LagoonMonitoringNetwork } from "@/components/lagoon-monitoring-network";
import { PelotasHydrologyWidget } from "@/components/pelotas-hydrology-widget";
import { SGB_SACE_URL } from "@/lib/hydrology";
import type { GuaibaObservationData } from "@/lib/guaiba-monitor";
import type { LagoonMonitoringNetworkData } from "@/lib/lagoon-monitoring-network";
import type { LaranjalLevelData } from "@/lib/laranjal-level";
import type { WeatherData } from "@/lib/weather-data";

type HydrologyOverviewProps = {
  weather: WeatherData;
  guaiba: GuaibaObservationData;
  lagoonMonitoring: LagoonMonitoringNetworkData;
  laranjal: LaranjalLevelData;
};

export function HydrologyOverview({
  weather,
  guaiba,
  lagoonMonitoring,
  laranjal,
}: HydrologyOverviewProps) {
  const today = weather.daily[0];
  const strongestUpcomingGust = Math.max(
    weather.current.windGust,
    ...weather.hourly.map((hour) => hour.windGust),
  );

  return (
    <section
      className="hydrology-home hydrology-home--compact"
      id="situacao-das-aguas"
      aria-label="Resumo da situação das águas em Pelotas"
    >
      <div className="hydrology-home-grid">
        <PelotasHydrologyWidget
          initialData={laranjal}
          weather={{
            windSpeed: weather.current.windSpeed,
            windDirection: weather.current.windDirection,
            windGust: strongestUpcomingGust,
            precipitation: today?.precipitation ?? 0,
          }}
          headingLevel="h3"
          className="pelotas-hydrology-widget--home"
        />

        <aside className="hydrology-context-column" aria-label="Contexto do Guaíba">
          <GuaibaLevelCard data={guaiba} />

          <a className="hydrology-sgb-link" href={SGB_SACE_URL} target="_blank" rel="noreferrer">
            <span>
              <small>Serviço Geológico do Brasil</small>
              <strong>Consultar níveis, boletins e avisos oficiais</strong>
            </span>
            <b aria-hidden="true">↗</b>
          </a>
        </aside>
      </div>

      <LagoonMonitoringNetwork data={lagoonMonitoring} variant="home" />
    </section>
  );
}
