import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CloudRainWind,
  Radar,
  Waves,
  type LucideIcon,
} from "lucide-react";

import "./HomeExplorePortal.css";

type ExploreGroup = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "forecast" | "weather" | "monitoring" | "water";
  links: ReadonlyArray<{ label: string; to: string }>;
};

const exploreGroups: ReadonlyArray<ExploreGroup> = [
  {
    eyebrow: "Planejar o dia",
    title: "Previsão para agora e para os próximos dias",
    description:
      "Consulte a evolução por hora, o destaque de amanhã e a tendência meteorológica para a semana.",
    icon: CalendarDays,
    tone: "forecast",
    links: [
      { label: "Previsão de hoje", to: "/tempo-hoje-pelotas" },
      { label: "Tempo amanhã", to: "/tempo-amanha-pelotas" },
      { label: "Previsão para 7 dias", to: "/previsao-7-dias-pelotas" },
    ],
  },
  {
    eyebrow: "Chuva, vento e alertas",
    title: "Identifique os períodos que exigem mais atenção",
    description:
      "Veja probabilidade e volume de chuva, direção do vento, rajadas previstas e avisos oficiais vigentes.",
    icon: CloudRainWind,
    tone: "weather",
    links: [
      { label: "Chuva em Pelotas", to: "/chuva-em-pelotas" },
      { label: "Vento e rajadas", to: "/vento-em-pelotas" },
      { label: "Avisos meteorológicos", to: "/alertas" },
    ],
  },
  {
    eyebrow: "Monitoramento local",
    title: "Compare previsão, medições e imagens da região",
    description:
      "Acompanhe a estação da Embrapa, os produtos REDEMET, as câmeras e o histórico climático disponível.",
    icon: Radar,
    tone: "monitoring",
    links: [
      { label: "Estação Embrapa", to: "/estacao-embrapa-pelotas" },
      { label: "Radar e satélite", to: "/radar-e-satelite-pelotas" },
      { label: "Câmeras ao vivo", to: "/cameras-ao-vivo-pelotas" },
      { label: "Histórico climático", to: "/historico-climatico-pelotas" },
    ],
  },
  {
    eyebrow: "Águas e transparência",
    title: "Acompanhe o Laranjal e a rede da Lagoa dos Patos",
    description:
      "Consulte as leituras locais e regionais, entenda as referências de cada estação e confira as fontes.",
    icon: Waves,
    tone: "water",
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
      className="home-explore-portal"
      id="explorar-portal"
      aria-labelledby="home-explore-portal-title"
    >
      <header className="home-explore-portal-heading">
        <span>Principais informações do portal</span>
        <h2 id="home-explore-portal-title">Encontre o que precisa acompanhar</h2>
        <p>
          Acesse diretamente a previsão, os avisos, as medições locais ou a situação das águas sem
          percorrer novamente toda a página.
        </p>
      </header>

      <div className="home-explore-portal-groups">
        {exploreGroups.map((group) => {
          const Icon = group.icon;

          return (
            <article className={`home-explore-portal-group is-${group.tone}`} key={group.eyebrow}>
              <div className="home-explore-portal-group-title">
                <span aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <small>{group.eyebrow}</small>
                  <h3>{group.title}</h3>
                </div>
              </div>

              <p>{group.description}</p>

              <nav aria-label={group.eyebrow}>
                {group.links.map((link) => (
                  <Link to={link.to} key={link.to}>
                    <span>{link.label}</span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ))}
              </nav>
            </article>
          );
        })}
      </div>
    </section>
  );
}
