import { Link } from "@tanstack/react-router";

const footerGroups = [
  {
    title: "Previsão",
    links: [
      { label: "Tempo agora", to: "/" },
      { label: "Previsão para hoje", to: "/tempo-hoje-pelotas" },
      { label: "Próximos 7 dias", to: "/previsao-7-dias-pelotas" },
      { label: "Chuva em Pelotas", to: "/chuva-em-pelotas" },
      { label: "Vento em Pelotas", to: "/vento-em-pelotas" },
    ],
  },
  {
    title: "Águas e atenção",
    links: [
      { label: "Situação hidrológica", to: "/situacao-hidrologica-pelotas" },
      { label: "Nível da Lagoa dos Patos", to: "/nivel-da-lagoa-dos-patos-laranjal" },
      { label: "Condições de atenção", to: "/alertas" },
      { label: "Câmeras de Pelotas", to: "/cameras-ao-vivo-pelotas" },
    ],
  },
  {
    title: "Dados e transparência",
    links: [
      { label: "Estação Embrapa", to: "/estacao-embrapa-pelotas" },
      { label: "Histórico climático", to: "/historico-climatico-pelotas" },
      { label: "Metodologia e fontes", to: "/metodologia" },
    ],
  },
] as const;

const mobiUrl =
  "https://agenciamobi.com.br/?utm_source=tempopelotas&utm_medium=footer&utm_campaign=portal_tempo_pelotas";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-content">
        <div className="footer-summary">
          <strong>Tempo Pelotas</strong>
          <p>
            Informação meteorológica e hidrológica organizada para Pelotas e a Zona Sul do Rio
            Grande do Sul.
          </p>
        </div>

        <div className="footer-navigation">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <strong>{group.title}</strong>
              <ul>
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Tempo Pelotas</span>
          <span>
            Estratégia e tecnologia por{" "}
            <a href={mobiUrl} target="_blank" rel="noreferrer">
              MOBI
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
