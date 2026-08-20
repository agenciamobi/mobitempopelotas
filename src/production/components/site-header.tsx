"use client";

import { Header } from "@/components/layout/Header";
import { HomeEditorialHeader } from "@/production/components/home-editorial-header";
import type { InmetAlertSeverity } from "@/production/lib/inmet-alerts";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

type SiteHeaderProps = {
  advisoryLevel?: AdvisoryLevel;
  officialAlertSeverity?: InmetAlertSeverity;
  variant?: "default" | "hero";
};

/**
 * Mantém o header global nas páginas internas e usa uma composição editorial
 * mais compacta na Home, onde a informação meteorológica deve dominar a dobra.
 */
export function SiteHeader({
  advisoryLevel = "normal",
  officialAlertSeverity = "unknown",
  variant = "default",
}: SiteHeaderProps) {
  if (variant === "hero") {
    return (
      <HomeEditorialHeader
        advisoryLevel={advisoryLevel}
        officialAlertSeverity={officialAlertSeverity}
      />
    );
  }

  return <Header advisoryLevel={advisoryLevel} />;
}
