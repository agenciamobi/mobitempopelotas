import "./home-section-navigation.css";

const homeSections = [
  {
    href: "#previsao-hoje",
    label: "Previsão",
    description: "Horas e próximos dias",
  },
  {
    href: "#regiao",
    label: "Radar e satélite",
    description: "Chuva e nuvens na região",
  },
  {
    href: "#observacao-embrapa",
    label: "Medições locais",
    description: "Dados da Embrapa",
  },
  {
    href: "#situacao-das-aguas",
    label: "Situação das águas",
    description: "Laranjal e Lagoa dos Patos",
  },
  {
    href: "#explorar-portal",
    label: "Mais informações",
    description: "Câmeras, histórico e fontes",
  },
] as const;

export function HomeSectionNavigation() {
  return (
    <nav
      className="home-section-navigation home-section-navigation--editorial-index"
      aria-label="Seções da página inicial"
    >
      <span className="home-section-navigation__label">Nesta página</span>
      <div className="home-section-navigation__links">
        {homeSections.map((section) => (
          <a
            href={section.href}
            key={section.href}
            aria-label={`${section.label}: ${section.description}`}
          >
            <strong>{section.label}</strong>
          </a>
        ))}
      </div>
    </nav>
  );
}
