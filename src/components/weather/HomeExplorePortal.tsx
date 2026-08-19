import { Link } from "@tanstack/react-router";

import "./HomeExplorePortal.css";

type ExploreGroup = {
  eyebrow: string;
  title: string;
  description: string;
  links: ReadonlyArray<{ label: string; to: string }>;
};

const exploreGroups: ReadonlyArray<ExploreGroup> = [
  {
    eyebrow: "Previsão",
    title: "Planeje as próximas horas e os próximos dias",
    description:
      "Consulte a evolução por hora, o tempo de amanhã e a tendência meteorológica para a semana.",
    links: [
      { label: "Previsão de hoje", to: "/tempo-hoje-pelotas" },
      { label: "Tempo amanhã", to: "/tempo-amanha-pelotas" },
      { label: "Previsão para 7 dias", to: "/previsao-7-dias-pelotas" },
    ],
  },
  {
    eyebrow: "Chuva e vento",
    title: "Veja os períodos que exigem mais atenção",
    description:
      "Acompanhe probabilidade e volume de chuva, vento, rajadas previstas e avisos oficiais.",
    links: [
      { label: "Chuva em Pelotas", to: "/chuva-em-pelotas" },
      { label: "Vento e rajadas", to: "/vento-em-pelotas" },
      { label: "Avisos meteorológicos", to: "/alertas" },
    ],
  },
  {
    eyebrow: "Monitoramento",
    title: "Consulte medições, radar e imagens locais",
    description:
      "Acesse a estação da Embrapa, os produtos REDEMET, as câmeras e o histórico climático.",
    links: [
      { label: "Estação Embrapa", to: "/estacao-embrapa-pelotas" },
      { label: "Radar e satélite", to: "/radar-e-satelite-pelotas" },
      { label: "Câmeras ao vivo", to: "/cameras-ao-vivo-pelotas" },
      { label: "Histórico climático", to: "/historico-climatico-pelotas" },
    ],
  },
  {
    eyebrow: "Águas e fontes",
    title: "Acompanhe a Lagoa e entenda de onde vêm os dados",
    description:
      "Veja leituras locais e regionais, referências das estações e a metodologia usada pelo portal.",
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
        <span>Explore o Tempo Pelotas</span>
        <h2 id="tp-home-explore-title">Mais informações, sem sobrecarregar a página inicial</h2>
        <p>
          A homepage resume o que importa agora. Use este diretório para aprofundar previsão,
          monitoramento, águas e metodologia.
        </p>
      </header>

      <div className="tp-home-explore__groups">
        {exploreGroups.map((group) => (
          <article className="tp-home-explore__group" key={group.eyebrow}>
            <small>{group.eyebrow}</small>
            <h3>{group.title}</h3>
            <p>{group.description}</p>
            <nav aria-label={group.eyebrow}>
              {group.links.map((link) => (
                <Link to={link.to} key={link.to}>
                  <span>{link.label}</span>
                  <b aria-hidden="true">→</b>
                </Link>
              ))}
            </nav>
          </article>
        ))}
      </div>
    </section>
  );
}
