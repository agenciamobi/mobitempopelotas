import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { AccountPage } from "@/components/auth/AccountPage";
import { getAccountSnapshot } from "@/lib/auth/account.functions";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";
import "@/production/production-styles";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: `Minha conta | ${SITE_NAME}` },
      {
        name: "description",
        content: "Gerencie sua identificação e preferências opcionais no Tempo Pelotas.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/minha-conta") }],
  }),
  loader: async () => {
    const snapshot = await getAccountSnapshot();
    if (snapshot.status === "unauthenticated") {
      throw redirect({ href: "/entrar?next=%2Fminha-conta" });
    }

    return snapshot;
  },
  component: MinhaContaPage,
});

function MinhaContaPage() {
  const snapshot = Route.useLoaderData();

  if (snapshot.status === "unavailable") {
    return (
      <main className="login-page" id="conteudo-principal">
        <Link className="login-page__brand" to="/" aria-label="Voltar ao Tempo Pelotas">
          <img src="/brand/tempo-pelotas-header" alt="Tempo Pelotas" width={11349} height={1552} />
        </Link>
        <section className="login-card" aria-labelledby="account-unavailable-title">
          <span className="eyebrow">Conta Tempo Pelotas</span>
          <h1 id="account-unavailable-title">
            A área de conta ainda não está ativa neste ambiente
          </h1>
          <p>
            A configuração do Supabase externo precisa ser concluída antes do login. A previsão, os
            alertas, as imagens meteorológicas e a situação das águas seguem disponíveis
            normalmente.
          </p>
        </section>
        <Link className="login-page__back" to="/">
          ← Voltar para a previsão
        </Link>
      </main>
    );
  }

  return <AccountPage snapshot={snapshot} />;
}
