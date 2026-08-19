import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { HomeExplorePortal } from "@/components/weather/HomeExplorePortal";
import type { WeatherCameraData } from "@/lib/cameras/cameras.types";
import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import { HOME_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import {
  toProductionAlerts,
  toProductionObservation,
  toProductionSummaries,
  toProductionWeatherData,
} from "@/production/adapters/home";
import { HomeEditorialDashboard } from "@/production/components/home-editorial-dashboard-semantic";
import { HomeForecastEditorial } from "@/production/components/home-forecast-editorial";
import { HomeLiveCameraBackground } from "@/production/components/home-live-camera-background";
import { HomeObservationEditorial } from "@/production/components/home-observation-editorial";
import { HomeRadarEditorial } from "@/production/components/home-radar-editorial";
import { HomeSectionNavigation } from "@/production/components/home-section-navigation";
import {
  hasVerifiedInmetAlertSemantics,
  InmetAlertsPanel,
} from "@/production/components/inmet-alerts-panel";
import { InmetOfficialForecastPanel } from "@/production/components/inmet-official-forecast-panel";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import { WeatherHero } from "@/production/components/weather-hero";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";
import type { WeatherData } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";

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

function getLiveLaranjalCamera(cameraData: WeatherCameraData) {
  const camera = cameraData.cameras.find((item) => item.id === "laranjal");
  if (
    !camera ||
    camera.status !== "online" ||
    camera.broadcastStatus !== "live" ||
    !camera.embedUrl
  ) {
    return null;
  }

  try {
    const embedUrl = new URL(camera.embedUrl);
    if (embedUrl.protocol !== "https:") return null;

    return {
      ...camera,
      embedUrl: embedUrl.toString(),
    };
  } catch {
    return null;
  }
}

function strongestHourlyWindSpeed(weather: WeatherData) {
  return weather.hourly.slice(0, 24).reduce<number | null>((strongest, hour) => {
    if (!Number.isFinite(hour.windSpeed)) return strongest;
    return strongest === null ? hour.windSpeed : Math.max(strongest, hour.windSpeed);
  }, null);
}

export function ProductionHome({
  data,
  laranjal,
  guaiba,
  lagoon,
  cameraData,
}: {
  data: WeatherIntelligenceData;
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
  cameraData: WeatherCameraData;
}) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = useMemo(
    () => toProductionWeatherData(recoveredData.weather),
    [recoveredData.weather],
  );
  const liveLaranjalCamera = useMemo(() => getLiveLaranjalCamera(cameraData), [cameraData]);
  const hasUsableWeather = Boolean(
    weather.current.available || weather.hourly.length > 0 || weather.daily.length > 0,
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
            <p>{recoveredData.weather.message ?? recoveredData.brief.summary}</p>
            <p>O portal continuará consultando automaticamente as fontes meteorológicas.</p>
            <p>
              Enquanto a previsão não atualiza, use os atalhos abaixo para consultar águas, câmeras,
              avisos e metodologia.
            </p>
          </section>
          <HomeExplorePortal />
          <EditorialContentSection id="como-interpretar-o-tempo" content={HOME_EDITORIAL_CONTENT} />
        </main>
        <SiteFooter source={unavailableSource} />
      </div>
    );
  }

  const summaries = toProductionSummaries(recoveredData);
  const observation = toProductionObservation(recoveredData.weather);
  const inmetAlerts = toProductionAlerts(recoveredData.weather);
  const advisory = getWeatherAdvisory(weather);
  const pelotasOfficialAlerts = inmetAlerts.alerts.filter((alert) => alert.relevance === "pelotas");
  const verifiedPelotasAlerts = pelotasOfficialAlerts.filter(hasVerifiedInmetAlertSemantics);
  const hasPelotasOfficialAlerts = pelotasOfficialAlerts.length > 0;
  const officialLevel: AdvisoryLevel = verifiedPelotasAlerts.some(
    (alert) => alert.severity === "danger" || alert.severity === "great-danger",
  )
    ? "warning"
    : verifiedPelotasAlerts.some((alert) => alert.severity === "potential") ||
        hasPelotasOfficialAlerts
      ? "attention"
      : "normal";
  const headerLevel =
    advisoryRank[officialLevel] > advisoryRank[advisory.level] ? officialLevel : advisory.level;
  const cppmetToday = recoveredData.weather.officialForecast[0] ?? null;
  const forecastWindSpeedKmh = strongestHourlyWindSpeed(weather);
  const mainClassName = hasPelotasOfficialAlerts
    ? "home-editorial-main has-official-alerts"
    : "home-editorial-main";

  return (
    <div className="site-shell site-shell--home site-shell--home-editorial">
      <SiteHeader advisoryLevel={headerLevel} variant="hero" />
      <div className={`tp-home-hero-shell${liveLaranjalCamera ? " has-live-camera" : ""}`}>
        <WeatherHero
          weather={weather}
          advisoryLevel={headerLevel}
          officialAlertCount={pelotasOfficialAlerts.length}
          cppmetForecast={
            cppmetToday ? { item: cppmetToday, sourceUrl: "https://wp.ufpel.edu.br/cppmet/" } : null
          }
          liveCameraBackground={
            liveLaranjalCamera ? (
              <HomeLiveCameraBackground
                embedUrl={liveLaranjalCamera.embedUrl}
                title={liveLaranjalCamera.streamTitle ?? liveLaranjalCamera.name}
              />
            ) : null
          }
        />
        {liveLaranjalCamera ? (
          <Link
            className="tp-home-hero-source"
            to="/cameras-ao-vivo-pelotas"
            aria-label="Abrir a câmera ao vivo da Praia do Laranjal"
          >
            <span>
              <i aria-hidden="true" /> Câmera do Laranjal ao vivo
            </span>
            <small>Céu e clima em tempo real</small>
          </Link>
        ) : null}
      </div>

      <main className={mainClassName} id="conteudo-principal" tabIndex={-1}>
        <InmetAlertsPanel data={inmetAlerts} variant="home" advisoryLevel={headerLevel} />
        <HomeSectionNavigation />
        <HomeForecastEditorial weather={weather} narrative={summaries.tomorrow} />
        <InmetOfficialForecastPanel
          periods={recoveredData.weather.inmetForecast}
          station={recoveredData.weather.inmetStation}
          forecastWindSpeedKmh={forecastWindSpeedKmh}
        />
        <HomeRadarEditorial regionalWeather={weather.regional} />
        <HomeObservationEditorial weather={weather} observation={observation} />
        <HomeEditorialDashboard
          weather={weather}
          advisoryLevel={headerLevel}
          observation={observation}
          laranjal={laranjal}
          guaiba={guaiba}
          lagoon={lagoon}
        />
        <HomeExplorePortal />
        <EditorialContentSection id="como-interpretar-o-tempo" content={HOME_EDITORIAL_CONTENT} />
      </main>

      <SiteFooter source={weather.source} />
    </div>
  );
}
