import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import "./accessibility.css";
import "./route-navigation.css";
import { Footer } from "./Footer";
import { Header } from "./Header";

type SiteLayoutProps = {
  children: ReactNode;
  forceShell?: boolean;
};

const standaloneRoutes = new Set([
  "/",
  "/tempo-hoje-pelotas",
  "/conta",
  "/entrar",
  "/minha-conta",
  "/privacidade-e-dados",
  "/embed/nivel-laranjal",
]);

function pageAnnouncement() {
  const title = document.title.split("|")[0]?.trim();
  return title ? `Página carregada: ${title}` : "Página carregada";
}

function topicKeyFromPath(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] ?? "geral";
}

function RouteNavigationProgress({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className={`route-navigation-progress${isLoading ? " is-visible" : ""}`}
      role="progressbar"
      aria-label="Carregando nova página"
      aria-hidden={!isLoading}
    >
      <span />
    </div>
  );
}

export function SiteLayout({ children, forceShell = false }: SiteLayoutProps) {
  const resolvedPathname = useRouterState({
    select: (state) => state.resolvedLocation?.pathname ?? state.location?.pathname ?? "/",
  });
  const isLoading = useRouterState({ select: (state) => Boolean(state.isLoading) });
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");
  const isTopicRoute = !forceShell && !standaloneRoutes.has(resolvedPathname);
  const topicKey = isTopicRoute ? topicKeyFromPath(resolvedPathname) : undefined;

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
  }, [resolvedPathname]);

  if (!forceShell && standaloneRoutes.has(resolvedPathname)) {
    return (
      <>
        <RouteNavigationProgress isLoading={isLoading} />
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
      data-route-loading={isLoading ? "true" : "false"}
    >
      <RouteNavigationProgress isLoading={isLoading} />
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <Header />
      <main
        ref={mainRef}
        id="conteudo-principal"
        className={isTopicRoute ? "site-main site-main--topic" : "site-main"}
        tabIndex={-1}
        aria-busy={isLoading}
      >
        <div className={isTopicRoute ? "site-container site-container--topic" : "site-container"}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
