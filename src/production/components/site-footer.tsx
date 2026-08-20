import { Footer } from "@/components/layout/Footer";
import type { WeatherData } from "@/production/lib/weather-data";

import "./site-footer-home.css";

type SiteFooterProps = {
  source?: WeatherData["source"];
};

/**
 * Footer público único do Tempo Pelotas.
 * Conteúdo, navegação, utilidade pública e geometria usam a variante editorial
 * da Home também nas páginas internas e institucionais.
 */
export function SiteFooter({ source }: SiteFooterProps) {
  return <Footer source={source} variant="home" />;
}
