import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sem conexão",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card">
        <span className="offline-symbol" aria-hidden="true">☁</span>
        <span className="eyebrow">TEMPO Pelotas</span>
        <h1>Você está sem conexão</h1>
        <p>
          Algumas páginas já abertas continuam disponíveis. Para consultar medições e previsões
          atualizadas, reconecte o aparelho à internet.
        </p>
        <Link href="/">Tentar novamente</Link>
      </section>
    </main>
  );
}
