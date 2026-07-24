"use client";

import { Header } from "@/components/layout/Header";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

type SiteHeaderProps = {
  advisoryLevel?: AdvisoryLevel;
  variant?: "default" | "hero";
};

/**
 * Compatibilidade para telas editoriais antigas.
 * O conteúdo e a navegação pertencem ao Header global.
 */
export function SiteHeader({ advisoryLevel = "normal" }: SiteHeaderProps) {
  return <Header advisoryLevel={advisoryLevel} />;
}
