import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import "./Footer.css";

const footerGroups = [
  {
    title: "Previsão",
    links: [
      { label: "Tempo agora", to: "/" },
      { label: "Previsão para hoje", to: "/tempo-hoje-pelotas" },
      { label: "Previsão para amanhã", to: "/tempo-amanha-pelotas" },
      { label: "Próximos 7 dias", to: "/previsao-7-dias-pelotas" },
      { label: "Chuva em Pelotas", to: "/chuva-em-pelotas" },
      { label: "Vento em Pelotas", to: "/vento-em-pelotas" },
    ],
  },
  {
    title: "Águas e alertas",
    links: [
      { label: "Situação hidrológica", to: "/situacao-hidrologica-pelotas" },
      { label: "Lagoa dos Patos no Laranjal", to: "/nivel-da-lagoa-dos-patos-laranjal" },
      { label: "Avisos meteorológicos", to: "/alertas" },
      { label: "Câmeras ao vivo", to: "/cameras-ao-vivo-pelotas" },
    ],
  },
  {
    title: "Dados locais",
    links: [
      { label: "Estação Embrapa", to: "/estacao-embrapa-pelotas" },
      { label: "Radar e satélite", to: "/radar-e-satelite-pelotas" },
      { label: "Histórico climático", to: "/historico-climatico-pelotas" },
      { label: "Metodologia e fontes", to: "/metodologia" },
    ],
  },
] as const;

const mobiUrl =
  "https://agenciamobi.com.br/?utm_source=tempopelotas&utm_medium=footer&utm_campaign=portal_tempo_pelotas";

export function Footer() {
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
            <Link className="editorial-footer-brand" to="/" aria-label="Tempo Pelotas — início">
              <img
                className="editorial-footer-brand-logo"
                src="/brand/tempo-pelotas-header"
                alt=""
                width={10694}
                height={1552}
                loading="lazy"
                draggable={false}
              />
            </Link>
            <span className="editorial-footer-eyebrow">Tempo e águas de Pelotas</span>
            <h2 id="editorial-footer-title">Informação local para acompanhar o dia.</h2>
            <p>
              Previsão, medições, avisos oficiais e situação das águas reunidos em um portal
              independente desenvolvido em Pelotas.
            </p>
          </div>

          <div className="editorial-footer-lead-aside">
            <div className="editorial-footer-status" aria-label="Portal em operação">
              <span aria-hidden="true" />
              <div>
                <small>Operação do portal</small>
                <strong>Fontes identificadas por seção</strong>
              </div>
            </div>

            <div className="editorial-footer-actions">
              <Link
                className="editorial-footer-action editorial-footer-action-primary"
                to="/tempo-hoje-pelotas"
              >
                Ver previsão de hoje
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="editorial-footer-action" to="/alertas">
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
                      <Link to={link.to}>
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

          <nav className="editorial-footer-legal" aria-label="Transparência">
            <Link to="/metodologia">Metodologia</Link>
          </nav>
        </section>

        <div className="editorial-footer-base">
          <span>© {new Date().getFullYear()} Tempo Pelotas</span>
          <p>
            Projeto do{" "}
            <a href={mobiUrl} target="_blank" rel="noreferrer">
              Ecossistema MOBI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
