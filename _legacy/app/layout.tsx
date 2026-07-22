import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaManager } from "@/components/pwa-manager";
import { siteUrl } from "@/lib/site";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "./topic-pages.css";
import "./home.css";
import "./home-hero-curve-fixes.css";
import "./home-hero-alert-states.css";
import "./map.css";
import "./radar-map.css";
import "./mobile-app.css";
import "./mobile-app-fixes.css";
import "./charts.css";
import "./history.css";
import "./cameras.css";
import "./lagoon-level.css";
import "./lagoon-layout-refinement.css";
import "./home-lagoon-card.css";
import "./hydrology.css";
import "./hydrology-monitor-grid.css";
import "./guaiba-card.css";
import "./guaiba-card-refinement.css";
import "./laranjal-level-card.css";
import "./embrapa-observation.css";
import "./footer.css";
import "./footer-resources.css";
import "./interface-fixes.css";
import "./pwa.css";
import "./mobile-width-guard.css";
import "./mobile-structure-refinement.css";
import "./mobile-special-sections.css";
import "./pwa-fullscreen-refinement.css";
import "./mobile-history-footer-refinement.css";
import "./brand-assets.css";
import "./home-hero-composition.css";
import "./home-location-and-level.css";
import "./mobile-usability-refinement.css";
import "./mobile-interaction-fixes.css";
import "./theme-refinement.css";
import "./home-first-fold-refinement.css";
import "./home-flow-footer-refinement.css";
import "./theme-polish.css";
import "./topic-theme-polish.css";
import "./footer-theme-v2.css";
import "./footer-shell-v2.css";
import "./brand-palette-theme.css";
import "./guaiba-city-directory.css";
import "./lagoon-monitoring-network.css";
import "./lagoon-monitoring-api.css";
import "./hydrology-page-reorganization.css";
import "./home-page-reorganization.css";
import "./project-refinement.css";
import "./home-editorial-theme.css";
import "./home-editorial-refinement-v2.css";
import "./home-editorial-responsive-fix.css";
import "./home-first-fold-editorial-light.css";
import "./home-first-fold-editorial-light-refinement.css";
import "./home-first-fold-editorial-light-v2.css";
import "./home-first-fold-editorial-light-v2-responsive.css";
import "./inmet-alerts.css";
import "./home-editorial-alignment-readable.css";
import "./editorial-readable-final.css";
import "./editorial-readable-v2.css";
import "./home-editorial-clarity-v3.css";
import "./home-visitor-copy-v4.css";
import "./home-journey-refinement-v5.css";
import "./home-grid-alignment-v6.css";
import "./topic-editorial-home-visual.css";
import "./topic-special-pages-refinement.css";
import "./topic-special-pages-mobile-fix.css";
import "./topic-weather-pages-refinement.css";
import "./home-first-fold-operational-v3.css";
// Camadas finais de interface e publicação da experiência editorial.
import "./header-template-refinement.css";
import "./header-template-refinement-v2.css";
import "./home-hero-stripe-adaptation.css";
import "./home-alert-flow-v7.css";
import "./home-forecast-refinement-v8.css";
import "./home-alert-flow-v9.css";
import "./home-detail-navigation-v10.css";
import "./home-detail-content-v10.css";
import "./home-cohesion-v12.css";
import "./home-cohesion-v12-content.css";
import "./home-cohesion-v12-water.css";
import "./home-navigation-v13.css";
import "./home-next-days-cards-v14.css";
import "./home-hero-cleanup-v16.css";
import "./home-observation-refinement-v17.css";
import "./home-water-refinement-v18.css";
import "./home-explore-refinement-v19.css";
import "./home-final-cohesion-v20.css";
import "./home-operational-bridge-v21.css";
import "./home-operational-bridge-v21-fix.css";
import "./weather-ai-summary.css";
import "./integrations-v22.css";
import "./account-v24.css";
import "./footer-editorial-v23.css";
import "./footer-production-cleanup.css";
import "./water-level-semantic-colors.css";
import "./home-cppmet-layout-water-audit.css";
import "./home-cppmet-final-fixes.css";
import "./safety-alerts.css";
import "./header-megamenu-v25.css";
import "./home-tomorrow-focus-v25.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TEMPO Pelotas | Tempo e situação das águas em Pelotas, RS",
    template: "%s | TEMPO Pelotas",
  },
  description:
    "Veja a previsão do tempo, chuva, vento, radar, nível da Lagoa dos Patos e informações para ajudar a comunidade de Pelotas a se preparar.",
  applicationName: "TEMPO Pelotas",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tempo Pelotas",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/brand/tempo-pelotas-icon",
        sizes: "any",
        type: "image/svg+xml",
      },
      { url: "/pwa-icons/192", sizes: "192x192", type: "image/png" },
    ],
    shortcut: {
      url: "/brand/tempo-pelotas-icon",
      type: "image/svg+xml",
    },
    apple: [
      { url: "/pwa-icons/192", sizes: "192x192", type: "image/png" },
    ],
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "TEMPO Pelotas",
    title: "TEMPO Pelotas | Tempo e situação das águas em Pelotas, RS",
    description:
      "Previsão do tempo, chuva, vento, radar e nível da Lagoa dos Patos para Pelotas, RS.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TEMPO Pelotas",
    description: "Tempo e situação das águas em Pelotas, RS.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f9f7",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaManager />
      </body>
    </html>
  );
}
