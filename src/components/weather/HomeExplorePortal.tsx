import { Link } from "@tanstack/react-router";

import "./HomeExplorePortal.css";

type ExploreGroup = {
  eyebrow: string;
  title: string;
  links: ReadonlyArray<{ label: string; to: string }>;
};

const exploreGroups: ReadonlyArray<ExploreGroup> = [
  {
    eyebrow: "Previsão",
    title: "Planeje as próximas horas e os próximos dias",
    links: [
      { label: "Previsão de hoje", to: "/tempo-hoje-pelotas" },
      { label: "Tempo amanhã", to: "/tempo-amanha-pelotas" },
      { label: "Previsão para 7 dias", to: "/previsao-7-dias-pelotas" },
    ],
  },
  {
    eyebrow: "Chuva e vento",
    title: "Acompanhe os períodos que exigem mais atenção",
    links: [
      { label: "Chuva em Pelotas", to: "/chuva-em-pelotas" },
      { label: "Vento e rajadas", to: "/vento-em-pelotas" },
      { label: "Avisos meteorológicos", to: "/alertas" },
    ],
  },
  {
    eyebrow: "Monitoramento",
    title: "Consulte medições e imagens da região",
    links: [
      { label: "Estação Embrapa", to: "/estacao-embrapa-pelotas" },
      { label: "Radar e satélite", to: "/radar-e-satelite-pelotas" },
      { label: "Câmeras ao vivo", to: "/cameras-ao-vivo-pelotas" },
      { label: "Histórico climático", to: "/historico-climatico-pelotas" },
    ],
  },
  {
    eyebrow: "Águas e fontes",
    title: "Aprofunde Lagoa, hidrologia e metodologia",
    links: [
      { label: "Situação das águas", to: "/situacao-hidrologica-pelotas" },
      { label: "Nível no Laranjal", to: "/nivel-da-lagoa-dos-patos-laranjal" },
      { label: "Fontes e metodologia", to: "/metodologia" },
    ],
  },
];

export function HomeExplorePortal() {
  return (
    <section
      className="tp-home-explore"
      id="explorar-portal"
      aria-labelledby="tp-home-explore-title"
    >
      <header className="tp-home-explore__heading">
        <span>Explore o portal</span>
        <h2 id="tp-home-explore-title">Aprofunde o que importa para você</h2>
        <p>
          A página inicial resume a situação. As páginas abaixo concentram previsão detalhada,
          monitoramento, águas e metodologia sem repetir toda a informação aqui.
        </p>
      </header>

      <div className="tp-home-explore__groups">
        {exploreGroups.map((group) => (
          <section className="tp-home-explore__group" key={group.eyebrow}>
            <header>
              <small>{group.eyebrow}</small>
              <h3>{group.title}</h3>
            </header>
            <nav aria-label={group.eyebrow}>
              {group.links.map((link) => (
                <Link to={link.to} key={link.to}>
                  <span>{link.label}</span>
                  <b aria-hidden="true">→</b>
                </Link>
              ))}
            </nav>
          </section>
        ))}
      </div>
    </section>
  );
}
