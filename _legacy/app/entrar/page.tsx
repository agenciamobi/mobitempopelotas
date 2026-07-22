import type { Metadata } from "next";
import Link from "next/link";
import { GoogleLoginCard } from "@/components/google-login-card";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta do TEMPO Pelotas com o Google.",
  robots: { index: false, follow: false },
};

export default function EntrarPage() {
  return (
    <main className="login-page" id="conteudo-principal">
      <Link className="login-page__brand" href="/" aria-label="Voltar ao TEMPO Pelotas">
        <img
          src="/brand/tempo-pelotas-header"
          alt="TEMPO Pelotas"
          width={11349}
          height={1552}
        />
      </Link>
      <GoogleLoginCard />
      <Link className="login-page__back" href="/">
        ← Voltar para a previsão
      </Link>
    </main>
  );
}
