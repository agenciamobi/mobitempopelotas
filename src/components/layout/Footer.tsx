import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { WeatherData } from "@/production/lib/weather-data";

import "./Footer.css";
import { getFooterLead } from "./footer-content";

const footerGroups = [
  {
    title: "Previsão",
    links: [
      { label: "Tempo agora", ariaLabel: "Ver o tempo agora em Pelotas", to: "/" },
      {
        label: "Previsão para hoje",
        ariaLabel: "Ver a previsão do tempo para hoje em Pelotas",
        to: "/tempo-hoje-pelotas",
      },
      {
        label: "Previsão para amanhã",
        ariaLabel: "Ver a previsão do tempo para amanhã em Pelotas",
        to: "/tempo-amanha-pelotas",
      },
      {
        label: "Próximos 7 dias",
        ariaLabel: "Ver a previsão do tempo para os próximos 7 dias em Pelotas",
        to: "/previsao-7-dias-pelotas",
      },
      {
        label: "Chuva em Pelotas",
        ariaLabel: "Ver probabilidade e volume de chuva em Pelotas",
        to: "/chuva-em-pelotas",
      },
      {
        label: "Vento em Pelotas",
        ariaLabel: "Ver velocidade, direção e rajadas de vento em Pelotas",
        to: "/vento-em-pelotas",
      },
    ],
  },
  {
    title: "Águas e alertas",
    links: [
      {
        label: "Situação hidrológica",
        ariaLabel: "Ver a situação hidrológica de Pelotas e da Lagoa dos Patos",
        to: "/situacao-hidrologica-pelotas",
      },
      {
        label: "Lagoa dos Patos no Laranjal",
        ariaLabel: "Ver o nível da Lagoa dos Patos na Praia do Laranjal",
        to: "/nivel-da-lagoa-dos-patos-laranjal",
      },
      {
        label: "Avisos meteorológicos",
        ariaLabel: "Consultar avisos meteorológicos oficiais para Pelotas",
        to: "/alertas",
      },
      {
        label: "Câmeras ao vivo",
        ariaLabel: "Ver câmeras ao vivo de Pelotas e região",
        to: "/cameras-ao-vivo-pelotas",
      },
    ],
  },
  {
    title: "Dados locais",
    links: [
      {
        label: "Estação Embrapa",
        ariaLabel: "Consultar dados meteorológicos da estação Embrapa em Pelotas",
        to: "/estacao-embrapa-pelotas",
      },
      {
        label: "Radar e satélite",
        ariaLabel: "Acompanhar radar e satélite meteorológico para Pelotas e região",
        to: "/radar-e-satelite-pelotas",
      },
      {
        label: "Histórico climático",
        ariaLabel: "Consultar o histórico climático recente de Pelotas",
        to: "/historico-climatico-pelotas",
      },
      {
        label: "Metodologia e fontes",
        ariaLabel: "Conhecer a metodologia e as fontes do Tempo Pelotas",
        to: "/metodologia",
      },
    ],
  },
] as const;

const mobiUrl =
  "https://agenciamobi.com.br/?utm_source=tempopelotas&utm_medium=footer&utm_campaign=portal_tempo_pelotas";

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Footer({ source }: { source?: WeatherData["source"] }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const lead = getFooterLead(pathname);
  const sourceStatus = source
    ? source.isFallback
      ? "Operação em contingência"
      : "Fontes identificadas"
    : "Fontes e método publicados";

  return (
    <footer className="editorial-footer-shell">
      <div className="editorial-footer">
        <div className="editorial-footer-brand-line" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <section className="editorial-footer-lead" aria-labelledby="editorial-footer-title">
          <div className="editorial-footer-lead-copy">
            <Link className="editorial-footer-brand" to="/" aria-label="Tempo Pelotas — página inicial">
              <img
                className="editorial-footer-brand-logo"
                src="/brand/tempo-pelotas-header"
                alt=""
                width={344}
                height={50}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </Link>
            <span className="editorial-footer-eyebrow">{lead.eyebrow}</span>
            <h2 id="editorial-footer-title">{lead.title}</h2>
            <p>{lead.description}</p>
          </div>

          <div className="editorial-footer-lead-aside">
            <div
              className={`editorial-footer-status${source?.isFallback ? " is-fallback" : ""}`}
              aria-label="Estado das fontes do portal"
            >
              <span aria-hidden="true" />
              <div>
                <small>Estado dos dados</small>
                <strong>{sourceStatus}</strong>
              </div>
            </div>

            <div className="editorial-footer-actions">
              <Link
                className="editorial-footer-action editorial-footer-action-primary"
                to="/tempo-hoje-pelotas"
                aria-label="Ver a previsão do tempo para hoje em Pelotas"
                aria-current={isActivePath(pathname, "/tempo-hoje-pelotas") ? "page" : undefined}
              >
                Ver previsão de hoje
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                className="editorial-footer-action"
                to="/alertas"
                aria-label="Consultar avisos meteorológicos oficiais para Pelotas"
                aria-current={isActivePath(pathname, "/alertas") ? "page" : undefined}
              >
                Consultar avisos
              </Link>
            </div>
          </div>
        </section>

        <section className="editorial-footer-directory" aria-label="Navegação do portal">
          <div className="editorial-footer-groups">
            {footerGroups.map((group) => (
              <nav className="editorial-footer-group" aria-label={group.title} key={group.title}>
                <strong>{group.title}</strong>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        aria-label={link.ariaLabel}
                        aria-current={isActivePath(pathname, link.to) ? "page" : undefined}
                      >
                        <span>{link.label}</span>
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </section>

        <section
          className="editorial-footer-transparency"
          aria-label="Fontes e orientação de segurança"
        >
          <div className="editorial-footer-sources">
            <span>Fontes meteorológicas e locais</span>
            <p>
              Embrapa Clima Temperado · INMET · CPPMet/UFPel · Open-Meteo · REDEMET/DECEA ·
              LabHidroSens/UFPel · Nível Guaíba · FURG & Portos RS
            </p>
          </div>

          <div className="editorial-footer-guidance">
            <span aria-hidden="true">i</span>
            <p>
              Em situações de risco, siga os comunicados da Defesa Civil, do INMET e das autoridades
              locais.
            </p>
          </div>

          <nav className="editorial-footer-legal" aria-label="Transparência e dados">
            <Link
              to="/metodologia"
              aria-label="Conhecer a metodologia e as fontes do Tempo Pelotas"
              aria-current={isActivePath(pathname, "/metodologia") ? "page" : undefined}
            >
              Metodologia
            </Link>
            <Link
              to="/privacidade-e-dados"
              aria-label="Consultar a política de privacidade e dados do Tempo Pelotas"
              aria-current={isActivePath(pathname, "/privacidade-e-dados") ? "page" : undefined}
            >
              Privacidade e dados
            </Link>
            <a href="/feed" type="application/feed+json" aria-label="Abrir o feed de dados do Tempo Pelotas">
              Feed de dados
            </a>
          </nav>
        </section>

        <div className="editorial-footer-base">
          <span>© {new Date().getFullYear()} Tempo Pelotas</span>
          <p>
            Projeto do{" "}
            <a
              href={mobiUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Conhecer o Ecossistema MOBI, abre em nova aba"
            >
              Ecossistema MOBI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
