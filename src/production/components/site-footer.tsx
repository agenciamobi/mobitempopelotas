import { Footer } from "@/components/layout/Footer";
import type { WeatherData } from "@/production/lib/weather-data";

import "./site-footer-home.css";

type SiteFooterProps = {
  source: WeatherData["source"];
};

/**
 * Footer da Home com namespace próprio. Conteúdo, navegação e fontes continuam
 * compartilhados com o Footer global; somente a camada visual é isolada.
 */
export function SiteFooter({ source }: SiteFooterProps) {
  return <Footer source={source} variant="home" />;
}
