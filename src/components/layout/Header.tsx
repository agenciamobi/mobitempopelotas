import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { AuthAccountAction } from "@/components/auth/AuthAccountAction";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./Header.css";

type MenuId = "monitoring" | "region" | "water";

const editorialPrimaryLinks = [
  { label: "Agora", ariaLabel: "Ver o tempo agora em Pelotas", to: "/" },
  { label: "Hoje", ariaLabel: "Ver a previsão do tempo para hoje em Pelotas", to: "/tempo-hoje-pelotas" },
  { label: "Amanhã", ariaLabel: "Ver a previsão do tempo para amanhã em Pelotas", to: "/tempo-amanha-pelotas" },
  { label: "7 dias", ariaLabel: "Ver a previsão do tempo para os próximos 7 dias em Pelotas", to: "/previsao-7-dias-pelotas" },
  { label: "Chuva", ariaLabel: "Ver a previsão de chuva em Pelotas", to: "/chuva-em-pelotas" },
  { label: "Vento", ariaLabel: "Ver vento e rajadas em Pelotas", to: "/vento-em-pelotas" },
] as const;

const megaMenus = [
  {
    id: "monitoring",
    label: "Monitoramento",
    activePaths: [
      "/estacao-embrapa-pelotas",
      "/clima-em-pelotas",
      "/historico-climatico-pelotas",
      "/cameras-ao-vivo-pelotas",
      "/radar-e-satelite-pelotas",
      "/meteograma-pelotas",
      "/mapa-de-geadas-rio-grande-do-sul",
      "/metodologia",
    ],
    featured: {
      eyebrow: "Observação regional",
      label: "Radar, satélites e estações",
      to: "/radar-e-satelite-pelotas",
      description: "Acompanhe imagens meteorológicas, medições locais e a evolução recente do tempo.",
    },
    sections: [
      {
        title: "Ao vivo e observado",
        links: [
          { label: "Radar e satélite", to: "/radar-e-satelite-pelotas", description: "REDEMET, INMET e ocorrências regionais de trovoadas." },
          { label: "Mapa de geadas", to: "/mapa-de-geadas-rio-grande-do-sul", description: "Ocorrências observadas pelas estações do INMET no Rio Grande do Sul." },
          { label: "Estação Embrapa", to: "/estacao-embrapa-pelotas", description: "Dados medidos pela estação de Pelotas." },
          { label: "Câmeras ao vivo", to: "/cameras-ao-vivo-pelotas", description: "Imagens locais e estado das transmissões." },
        ],
      },
      {
        title: "Contexto e transparência",
        links: [
          { label: "Clima de Pelotas", to: "/clima-em-pelotas", description: "Estações do ano, fatores locais, normais e diferença entre tempo e clima." },
          { label: "Meteograma 24–48h", to: "/meteograma-pelotas", description: "Temperatura, chuva, nuvens, visibilidade, pressão e vento hora a hora." },
          { label: "Histórico de 30 dias", to: "/historico-climatico-pelotas", description: "Compare máximas, mínimas, chuva e rajadas recentes." },
          { label: "Fontes e metodologia", to: "/metodologia", description: "Origem, função, limites e atualização dos dados." },
        ],
      },
    ],
  },
  {
    id: "region",
    label: "Região",
    activePaths: ["/tempo-na-regiao-sul-rs", "/tempo-em"],
    featured: {
      eyebrow: "Central local",
      label: "Tempo por cidade na Zona Sul",
      to: "/tempo-na-regiao-sul-rs",
      description: "Previsão local e avisos municipais para Pelotas, Costa Doce, fronteira e Campanha.",
    },
    sections: [
      {
        title: "Pelotas e entorno",
        links: [
          { label: "Pelotas", to: "/", description: "Central meteorológica completa de Pelotas." },
          { label: "Capão do Leão", href: "/tempo-em/capao-do-leao-rs", description: "Tempo no município vizinho a Pelotas." },
          { label: "Canguçu", href: "/tempo-em/cangucu-rs", description: "Condições na Serra do Sudeste." },
          { label: "Morro Redondo", href: "/tempo-em/morro-redondo-rs", description: "Previsão para a área serrana próxima." },
        ],
      },
      {
        title: "Costa e fronteira",
        links: [
          { label: "Rio Grande", href: "/tempo-em/rio-grande-rs", description: "Porto, Lagoa dos Patos e litoral." },
          { label: "São Lourenço do Sul", href: "/tempo-em/sao-lourenco-do-sul-rs", description: "Previsão na Costa Doce." },
          { label: "Jaguarão", href: "/tempo-em/jaguarao-rs", description: "Tempo na fronteira com o Uruguai." },
          { label: "Santa Vitória do Palmar", href: "/tempo-em/santa-vitoria-do-palmar-rs", description: "Condições no extremo sul." },
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
          { label: "Situação das águas", to: "/situacao-hidrologica-pelotas", description: "Laranjal e estações da Lagoa dos Patos." },
          { label: "Nível no Laranjal", to: "/nivel-da-lagoa-dos-patos-laranjal", description: "Medição, tendência e última leitura conhecida." },
        ],
      },
      {
        title: "Segurança e contexto",
        links: [
          { label: "Avisos oficiais", to: "/alertas", description: "Alertas meteorológicos vigentes para Pelotas." },
          { label: "Como os dados são usados", to: "/metodologia", description: "Critérios, fontes e limitações das leituras." },
        ],
      },
    ],
  },
] as const;

