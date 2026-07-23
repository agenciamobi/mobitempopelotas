import { createFileRoute, Link } from "@tanstack/react-router";

import { GoogleLoginCard } from "@/components/auth/GoogleLoginCard";
import { safeNextPath } from "@/lib/auth/paths";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";
import "@/production/production-styles";

function validateSearch(search: Record<string, unknown>) {
  return {
    next: typeof search.next === "string" ? search.next : undefined,
    erro: typeof search.erro === "string" ? search.erro : undefined,
  };
}

export const Route = createFileRoute("/entrar")({
  validateSearch,
  head: () => ({
    meta: [
      { title: `Entrar | ${SITE_NAME}` },
      {
        name: "description",
        content: "Acesse sua conta do Tempo Pelotas para gerenciar preferências opcionais.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/entrar") }],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const search = Route.useSearch();
  const nextPath = safeNextPath(search.next, "/minha-conta");

  return (
    <main className="login-page" id="conteudo-principal">
      <Link className="login-page__brand" to="/" aria-label="Voltar ao Tempo Pelotas">
        <img src="/brand/tempo-pelotas-header" alt="Tempo Pelotas" width={11349} height={1552} />
      </Link>
      <GoogleLoginCard nextPath={nextPath} errorCode={search.erro} />
      <Link className="login-page__back" to="/">
        ← Voltar para a previsão
      </Link>
    </main>
  );
}
