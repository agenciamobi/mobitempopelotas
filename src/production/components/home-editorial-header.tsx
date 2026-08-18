"use client";

import { Link, useRouterState } from "@tanstack/react-router";

import { AuthAccountAction } from "@/components/auth/AuthAccountAction";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

const homeNavigation = [
  { label: "Agora", to: "/", ariaLabel: "Ver o tempo agora em Pelotas" },
  { label: "Hoje", to: "/tempo-hoje-pelotas", ariaLabel: "Ver a previsão do tempo para hoje em Pelotas" },
  { label: "7 dias", to: "/previsao-7-dias-pelotas", ariaLabel: "Ver a previsão do tempo para os próximos sete dias em Pelotas" },
  { label: "Chuva", to: "/chuva-em-pelotas", ariaLabel: "Ver a previsão de chuva em Pelotas" },
  { label: "Vento", to: "/vento-em-pelotas", ariaLabel: "Ver vento e rajadas em Pelotas" },
  { label: "Lagoa", to: "/nivel-da-lagoa-dos-patos-laranjal", ariaLabel: "Ver o nível da Lagoa dos Patos no Laranjal" },
  { label: "Radar", to: "/radar-e-satelite-pelotas", ariaLabel: "Ver radar e satélite para Pelotas e região" },
  { label: "Câmeras", to: "/cameras-ao-vivo-pelotas", ariaLabel: "Ver câmeras ao vivo de Pelotas" },
] as const;

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function alertLabel(level: AdvisoryLevel) {
  if (level === "warning") return "Alerta ativo";
  if (level === "attention") return "Atenção";
  return "Avisos";
}

export function HomeEditorialHeader({ advisoryLevel = "normal" }: { advisoryLevel?: AdvisoryLevel }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const alertsActive = isActivePath(pathname, "/alertas");

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>
      <header className="home-editorial-header" data-advisory-level={advisoryLevel}>
        <div className="home-editorial-header__inner">
          <Link className="home-editorial-header__brand" to="/" aria-label="Tempo Pelotas — página inicial">
            <img
              src="/brand/tempo-pelotas-purple.svg"
              alt="Tempo Pelotas"
              width={344}
              height={50}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          </Link>

          <nav className="home-editorial-header__nav" aria-label="Navegação principal do Tempo Pelotas">
            {homeNavigation.map((item) => {
              const active = isActivePath(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active ? "is-active" : undefined}
                  aria-label={item.ariaLabel}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="home-editorial-header__actions">
            <AuthAccountAction />
            <Link
              className={`home-editorial-header__alert is-${advisoryLevel}${alertsActive ? " is-active" : ""}`}
              to="/alertas"
              aria-label="Consultar avisos meteorológicos oficiais para Pelotas"
              aria-current={alertsActive ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 3.6 19h16.8L12 3Z" />
                <path d="M12 9v4.5M12 17h.01" />
              </svg>
              <span>{alertLabel(advisoryLevel)}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
