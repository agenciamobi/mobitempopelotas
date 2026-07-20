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
    siteName: "TEMPO Pelotas",
    title: "TEMPO Pelotas | Tempo, águas e segurança",
    description:
      "Acompanhe o tempo e a situação das águas em Pelotas e na Zona Sul do Rio Grande do Sul.",
    url: "/",
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
      "max-image-preview": "large",
      "max-snippet": -1,
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
