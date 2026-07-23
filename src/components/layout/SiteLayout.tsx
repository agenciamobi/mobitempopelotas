import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import "./accessibility.css";
import { Footer } from "./Footer";
import { Header } from "./Header";

type SiteLayoutProps = {
  children: ReactNode;
};

function pageAnnouncement() {
  const title = document.title.split("|")[0]?.trim();
  return title ? `Página carregada: ${title}` : "Página carregada";
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true });
      setAnnouncement(pageAnnouncement());
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  if (pathname === "/") {
    return (
      <>
        <div className="visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="site-shell">
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <Header />
      <main ref={mainRef} id="conteudo-principal" className="site-main" tabIndex={-1}>
        <div className="site-container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
