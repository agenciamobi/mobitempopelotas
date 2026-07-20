"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdvisoryLevel } from "@/lib/weather-insights";

type NavigationIconName = "home" | "today" | "week" | "rain" | "water" | "alert";

type NavigationItem = {
  label: string;
  href: string;
  icon: NavigationIconName;
};

type SiteHeaderProps = {
  advisoryLevel?: AdvisoryLevel;
  variant?: "default" | "hero";
};

const desktopNavItems: NavigationItem[] = [
  { label: "Agora", href: "/", icon: "home" },
  { label: "Hoje", href: "/tempo-hoje-pelotas", icon: "today" },
  { label: "7 dias", href: "/previsao-7-dias-pelotas", icon: "week" },
  { label: "Chuva", href: "/chuva-em-pelotas", icon: "rain" },
  {
    label: "Águas",
    href: "/situacao-hidrologica-pelotas",
    icon: "water",
  },
];

const mobileNavItems: NavigationItem[] = [
  { label: "Agora", href: "/", icon: "home" },
  { label: "Hoje", href: "/tempo-hoje-pelotas", icon: "today" },
  { label: "7 dias", href: "/previsao-7-dias-pelotas", icon: "week" },
  { label: "Águas", href: "/situacao-hidrologica-pelotas", icon: "water" },
  { label: "Alertas", href: "/alertas", icon: "alert" },
];

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

export function SiteHeader({
  advisoryLevel = "normal",
  variant = "default",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const alertsActive = isActivePath(pathname, "/alertas");
  const headerClassName = `site-header${variant === "hero" ? " site-header--hero" : ""}`;

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <header className={headerClassName} data-advisory-level={advisoryLevel}>
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

        <nav className="main-nav" aria-label="Navegação principal">
          {desktopNavItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                className={isActive ? "is-active" : undefined}
                href={item.href}
                key={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          className={`header-action header-action--${advisoryLevel}${alertsActive ? " is-active" : ""}`}
          href="/alertas"
          aria-current={alertsActive ? "page" : undefined}
          aria-label="Abrir condições de atenção meteorológica"
        >
          <span className="header-action-dot" aria-hidden="true" />
          <span className="header-action-icon" aria-hidden="true">
            <NavigationIcon name="alert" />
          </span>
          <span className="header-action-label">Alertas</span>
        </Link>
      </header>

      <nav className="mobile-tab-bar" aria-label="Navegação principal do aplicativo">
        {mobileNavItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              className={isActive ? "is-active" : undefined}
              href={item.href}
              key={item.href}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="mobile-tab-icon">
                <NavigationIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
