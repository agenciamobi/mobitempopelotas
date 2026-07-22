"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AdvisoryLevel } from "@/lib/weather-insights";

type NavigationIconName = "home" | "today" | "week" | "rain" | "water" | "alert";

type NavigationItem = {
  label: string;
  href: string;
  icon: NavigationIconName;
};

type MegaMenuLink = {
  label: string;
  href: string;
  description: string;
};

type MegaMenuDefinition = {
  id: "forecast" | "monitoring" | "water";
  label: string;
  activePaths: string[];
  featured: MegaMenuLink & { eyebrow: string };
  sections: Array<{
    title: string;
    links: MegaMenuLink[];
  }>;
};

type SiteHeaderProps = {
  advisoryLevel?: AdvisoryLevel;
  variant?: "default" | "hero";
};

type AlertActionCopy = {
  eyebrow: string;
  label: string;
  ariaLabel: string;
};

const megaMenus: MegaMenuDefinition[] = [
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
      "/clima-em-pelotas",
    ],
    featured: {
      eyebrow: "Tempo agora",
      label: "Condições atuais em Pelotas",
      href: "/",
      description:
        "Temperatura, sensação, chuva, vento e a evolução das próximas horas.",
    },
    sections: [
      {
        title: "Planeje o dia",
        links: [
          {
            label: "Previsão de hoje",
            href: "/tempo-hoje-pelotas",
            description: "Detalhes por hora e condições do dia.",
          },
          {
            label: "Tempo amanhã",
            href: "/tempo-amanha-pelotas",
            description: "Chuva, temperaturas e rajadas do próximo dia.",
          },
          {
            label: "Próximos 7 dias",
            href: "/previsao-7-dias-pelotas",
            description: "Tendência completa para a semana.",
          },
        ],
      },
      {
        title: "Entenda a previsão",
        links: [
          {
            label: "Chuva em Pelotas",
            href: "/chuva-em-pelotas",
            description: "Probabilidade, volume e horários mais críticos.",
          },
          {
            label: "Vento e rajadas",
            href: "/vento-em-pelotas",
            description: "Direção, velocidade e rajadas previstas.",
          },
          {
            label: "Clima de Pelotas",
            href: "/clima-em-pelotas",
            description: "Contexto climático e características locais.",
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
      "/metodologia",
    ],
    featured: {
      eyebrow: "Imagens oficiais",
      label: "Radar e satélite da região",
      href: "/#regiao",
      description:
        "Acompanhe chuva, nuvens e trovoadas com os produtos integrados ao portal.",
    },
    sections: [
      {
        title: "Medições locais",
        links: [
          {
            label: "Estação Embrapa",
            href: "/estacao-embrapa-pelotas",
            description: "Dados observados na estação de Pelotas.",
          },
          {
            label: "Câmeras ao vivo",
            href: "/cameras-ao-vivo-pelotas",
            description: "Observe céu, visibilidade e condições locais.",
          },
        ],
      },
      {
        title: "Histórico e transparência",
        links: [
          {
            label: "Histórico climático",
            href: "/historico-climatico-pelotas",
            description: "Compare temperatura, chuva e vento recentes.",
          },
          {
            label: "Fontes e metodologia",
            href: "/metodologia",
            description: "Saiba de onde vêm os dados do portal.",
          },
        ],
      },
    ],
  },
  {
    id: "water",
    label: "Águas",
    activePaths: [
      "/situacao-hidrologica-pelotas",
      "/nivel-da-lagoa-dos-patos-laranjal",
    ],
    featured: {
      eyebrow: "Lagoa dos Patos",
      label: "Nível da água no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal",
      description:
        "Leitura local, tendência recente e contexto para a Praia do Laranjal.",
    },
    sections: [
      {
        title: "Acompanhamento hídrico",
        links: [
          {
            label: "Situação das águas",
            href: "/situacao-hidrologica-pelotas",
            description: "Lagoa, Guaíba e estações da região.",
          },
          {
            label: "Nível no Laranjal",
            href: "/nivel-da-lagoa-dos-patos-laranjal",
            description: "Medição e tendência no ponto local.",
          },
        ],
      },
      {
        title: "Segurança e contexto",
        links: [
          {
            label: "Avisos oficiais",
            href: "/alertas",
            description: "Consulte alertas meteorológicos vigentes.",
          },
          {
            label: "Como os dados são usados",
            href: "/metodologia",
            description: "Limites, fontes e atualização das leituras.",
          },
        ],
      },
    ],
  },
];

const mobileNavItems: NavigationItem[] = [
  { label: "Agora", href: "/", icon: "home" },
  { label: "Hoje", href: "/tempo-hoje-pelotas", icon: "today" },
  { label: "7 dias", href: "/previsao-7-dias-pelotas", icon: "week" },
  { label: "Águas", href: "/situacao-hidrologica-pelotas", icon: "water" },
  { label: "Alertas", href: "/alertas", icon: "alert" },
];

const alertActionCopy: Record<AdvisoryLevel, AlertActionCopy> = {
  normal: {
    eyebrow: "Avisos oficiais",
    label: "Consultar",
    ariaLabel: "Consultar avisos meteorológicos para Pelotas",
  },
  attention: {
    eyebrow: "Atenção prevista",
    label: "Ver alertas",
    ariaLabel: "Ver alertas e condições de atenção para Pelotas",
  },
  warning: {
    eyebrow: "Risco elevado",
    label: "Ver alertas",
    ariaLabel: "Ver alertas meteorológicos e orientações para Pelotas",
  },
};

function NavigationIcon({ name }: { name: NavigationIconName }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3.5 10.5 8.5-7 8.5 7v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-9Z" />
        <path d="M9 21v-7h6v7" />
      </svg>
    );
  }

  if (name === "today") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6" />
      </svg>
    );
  }

  if (name === "week") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2M14.5 17.5h2" />
      </svg>
    );
  }

  if (name === "rain") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 15.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.4 1.7 3.2 3.2 0 0 0-.1 6.3Z" />
        <path d="m8 18-1 2M12 18l-1 2M16 18l-1 2" />
      </svg>
    );
  }

  if (name === "water") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 15.5c2.2 0 2.2-1.5 4.4-1.5s2.2 1.5 4.4 1.5 2.2-1.5 4.4-1.5 2.2 1.5 4.8 1.5" />
        <path d="M3 19c2.2 0 2.2-1.5 4.4-1.5S9.6 19 11.8 19s2.2-1.5 4.4-1.5S18.4 19 21 19" />
        <path d="M12 4.5c2.1 2.5 3.4 4.2 3.4 6a3.4 3.4 0 0 1-6.8 0c0-1.8 1.3-3.5 3.4-6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2.8 19h18.4L12 3Z" />
      <path d="M12 9v4.8M12 17.2v.1" />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === href;

  if (href === "/situacao-hidrologica-pelotas") {
    return (
      pathname.startsWith(href) ||
      pathname.startsWith("/nivel-da-lagoa-dos-patos-laranjal")
    );
  }

  return pathname.startsWith(href);
}

