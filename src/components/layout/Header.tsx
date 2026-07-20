import { Link, useRouterState } from "@tanstack/react-router";

const primaryNavigation = [
  { label: "Agora", to: "/" },
  { label: "Hoje", to: "/tempo-hoje-pelotas" },
  { label: "7 dias", to: "/previsao-7-dias-pelotas" },
  { label: "Chuva", to: "/chuva-em-pelotas" },
  { label: "Águas", to: "/situacao-hidrologica-pelotas" },
] as const;

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const alertsActive = isActivePath(pathname, "/alertas");

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" to="/" aria-label="Tempo Pelotas — página inicial">
            <span className="site-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="site-brand-copy">
              <strong>Tempo</strong>
              <span>Pelotas</span>
            </span>
          </Link>

          <nav className="desktop-navigation" aria-label="Navegação principal">
            {primaryNavigation.map((item) => {
              const active = isActivePath(pathname, item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active ? "is-active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            className={alertsActive ? "header-alert is-active" : "header-alert"}
            to="/alertas"
            aria-current={alertsActive ? "page" : undefined}
          >
            <span aria-hidden="true" />
            Alertas
          </Link>
        </div>

        <nav className="mobile-navigation" aria-label="Navegação principal no celular">
          {primaryNavigation.map((item) => {
            const active = isActivePath(pathname, item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/alertas"
            className={alertsActive ? "is-active" : undefined}
            aria-current={alertsActive ? "page" : undefined}
          >
            Alertas
          </Link>
        </nav>
      </header>
    </>
  );
}
