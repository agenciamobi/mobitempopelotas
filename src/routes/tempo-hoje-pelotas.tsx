import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { TodayForecastPageV4 } from "@/components/weather/TodayForecastPageV4";
import "@/components/weather/TodayForecastPageV4Refinement.css";
import "@/components/weather/TodayForecastPageV4WidthRefinement.css";
import { TODAY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { toProductionAlerts, toProductionWeatherData } from "@/production/adapters/home";
import {
  hasVerifiedInmetAlertSemantics,
} from "@/production/components/inmet-alerts-panel";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import { WeatherHero } from "@/production/components/weather-hero";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";

const PAGE_TITLE = "Tempo hoje em Pelotas";
const PAGE_DESCRIPTION =
  "Condições atuais e previsão por hora para hoje em Pelotas, com chuva, vento, temperatura e alertas oficiais.";
const PAGE_PATH = "/tempo-hoje-pelotas";
const advisoryRank: Record<AdvisoryLevel, number> = { normal: 0, attention: 1, warning: 2 };

export const Route = createFileRoute("/tempo-hoje-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Tempo hoje em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão do tempo",
          "Condições meteorológicas em Pelotas",
          "Temperatura atual em Pelotas",
          "Previsão por hora em Pelotas",
          "Medição meteorológica da Embrapa em Pelotas",
          "Alertas meteorológicos do INMET em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, TODAY_EDITORIAL_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoHojePage,
});

function TempoHojePage() {
  const weather = Route.useLoaderData();
  return <TempoHojeHomeVisual data={weather} />;
}

function TempoHojeHomeVisual({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const productionWeather = toProductionWeatherData(recoveredData.weather);
  const inmetAlerts = toProductionAlerts(recoveredData.weather);
  const advisory = getWeatherAdvisory(productionWeather);
  const pelotasOfficialAlerts = inmetAlerts.alerts.filter((alert) => alert.relevance === "pelotas");
  const verifiedPelotasAlerts = pelotasOfficialAlerts.filter(hasVerifiedInmetAlertSemantics);
  const officialLevel: AdvisoryLevel = verifiedPelotasAlerts.some(
    (alert) => alert.severity === "danger" || alert.severity === "great-danger",
  )
    ? "warning"
    : verifiedPelotasAlerts.some((alert) => alert.severity === "potential")
      ? "attention"
      : "normal";
  const headerLevel =
    advisoryRank[officialLevel] > advisoryRank[advisory.level] ? officialLevel : advisory.level;
  const mainClassName = pelotasOfficialAlerts.length
    ? "home-editorial-main today-v4-home-main has-official-alerts"
    : "home-editorial-main today-v4-home-main";

  return (
    <div className="site-shell site-shell--home site-shell--home-editorial today-v4-home-shell">
      <SiteHeader advisoryLevel={headerLevel} variant="hero" />
      <WeatherHero
        weather={productionWeather}
        advisoryLevel={headerLevel}
        officialAlertCount={pelotasOfficialAlerts.length}
      />

      <main className={mainClassName} id="conteudo-principal" tabIndex={-1}>
        <TodayForecastPageV4 data={data} />
        <EditorialContentSection id="como-interpretar-hoje" content={TODAY_EDITORIAL_CONTENT} />
      </main>

      <SiteFooter source={productionWeather.source} />
    </div>
  );
}
