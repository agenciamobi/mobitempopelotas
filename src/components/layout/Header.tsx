import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import "./Header.css";

type MenuId = "forecast" | "monitoring" | "water";

const megaMenus = [
  {
    id: "forecast",
    label: "Previsão",
    activePaths: [
      "/",
      "/tempo-hoje-pelotas",
      "/tempo-amanha-pelotas",
      "/previsao-7-dias-pelotas",
      "/chuva-em-pelotas",
      "/vento-em-pelotas",
    ],
    featured: {
      eyebrow: "Tempo agora",
      label: "Condições atuais em Pelotas",
      to: "/",
      description: "Temperatura, chuva, vento e evolução das próximas horas.",
    },
    sections: [
      {
        title: "Planeje o dia",
        links: [
          {
            label: "Previsão de hoje",
            to: "/tempo-hoje-pelotas",
            description: "Detalhes por hora e condições do dia.",
          },
          {
            label: "Tempo amanhã",
            to: "/tempo-amanha-pelotas",
            description: "Chuva, temperaturas e rajadas do próximo dia.",
          },
          {
            label: "Próximos 7 dias",
            to: "/previsao-7-dias-pelotas",
            description: "Tendência completa para a semana.",
          },
        ],
      },
      {
        title: "Entenda a previsão",
        links: [
          {
            label: "Chuva em Pelotas",
            to: "/chuva-em-pelotas",
            description: "Probabilidade, volume e períodos mais críticos.",
          },
          {
            label: "Vento e rajadas",
            to: "/vento-em-pelotas",
            description: "Direção, velocidade e rajadas previstas.",
          },
          {
            label: "Histórico climático",
            to: "/historico-climatico-pelotas",
            description: "Contexto e comportamento recente do tempo.",
          },
        ],
      },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoramento",
    activePaths: [
      "/estacao-embrapa-pelotas",
      "/historico-climatico-pelotas",
      "/cameras-ao-vivo-pelotas",
      "/metodologia",
    ],
    featured: {
      eyebrow: "Observação local",
      label: "Câmeras e medições da região",
      to: "/cameras-ao-vivo-pelotas",
      description: "Acompanhe céu, visibilidade e dados registrados em Pelotas.",
    },
    sections: [
      {
        title: "Medições locais",
        links: [
          {
            label: "Estação Embrapa",
            to: "/estacao-embrapa-pelotas",
            description: "Dados observados na estação de Pelotas.",
          },
          {
            label: "Câmeras ao vivo",
            to: "/cameras-ao-vivo-pelotas",
            description: "Imagens locais e estado da transmissão.",
          },
        ],
      },
      {
        title: "Histórico e transparência",
        links: [
          {
            label: "Histórico climático",
            to: "/historico-climatico-pelotas",
            description: "Compare temperatura, chuva e vento recentes.",
          },
          {
            label: "Fontes e metodologia",
            to: "/metodologia",
            description: "Origem, limites e atualização dos dados.",
          },
        ],
      },
    ],
  },
  {
    id: "water",
    label: "Águas",
    activePaths: ["/situacao-hidrologica-pelotas", "/nivel-da-lagoa-dos-patos-laranjal"],
    featured: {
      eyebrow: "Lagoa dos Patos",
      label: "Nível da água no Laranjal",
      to: "/nivel-da-lagoa-dos-patos-laranjal",
      description: "Leitura local, tendência recente e contexto para a Praia do Laranjal.",
    },
    sections: [
      {
        title: "Acompanhamento hídrico",
        links: [
          {
            label: "Situação das águas",
            to: "/situacao-hidrologica-pelotas",
            description: "Laranjal e estações da Lagoa dos Patos.",
          },
          {
            label: "Nível no Laranjal",
            to: "/nivel-da-lagoa-dos-patos-laranjal",
            description: "Medição, tendência e última leitura conhecida.",
          },
        ],
      },
      {
        title: "Segurança e contexto",
        links: [
          {
            label: "Avisos oficiais",
            to: "/alertas",
            description: "Alertas meteorológicos vigentes para Pelotas.",
          },
          {
            label: "Como os dados são usados",
            to: "/metodologia",
            description: "Critérios, fontes e limitações das leituras.",
          },
        ],
      },
    ],
  },
] as const;

const mobileNavigation = [
  { label: "Agora", to: "/", icon: "⌂" },
  { label: "Hoje", to: "/tempo-hoje-pelotas", icon: "☀" },
  { label: "7 dias", to: "/previsao-7-dias-pelotas", icon: "▦" },
  { label: "Águas", to: "/situacao-hidrologica-pelotas", icon: "≈" },
  { label: "Alertas", to: "/alertas", icon: "!" },
] as const;

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const headerRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const alertsActive = isActivePath(pathname, "/alertas");
  const camerasActive = isActivePath(pathname, "/cameras-ao-vivo-pelotas");

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <header ref={headerRef} className="site-header production-header">
        <div className="production-header-inner">
          <div className="production-branding">
            <Link className="production-brand" to="/" aria-label="Tempo Pelotas — página inicial">
              <span className="production-brand-wordmark">
                <strong>TEMPO</strong>
                <em>Pelotas</em>
              </span>
            </Link>
            <span className="production-brand-divider" aria-hidden="true" />
            <span className="production-brand-context">
              <strong>Pelotas, RS</strong>
              <small>Tempo e águas</small>
            </span>
          </div>

          <nav className="mega-navigation" aria-label="Navegação principal">
            {megaMenus.map((menu) => {
              const isOpen = openMenu === menu.id;
              const isActive = menu.activePaths.some((path) => isActivePath(pathname, path));

              return (
                <div
                  className={`mega-navigation-item${isOpen ? " is-open" : ""}`}
                  key={menu.id}
                  onMouseEnter={() => setOpenMenu(menu.id)}
                  onMouseLeave={() =>
                    setOpenMenu((current) => (current === menu.id ? null : current))
                  }
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setOpenMenu((current) => (current === menu.id ? null : current));
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Escape") return;
                    event.preventDefault();
                    setOpenMenu(null);
                    event.currentTarget.querySelector<HTMLElement>("button")?.focus();
                  }}
                >
                  <button
                    className={`mega-navigation-trigger${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`mega-menu-${menu.id}`}
                    onClick={() =>
                      setOpenMenu((current) => (current === menu.id ? null : menu.id))
                    }
                    onFocus={() => setOpenMenu(menu.id)}
                  >
                    <span>{menu.label}</span>
                    <svg viewBox="0 0 12 8" aria-hidden="true">
                      <path d="m1.5 1.5 4.5 4 4.5-4" />
                    </svg>
                  </button>

                  <div
                    className="mega-navigation-panel"
                    id={`mega-menu-${menu.id}`}
                    aria-hidden={!isOpen}
                  >
                    <div className="mega-navigation-surface">
                      <Link
                        className={`mega-navigation-feature is-${menu.id}`}
                        to={menu.featured.to}
                      >
                        <small>{menu.featured.eyebrow}</small>
                        <strong>{menu.featured.label}</strong>
                        <span>{menu.featured.description}</span>
                        <b>
                          Explorar <i aria-hidden="true">→</i>
                        </b>
                      </Link>

                      <div className="mega-navigation-columns">
                        {menu.sections.map((section) => (
                          <section key={section.title}>
                            <h2>{section.title}</h2>
                            <div>
                              {section.links.map((link) => (
                                <Link to={link.to} key={link.to}>
                                  <span aria-hidden="true" />
                                  <strong>{link.label}</strong>
                                  <small>{link.description}</small>
                                </Link>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="production-header-actions">
            <Link
              className={`production-camera-link${camerasActive ? " is-active" : ""}`}
              to="/cameras-ao-vivo-pelotas"
              aria-current={camerasActive ? "page" : undefined}
            >
              Câmeras ao vivo
            </Link>
            <Link
              className={`production-alert-link${alertsActive ? " is-active" : ""}`}
              to="/alertas"
              aria-current={alertsActive ? "page" : undefined}
            >
              <span className="production-alert-icon" aria-hidden="true">
                !
              </span>
              <span>
                <small>Avisos oficiais</small>
                <strong>Consultar</strong>
              </span>
              <i aria-hidden="true">→</i>
            </Link>
          </div>
        </div>
      </header>

      <nav className="production-mobile-navigation" aria-label="Navegação principal no celular">
        {mobileNavigation.map((item) => {
          const active = isActivePath(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <small>{item.label}</small>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
