import { createFileRoute, Link } from "@tanstack/react-router";

import { AccountPage } from "@/components/auth/AccountPage";
import { GoogleLoginCard } from "@/components/auth/GoogleLoginCard";
import { getAccountSnapshot } from "@/lib/auth/account.functions";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";

function validateSearch(search: Record<string, unknown>) {
  return {
    erro: typeof search.erro === "string" ? search.erro : undefined,
  };
}

export const Route = createFileRoute("/conta")({
  validateSearch,
  head: () => ({
    meta: [
      { title: `Conta | ${SITE_NAME}` },
      {
        name: "description",
        content: "Acesse sua conta do Tempo Pelotas e gerencie preferências opcionais.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/conta") }],
  }),
  loader: () => getAccountSnapshot(),
  component: ContaPage,
});

function AccountUnavailable() {
  return (
    <main className="login-page" id="conteudo-principal">
      <Link className="login-page__brand" to="/" aria-label="Voltar ao Tempo Pelotas">
        <img
          src="/brand/tempo-pelotas-header.svg"
          alt="Tempo Pelotas"
          width={11349}
          height={1552}
        />
      </Link>
      <section className="login-card" aria-labelledby="account-unavailable-title">
        <span className="eyebrow">Conta Tempo Pelotas</span>
        <h1 id="account-unavailable-title">A área de conta ainda não está ativa neste ambiente</h1>
        <p>
          A configuração do Supabase externo precisa ser concluída antes do login. A previsão, os
          alertas, as imagens meteorológicas e a situação das águas seguem disponíveis normalmente.
        </p>
      </section>
      <Link className="login-page__back" to="/">
        ← Voltar para a previsão
      </Link>
    </main>
  );
}

function VisitorLogin({ errorCode }: { errorCode?: string }) {
  return (
    <main className="login-page" id="conteudo-principal">
      <Link className="login-page__brand" to="/" aria-label="Voltar ao Tempo Pelotas">
        <img
          src="/brand/tempo-pelotas-header.svg"
          alt="Tempo Pelotas"
          width={11349}
          height={1552}
        />
      </Link>
      <GoogleLoginCard nextPath="/conta" errorCode={errorCode} />
      <Link className="login-page__back" to="/">
        ← Voltar para a previsão
      </Link>
    </main>
  );
}

function ContaPage() {
  const snapshot = Route.useLoaderData();
  const search = Route.useSearch();

  if (snapshot.status === "unavailable") return <AccountUnavailable />;
  if (snapshot.status === "unauthenticated") return <VisitorLogin errorCode={search.erro} />;

  return <AccountPage snapshot={snapshot} />;
}
