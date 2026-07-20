import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

type SiteLayoutProps = {
  children: ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="site-shell">
      <Header />
      <main id="conteudo-principal" className="site-main" tabIndex={-1}>
        <div className="site-container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