const mobileNavigation = [
  { label: "Agora", ariaLabel: "Tempo agora em Pelotas", to: "/", icon: "⌂" },
  { label: "Hoje", ariaLabel: "Previsão do tempo para hoje em Pelotas", to: "/tempo-hoje-pelotas", icon: "☀" },
  { label: "7 dias", ariaLabel: "Previsão do tempo para 7 dias em Pelotas", to: "/previsao-7-dias-pelotas", icon: "▦" },
  { label: "Região", ariaLabel: "Consultar previsão por cidade na Zona Sul do Rio Grande do Sul", to: "/tempo-na-regiao-sul-rs", icon: "⌖" },
  { label: "Águas", ariaLabel: "Situação das águas em Pelotas e na Lagoa dos Patos", to: "/situacao-hidrologica-pelotas", icon: "≈" },
  { label: "Alertas", ariaLabel: "Avisos meteorológicos oficiais para Pelotas", to: "/alertas", icon: "!" },
] as const;

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function alertLabel(level: AdvisoryLevel) {
  if (level === "warning") return "Alerta ativo";
  if (level === "attention") return "Atenção";
  return "Avisos oficiais";
}

export function Header({ advisoryLevel = "normal" }: { advisoryLevel?: AdvisoryLevel }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const headerRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const alertsActive = isActivePath(pathname, "/alertas");

  useEffect(() => setOpenMenu(null), [pathname]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo principal</a>
      <header ref={headerRef} className="site-header production-header" data-advisory-level={advisoryLevel}>
        <div className="editorial-utility-bar">
          <div className="editorial-utility-inner">
            <div className="editorial-utility-context">
              <span className="editorial-location"><i aria-hidden="true" /> Pelotas, Rio Grande do Sul</span>
              <span className="editorial-utility-separator" aria-hidden="true" />
              <span>Informação meteorológica local, oficial e regional</span>
            </div>
            <nav className="editorial-utility-navigation" aria-label="Links institucionais">
              <Link to="/metodologia" aria-label="Conhecer as fontes e a metodologia do Tempo Pelotas">Fontes e metodologia</Link>
              <Link to="/cameras-ao-vivo-pelotas" aria-label="Ver câmeras ao vivo de Pelotas e região">Câmeras ao vivo</Link>
            </nav>
          </div>
        </div>

        <div className="production-header-inner">
          <div className="production-branding">
            <Link className="production-brand" to="/" aria-label="Tempo Pelotas — página inicial">
              <img className="production-brand-logo" src="/brand/tempo-pelotas-purple.svg" alt="" width={344} height={50} loading="eager" decoding="async" fetchPriority="high" draggable={false} />
            </Link>
          </div>
          <div className="editorial-masthead-copy"><span>Portal meteorológico regional</span><strong>Previsão, observação e águas de Pelotas</strong></div>
          <div className="production-header-actions">
            <AuthAccountAction />
            <Link className={`production-alert-link is-${advisoryLevel}${alertsActive ? " is-active" : ""}`} to="/alertas" aria-label="Consultar avisos meteorológicos oficiais para Pelotas" aria-current={alertsActive ? "page" : undefined}>
              <span className="production-alert-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 3.6 19h16.8L12 3Z" /><path d="M12 9v4.5M12 17h.01" /></svg></span>
              <strong>{alertLabel(advisoryLevel)}</strong><i aria-hidden="true">→</i>
            </Link>
          </div>
        </div>

        <div className="editorial-navigation-shell">
          <div className="editorial-navigation-inner">
            <nav className="editorial-direct-navigation" aria-label="Editorias de previsão">
              {editorialPrimaryLinks.map((item) => {
                const active = isActivePath(pathname, item.to);
                return <Link key={item.to} to={item.to} className={active ? "is-active" : undefined} aria-label={item.ariaLabel} aria-current={active ? "page" : undefined}>{item.label}</Link>;
              })}
            </nav>
            <span className="editorial-navigation-divider" aria-hidden="true" />
            <nav className="mega-navigation" aria-label="Demais editorias">
              {megaMenus.map((menu) => {
                const isOpen = openMenu === menu.id;
                const isActive = menu.activePaths.some((path) => isActivePath(pathname, path));
                return (
                  <div className={`mega-navigation-item${isOpen ? " is-open" : ""}`} key={menu.id} onMouseEnter={() => setOpenMenu(menu.id)} onMouseLeave={() => setOpenMenu((current) => current === menu.id ? null : current)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu((current) => current === menu.id ? null : current); }} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setOpenMenu(null); event.currentTarget.querySelector<HTMLElement>("button")?.focus(); } }}>
                    <button className={`mega-navigation-trigger${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`} type="button" aria-expanded={isOpen} aria-haspopup="true" aria-controls={`mega-menu-${menu.id}`} onClick={() => setOpenMenu((current) => current === menu.id ? null : menu.id)} onFocus={() => setOpenMenu(menu.id)}>
                      <span>{menu.label}</span><svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1.5 1.5 4.5 4 4.5-4" /></svg>
                    </button>
                    <div className="mega-navigation-panel" id={`mega-menu-${menu.id}`} aria-hidden={!isOpen}>
                      <div className="mega-navigation-surface">
                        <Link className={`mega-navigation-feature is-${menu.id}`} to={menu.featured.to} aria-label={`${menu.featured.label}. ${menu.featured.description}`} aria-current={isActivePath(pathname, menu.featured.to) ? "page" : undefined}>
                          <small>{menu.featured.eyebrow}</small><strong>{menu.featured.label}</strong><span>{menu.featured.description}</span><b>Explorar <i aria-hidden="true">→</i></b>
                        </Link>
                        <div className="mega-navigation-columns">
                          {menu.sections.map((section) => (
                            <section key={section.title}>
                              <h2>{section.title}</h2>
                              <div>
                                {section.links.map((link) => {
                                  const content = <><span aria-hidden="true" /><strong>{link.label}</strong><small>{link.description}</small></>;
                                  return "href" in link
                                    ? <a href={link.href} key={link.href}>{content}</a>
                                    : <Link to={link.to} key={link.to} aria-label={`${link.label}. ${link.description}`} aria-current={isActivePath(pathname, link.to) ? "page" : undefined}>{content}</Link>;
                                })}
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
          </div>
        </div>
      </header>

      <nav className="production-mobile-navigation" data-advisory-level={advisoryLevel} aria-label="Navegação principal no celular">
        {mobileNavigation.map((item) => {
          const active = isActivePath(pathname, item.to);
          return <Link key={item.to} to={item.to} className={active ? "is-active" : undefined} aria-label={item.ariaLabel} aria-current={active ? "page" : undefined}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></Link>;
        })}
      </nav>
    </>
  );
}
