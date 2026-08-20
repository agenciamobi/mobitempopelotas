"use client";

import { HomeEditorialHeader } from "@/production/components/home-editorial-header";
import type { InmetAlertSeverity } from "@/production/lib/inmet-alerts";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

type SiteHeaderProps = {
  advisoryLevel?: AdvisoryLevel;
  officialAlertSeverity?: InmetAlertSeverity;
  variant?: "default" | "hero";
};

/**
 * Header público único do Tempo Pelotas.
 *
 * A Home passou a ser a fonte visual do cabeçalho do portal; páginas internas,
 * dedicadas e institucionais reutilizam exatamente a mesma composição para
 * evitar duas identidades de navegação concorrentes. `variant` é preservado
 * apenas por compatibilidade com chamadas existentes.
 */
export function SiteHeader({
  advisoryLevel = "normal",
  officialAlertSeverity = "unknown",
}: SiteHeaderProps) {
  return (
    <HomeEditorialHeader
      advisoryLevel={advisoryLevel}
      officialAlertSeverity={officialAlertSeverity}
    />
  );
}
