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
import appCss from "../styles.css?url";

const siteTitle = "Tempo Pelotas | Previsão do tempo em Pelotas e região";
const siteDescription =
  "Previsão do tempo, condições atuais, chuva, vento e informações meteorológicas de Pelotas e da Zona Sul do Rio Grande do Sul.";
const socialImage =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3f08c889-e910-4b95-8e86-5c37fa31c1c8/id-preview-9ab27e4f--d63df7b2-45db-4890-823c-87629dab73a1.lovable.app-1784525496143.png";

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
      { title: siteTitle },
      { name: "description", content: siteDescription },
      { property: "og:title", content: siteTitle },
      { property: "og:description", content: siteDescription },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: socialImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: siteTitle },
      { name: "twitter:description", content: siteDescription },
      { name: "twitter:image", content: socialImage },
      { name: "theme-color", content: "#071e2f" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
