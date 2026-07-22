import { HomeEditorialDashboard } from "@/components/home-editorial-dashboard-semantic";
import { HomeSectionNavigation } from "@/components/home-section-navigation";
import { InmetAlertsPanel } from "@/components/inmet-alerts-panel";
import { SafetyAlertBanner } from "@/components/safety-alerts";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WeatherHero } from "@/components/weather-hero";
import {
  getCppmetForecast,
  getCppmetForecastItemForDate,
} from "@/lib/cppmet-forecast";
import { getGuaibaObservation } from "@/lib/guaiba-monitor";
import { getInmetAlerts } from "@/lib/inmet-alerts";
import { getLagoonMonitoringNetwork } from "@/lib/lagoon-monitoring-network";
import { getLaranjalLevelData } from "@/lib/laranjal-level";
import { getFeaturedSafetyBanner } from "@/lib/safety-banners";
import { absoluteUrl } from "@/lib/site";
import { getWeatherAiSummaries } from "@/lib/weather-ai-summary";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/lib/weather-insights";
import { getPelotasWeatherWithObservation } from "@/lib/weather-service";

// Atualiza dados e resumo editorial da homepage a cada cinco minutos.
export const revalidate = 300;

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TEMPO Pelotas",
  url: absoluteUrl("/"),
  description:
    "Portal local com previsão do tempo, avisos meteorológicos e níveis das águas em Pelotas e na Zona Sul do Rio Grande do Sul.",
  inLanguage: "pt-BR",
  areaServed: {
    "@type": "City",
    name: "Pelotas",
    containedInPlace: {
      "@type": "State",
      name: "Rio Grande do Sul",
    },
  },
};

const advisoryRank: Record<AdvisoryLevel, number> = {
  normal: 0,
  attention: 1,
  warning: 2,
};

export default async function Home() {
  const [
    { weather, observation: embrapaObservation },
    cppmetForecast,
    guaibaObservation,
    lagoonMonitoring,
    laranjalObservation,
    inmetAlerts,
  ] = await Promise.all([
    getPelotasWeatherWithObservation(),
    getCppmetForecast(),
    getGuaibaObservation(),
    getLagoonMonitoringNetwork(),
    getLaranjalLevelData(),
    getInmetAlerts(),
  ]);
  const summaries = await getWeatherAiSummaries(weather);
  const cppmetToday = getCppmetForecastItemForDate(cppmetForecast);
  const advisory = getWeatherAdvisory(weather);
  const pelotasOfficialAlerts = inmetAlerts.alerts.filter(
    (alert) => alert.relevance === "pelotas",
  );
  const officialLevel: AdvisoryLevel = pelotasOfficialAlerts.some(
    (alert) => alert.severity === "danger" || alert.severity === "great-danger",
  )
    ? "warning"
    : pelotasOfficialAlerts.some((alert) => alert.severity === "potential")
      ? "attention"
      : "normal";
  const headerLevel =
    advisoryRank[officialLevel] > advisoryRank[advisory.level]
      ? officialLevel
      : advisory.level;
  const mainClassName =
    pelotasOfficialAlerts.length > 0
      ? "home-editorial-main has-official-alerts"
      : "home-editorial-main";
  const featuredSafetyBanner = getFeaturedSafetyBanner(
    pelotasOfficialAlerts.length > 0,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema).replace(/</g, "\u003c"),
        }}
      />

      <div className="site-shell site-shell--home site-shell--home-editorial">
        <SiteHeader advisoryLevel={headerLevel} variant="hero" />
        <WeatherHero
          weather={weather}
          advisoryLevel={headerLevel}
          officialAlertCount={pelotasOfficialAlerts.length}
          cppmetForecast={
            cppmetToday
              ? {
                  item: cppmetToday,
                  sourceUrl: cppmetForecast.source.url,
                }
              : null
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
            observation={embrapaObservation}
            laranjal={laranjalObservation}
            guaiba={guaibaObservation}
            lagoon={lagoonMonitoring}
          />
        </main>

        <SiteFooter source={weather.source} />
      </div>
    </>
  );
}