function isMenuActive(pathname: string, menu: MegaMenuDefinition) {
  return menu.activePaths.some((path) => isActivePath(pathname, path));
}

export function SiteHeader({
  advisoryLevel = "normal",
  variant = "default",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<MegaMenuDefinition["id"] | null>(null);
  const alertsActive = isActivePath(pathname, "/alertas");
  const camerasActive = isActivePath(pathname, "/cameras-ao-vivo-pelotas");
  const headerClassName = `site-header${variant === "hero" ? " site-header--hero" : ""}`;
  const actionCopy = alertActionCopy[advisoryLevel];

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <header
        ref={headerRef}
        className={headerClassName}
        data-advisory-level={advisoryLevel}
      >
        <div className="site-header-branding">
          <Link className="brand" href="/" aria-label="TEMPO Pelotas — página inicial">
            <img
              className="brand-logo"
              src="/brand/tempo-pelotas-header"
              alt=""
              width={11349}
              height={1552}
              draggable={false}
            />
          </Link>
          <span className="site-header-brand-divider" aria-hidden="true" />
          <span className="site-header-context">
            <strong>Pelotas, RS</strong>
            <small>Tempo e águas</small>
          </span>
        </div>

        <nav className="main-nav main-nav--mega" aria-label="Navegação principal">
          {megaMenus.map((menu) => {
            const isOpen = openMenu === menu.id;
            const isActive = isMenuActive(pathname, menu);

            return (
              <div
                className={`mega-nav-item mega-nav-item--${menu.id}${isOpen ? " is-open" : ""}`}
                key={menu.id}
                onMouseEnter={() => setOpenMenu(menu.id)}
                onMouseLeave={() =>
                  setOpenMenu((current) => (current === menu.id ? null : current))
                }
                onBlur={(event) => {
                  const nextTarget = event.relatedTarget as Node | null;
                  if (!event.currentTarget.contains(nextTarget)) {
                    setOpenMenu((current) =>
                      current === menu.id ? null : current,
                    );
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  event.preventDefault();
                  setOpenMenu(null);
                  event.currentTarget
                    .querySelector<HTMLElement>(".mega-nav-trigger")
                    ?.focus();
                }}
              >
                <button
                  className={`mega-nav-trigger${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`mega-menu-${menu.id}`}
                  onClick={() =>
                    setOpenMenu((current) =>
                      current === menu.id ? null : menu.id,
                    )
                  }
                  onFocus={() => setOpenMenu(menu.id)}
                >
                  <span>{menu.label}</span>
                  <svg viewBox="0 0 12 8" aria-hidden="true">
                    <path d="m1.5 1.5 4.5 4 4.5-4" />
                  </svg>
                </button>

                <div
                  className="mega-menu-panel"
                  id={`mega-menu-${menu.id}`}
                  aria-hidden={!isOpen}
                >
                  <div className="mega-menu-surface">
                    <Link
                      className={`mega-menu-feature mega-menu-feature--${menu.id}`}
                      href={menu.featured.href}
                    >
                      <small>{menu.featured.eyebrow}</small>
                      <strong>{menu.featured.label}</strong>
                      <span>{menu.featured.description}</span>
                      <b>
                        Explorar <i aria-hidden="true">→</i>
                      </b>
                    </Link>

                    <div className="mega-menu-columns">
                      {menu.sections.map((section) => (
                        <section key={section.title}>
                          <h2>{section.title}</h2>
                          <div>
                            {section.links.map((link) => (
                              <Link href={link.href} key={link.href}>
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

        <div className="site-header-actions">
          <Link
            className={`header-utility-link${camerasActive ? " is-active" : ""}`}
            href="/cameras-ao-vivo-pelotas"
            aria-current={camerasActive ? "page" : undefined}
          >
            Câmeras ao vivo
          </Link>

          <Link
            className={`header-action header-action--${advisoryLevel}${alertsActive ? " is-active" : ""}`}
            href="/alertas"
            aria-current={alertsActive ? "page" : undefined}
            aria-label={actionCopy.ariaLabel}
          >
            <span className="header-action-icon" aria-hidden="true">
              <NavigationIcon name="alert" />
            </span>
            <span className="header-action-dot" aria-hidden="true" />
            <span className="header-action-label">
              <small>{actionCopy.eyebrow}</small>
              <strong>{actionCopy.label}</strong>
            </span>
            <span className="header-action-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <nav
        className="mobile-tab-bar"
        data-advisory-level={advisoryLevel}
        aria-label="Navegação principal do portal"
      >
        {mobileNavItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const isAlertItem = item.href === "/alertas";
          const className = [
            isActive ? "is-active" : "",
            isAlertItem ? "is-alert-item" : "",
            isAlertItem && advisoryLevel !== "normal" ? "is-alerting" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Link
              className={className || undefined}
              href={item.href}
              key={item.href}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="mobile-tab-icon">
                <NavigationIcon name={item.icon} />
                {isAlertItem && advisoryLevel !== "normal" ? (
                  <i className="mobile-tab-alert-dot" aria-hidden="true" />
                ) : null}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
