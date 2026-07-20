import { HomeEditorialDashboard } from "@/components/home-editorial-dashboard";
import { InmetAlertsPanel } from "@/components/inmet-alerts-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WeatherHero } from "@/components/weather-hero";
import { getGuaibaObservation } from "@/lib/guaiba-monitor";
import { getInmetAlerts } from "@/lib/inmet-alerts";
import { getLagoonMonitoringNetwork } from "@/lib/lagoon-monitoring-network";
import { getLaranjalLevelData } from "@/lib/laranjal-level";
import { absoluteUrl } from "@/lib/site";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/lib/weather-insights";
import { getPelotasWeatherWithObservation } from "@/lib/weather-service";

export const revalidate = 300;

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TEMPO Pelotas",
  url: absoluteUrl("/"),
  description:
    "Portal meteorológico e hidrológico local para preparação comunitária em Pelotas e na Zona Sul do Rio Grande do Sul.",
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
    guaibaObservation,
    lagoonMonitoring,
    laranjalObservation,
    inmetAlerts,
  ] = await Promise.all([
    getPelotasWeatherWithObservation(),
    getGuaibaObservation(),
    getLagoonMonitoringNetwork(),
    getLaranjalLevelData(),
    getInmetAlerts(),
  ]);
  const advisory = getWeatherAdvisory(weather);
  const pelotasOfficialAlerts = inmetAlerts.alerts.filter((alert) => alert.relevance === "pelotas");
  const officialLevel: AdvisoryLevel = pelotasOfficialAlerts.some(
    (alert) => alert.severity === "danger" || alert.severity === "great-danger",
  )
    ? "warning"
    : pelotasOfficialAlerts.some((alert) => alert.severity === "potential")
      ? "attention"
      : "normal";
  const headerLevel = advisoryRank[officialLevel] > advisoryRank[advisory.level]
    ? officialLevel
    : advisory.level;

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
        <WeatherHero weather={weather} />

        <main className="home-editorial-main" id="conteudo-principal" tabIndex={-1}>
          <InmetAlertsPanel data={inmetAlerts} variant="home" />
          <HomeEditorialDashboard
            weather={weather}
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
