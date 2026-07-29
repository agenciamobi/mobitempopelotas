import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import mapLibreCss from "maplibre-gl/dist/maplibre-gl.css?url";
import { useEffect, type ReactNode } from "react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SOCIAL_IMAGE_URL,
  absoluteUrl,
  createWebsiteJsonLd,
} from "@/lib/site-config";
import productionCss from "@/production/production-styles.css?url";
import appCss from "../styles.css?url";

const PWA_EMERGENCY_RESET_SCRIPT = `
(() => {
  const resetKey = "tempo-pelotas-pwa-reset-2026-07-28-v1";

  for (const element of [document.documentElement, document.body].filter(Boolean)) {
    element.style.removeProperty("overflow");
    element.style.removeProperty("overflow-y");
    element.style.removeProperty("position");
    element.style.removeProperty("top");
    element.style.removeProperty("width");
    element.style.removeProperty("touch-action");
  }

  if (window.sessionStorage.getItem(resetKey) === "done") return;
  window.sessionStorage.setItem(resetKey, "running");

  const resetPersistentAppState = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.allSettled(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
    } finally {
      window.sessionStorage.setItem(resetKey, "done");
      if (navigator.serviceWorker?.controller) window.location.reload();
    }
  };

  void resetPersistentAppState();
})();
`;

function NotFoundComponent() {
  return (
    <SiteLayout forceShell>
      <section className="status-page" aria-labelledby="not-found-title">
        <p className="status-kicker">Erro 404</p>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p>O endereço acessado não existe ou foi alterado.</p>
        <Link className="primary-link" to="/">
          Voltar para o início
        </Link>
      </section>
    </SiteLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <SiteLayout forceShell>
      <section className="status-page" aria-labelledby="error-title">
        <p className="status-kicker">Erro inesperado</p>
        <h1 id="error-title">Não foi possível carregar esta página</h1>
        <p>Ocorreu um erro inesperado. Tente novamente ou retorne para a página inicial.</p>
        <div className="status-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Tentar novamente
          </button>
          <Link className="secondary-link" to="/">
            Voltar para o início
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "application-name", content: SITE_NAME },
      { name: "color-scheme", content: "light" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:image", content: SOCIAL_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: SOCIAL_IMAGE_URL },
      { name: "theme-color", content: "#071e2f" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: mapLibreCss },
      { rel: "stylesheet", href: productionCss },
      {
        rel: "icon",
        href: "/brand/tempo-pelotas-icon.png",
        type: "image/png",
        sizes: "192x192",
      },
      { rel: "icon", href: "/brand/tempo-pelotas-icon.svg", type: "image/svg+xml" },
      {
        rel: "apple-touch-icon",
        href: "/brand/tempo-pelotas-icon.png",
        sizes: "192x192",
      },
      {
        rel: "alternate",
        type: "application/feed+json",
        href: absoluteUrl("/feed"),
        title: "Tempo Pelotas — feed JSON",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(createWebsiteJsonLd()),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: PWA_EMERGENCY_RESET_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </QueryClientProvider>
  );
}
