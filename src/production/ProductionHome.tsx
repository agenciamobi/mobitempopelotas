import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { HomeExplorePortal } from "@/components/weather/HomeExplorePortal";
import {
  toProductionAlerts,
  toProductionObservation,
  toProductionSummaries,
  toProductionWeatherData,
} from "@/production/adapters/home";
import { HomeEditorialDashboard } from "@/production/components/home-editorial-dashboard-semantic";
import { HomeSectionNavigation } from "@/production/components/home-section-navigation";
import { InmetAlertsPanel } from "@/production/components/inmet-alerts-panel";
import { SafetyAlertBanner } from "@/production/components/safety-alerts";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import { WeatherHero } from "@/production/components/weather-hero";
import { getFeaturedSafetyBanner } from "@/production/lib/safety-banners";
import type { WeatherData } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";
import "maplibre-gl/dist/maplibre-gl.css";
import "./production-styles";

const advisoryRank: Record<AdvisoryLevel, number> = { normal: 0, attention: 1, warning: 2 };

const unavailableSource = {
  name: "MOBI Tempo Pelotas",
  url: "/metodologia",
  isFallback: true,
  observationName: "Embrapa Clima Temperado",
  observationUrl: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
  forecastName: "Fontes meteorológicas em atualização",
  forecastUrl: "/metodologia",
} satisfies WeatherData["source"];

export function ProductionHome({
  data,
  laranjal,
  guaiba,
  lagoon,
}: {
  data: WeatherIntelligenceData;
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
}) {
  const hasUsableWeather = Boolean(
    data.weather.current?.temperature != null ||
    data.weather.observation.current.temperature != null ||
    data.weather.hourly.length > 0 ||
    data.weather.daily.length > 0,
  );

  if (!hasUsableWeather) {
    return (
      <div className="site-shell site-shell--home site-shell--home-editorial">
        <SiteHeader advisoryLevel="normal" variant="hero" />
        <main className="home-editorial-main" id="conteudo-principal" tabIndex={-1}>
          <section
            className="status-page production-weather-unavailable"
            aria-labelledby="weather-unavailable-title"
          >
            <p className="status-kicker">Tempo em Pelotas</p>
            <h1 id="weather-unavailable-title">Dados temporariamente indisponíveis</h1>
            <p>{data.weather.message ?? data.brief.summary}</p>
            <p>O portal continuará consultando automaticamente as fontes meteorológicas.</p>
            <p>
              Enquanto a previsão não atualiza, use os atalhos abaixo para consultar águas, câmeras,
              avisos e metodologia.
            </p>
          </section>
          <HomeExplorePortal />
        </main>
        <SiteFooter source={unavailableSource} />
      </div>
    );
  }

  const weather = toProductionWeatherData(data.weather);
  const summaries = toProductionSummaries(data);
  const observation = toProductionObservation(data.weather);
  const inmetAlerts = toProductionAlerts(data.weather);
  const advisory = getWeatherAdvisory(weather);
  const pelotasOfficialAlerts = inmetAlerts.alerts.filter((alert) => alert.relevance === "pelotas");
  const officialLevel: AdvisoryLevel = pelotasOfficialAlerts.some(
    (alert) => alert.severity === "danger" || alert.severity === "great-danger",
  )
    ? "warning"
    : pelotasOfficialAlerts.some((alert) => alert.severity === "potential")
      ? "attention"
      : "normal";
  const headerLevel =
    advisoryRank[officialLevel] > advisoryRank[advisory.level] ? officialLevel : advisory.level;
  const featuredSafetyBanner = getFeaturedSafetyBanner(pelotasOfficialAlerts.length > 0);
  const cppmetToday = data.weather.officialForecast[0] ?? null;
  const mainClassName =
    pelotasOfficialAlerts.length > 0
      ? "home-editorial-main has-official-alerts"
      : "home-editorial-main";

  return (
    <div className="site-shell site-shell--home site-shell--home-editorial">
      <SiteHeader advisoryLevel={headerLevel} variant="hero" />
      <WeatherHero
        weather={weather}
        advisoryLevel={headerLevel}
        officialAlertCount={pelotasOfficialAlerts.length}
        cppmetForecast={
          cppmetToday ? { item: cppmetToday, sourceUrl: "https://wp.ufpel.edu.br/cppmet/" } : null
        }
      />

      <main className={mainClassName} id="conteudo-principal" tabIndex={-1}>
        <InmetAlertsPanel data={inmetAlerts} variant="home" />
        <SafetyAlertBanner banner={featuredSafetyBanner} />
        <HomeSectionNavigation />
        <HomeEditorialDashboard
          weather={weather}
          summaries={summaries}
          advisoryLevel={headerLevel}
          observation={observation}
          laranjal={laranjal}
          guaiba={guaiba}
          lagoon={lagoon}
        />
      </main>

      <SiteFooter source={weather.source} />
    </div>
  );
}
