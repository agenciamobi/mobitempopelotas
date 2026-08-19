import { Footer } from "@/components/layout/Footer";
import type { WeatherData } from "@/production/lib/weather-data";

import "./site-footer-home.css";

type SiteFooterProps = {
  source: WeatherData["source"];
};

/**
 * Compatibilidade para telas editoriais antigas.
 * Diretório, fontes, transparência e assinatura pertencem ao Footer global.
 */
export function SiteFooter({ source }: SiteFooterProps) {
  return <Footer source={source} />;
}
