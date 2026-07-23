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
    <nav className="home-section-navigation" aria-label="Seções da página inicial">
      <span className="home-section-navigation__label">Nesta página</span>
      <div className="home-section-navigation__links">
        {homeSections.map((section, index) => (
          <a href={section.href} key={section.href}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <strong>{section.label}</strong>
              <small>{section.description}</small>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}
