import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
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
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <SiteLayout>
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
    <SiteLayout>
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
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
      { rel: "icon", href: "/favicon.ico" },
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
