import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import "./accessibility.css";
import { Footer } from "./Footer";
import { Header } from "./Header";

type SiteLayoutProps = {
  children: ReactNode;
  forceShell?: boolean;
};

const standaloneRoutes = new Set(["/", "/entrar", "/minha-conta", "/privacidade-e-dados"]);

function pageAnnouncement() {
  const title = document.title.split("|")[0]?.trim();
  return title ? `Página carregada: ${title}` : "Página carregada";
}

function topicKeyFromPath(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] ?? "geral";
}

export function SiteLayout({ children, forceShell = false }: SiteLayoutProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");
  const isTopicRoute = !forceShell && !standaloneRoutes.has(pathname);
  const topicKey = isTopicRoute ? topicKeyFromPath(pathname) : undefined;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const routeMain = mainRef.current ?? document.getElementById("conteudo-principal");

      if (routeMain && !routeMain.hasAttribute("tabindex")) {
        routeMain.tabIndex = -1;
      }

      routeMain?.focus({ preventScroll: true });
      setAnnouncement(pageAnnouncement());
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  if (!forceShell && standaloneRoutes.has(pathname)) {
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
    <div
      className={isTopicRoute ? "site-shell site-shell--topic" : "site-shell"}
      data-topic={topicKey}
    >
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <Header />
      <main
        ref={mainRef}
        id="conteudo-principal"
        className={isTopicRoute ? "site-main site-main--topic" : "site-main"}
        tabIndex={-1}
      >
        <div className={isTopicRoute ? "site-container site-container--topic" : "site-container"}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
