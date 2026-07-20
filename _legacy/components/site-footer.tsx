import Link from "next/link";
import type { WeatherData } from "@/lib/weather-data";

const MOBI_SITE_URL =
  "https://agenciamobi.com.br/?utm_source=tempopelotas&utm_medium=footer&utm_campaign=portal_tempo_pelotas";

const footerGroups = [
  {
    title: "Previsão",
    links: [
      { label: "Tempo agora", href: "/" },
      { label: "Previsão para hoje", href: "/tempo-hoje-pelotas" },
      { label: "Próximos 7 dias", href: "/previsao-7-dias-pelotas" },
      { label: "Chuva em Pelotas", href: "/chuva-em-pelotas" },
      { label: "Vento em Pelotas", href: "/vento-em-pelotas" },
    ],
  },
  {
    title: "Águas e atenção",
    links: [
      { label: "Situação hidrológica", href: "/situacao-hidrologica-pelotas" },
      { label: "Nível da Lagoa dos Patos", href: "/nivel-da-lagoa-dos-patos-laranjal" },
      { label: "Condições de atenção", href: "/alertas" },
      { label: "Câmeras de Pelotas", href: "/cameras-ao-vivo-pelotas" },
    ],
  },
  {
    title: "Dados e transparência",
    links: [
      { label: "Estação Embrapa", href: "/estacao-embrapa-pelotas" },
      { label: "Histórico climático", href: "/historico-climatico-pelotas" },
      { label: "Metodologia e fontes", href: "/metodologia" },
      { label: "Dados em JSON", href: "/pelotas.json" },
    ],
  },
] as const;

type SiteFooterProps = {
  source: WeatherData["source"];
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.01" />
    </svg>
  );
}

function WaterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9c2.2 0 2.2-1.5 4.5-1.5S9.8 9 12 9s2.2-1.5 4.5-1.5S18.8 9 21 9M3 14c2.2 0 2.2-1.5 4.5-1.5S9.8 14 12 14s2.2-1.5 4.5-1.5S18.8 14 21 14M3 19c2.2 0 2.2-1.5 4.5-1.5S9.8 19 12 19s2.2-1.5 4.5-1.5S18.8 19 21 19" />
    </svg>
  );
}

export function SiteFooter({ source }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();
  const sourceStatus = source.isFallback ? "Operação em contingência" : "Fontes conectadas";
  const activeSources = Array.from(
    new Set(
      [source.observationName, source.forecastName, source.name]
        .filter((item): item is string => Boolean(item?.trim()))
        .map((item) => item.trim()),
    ),
  ).slice(0, 3);

  return (
    <footer className="site-footer-v2">
      <div className="portal-footer--theme">
        <div className="portal-footer-atmosphere" aria-hidden="true">
          <span />
          <span />
        </div>

        <section className="portal-footer-lead" aria-labelledby="portal-footer-title">
          <div className="portal-footer-identity">
            <Link className="portal-footer-brand" href="/" aria-label="TEMPO Pelotas — página inicial">
              <img
                className="portal-footer-logo"
                src="/brand/tempo-pelotas-header"
                alt="TEMPO Pelotas"
                width={900}
                height={180}
                loading="lazy"
                draggable={false}
              />
            </Link>

            <p>
              Informação meteorológica e hidrológica organizada para Pelotas e a Zona Sul do Rio
              Grande do Sul.
            </p>

            <div className="portal-footer-identity-tags" aria-label="Abrangência da plataforma">
              <span>Pelotas · RS</span>
              <span>Tempo · Águas · Alertas</span>
            </div>
          </div>

          <div className="portal-footer-message">
            <span className="portal-footer-kicker">Informação local para agir melhor</span>
            <h2 id="portal-footer-title">Entenda o tempo. Acompanhe as águas. Prepare-se.</h2>
            <p>
              Consulte condições observadas, previsão, chuva, vento e níveis das águas em uma visão
              integrada da região.
            </p>

            <div className="portal-footer-main-actions">
              <Link className="portal-footer-primary-action" href="/alertas">
                Ver condições de atenção
                <ArrowIcon />
              </Link>
              <Link className="portal-footer-secondary-action" href="/tempo-hoje-pelotas">
                Consultar previsão de hoje
              </Link>
            </div>
          </div>

          <aside className={`portal-footer-source-panel${source.isFallback ? " is-fallback" : ""}`}>
            <div className="portal-footer-source-heading">
              <span className="portal-footer-status-dot" aria-hidden="true" />
              <div>
                <small>Estado dos dados</small>
                <strong>{sourceStatus}</strong>
              </div>
            </div>

            <ul aria-label="Fontes meteorológicas em uso">
              {activeSources.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <Link href="/metodologia">
              Como os dados são utilizados
              <ArrowIcon />
            </Link>
          </aside>
        </section>

        <div className="portal-footer-rule" aria-hidden="true" />

        <section className="portal-footer-body" aria-label="Navegação e acessos prioritários">
          <div className="portal-footer-directory">
            {footerGroups.map((group) => (
              <nav className="portal-footer-column" aria-label={group.title} key={group.title}>
                <strong>{group.title}</strong>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>
                        <span>{link.label}</span>
                        <ArrowIcon />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <aside className="portal-footer-priority">
            <span className="portal-footer-kicker">Acessos prioritários</span>

            <Link className="portal-footer-priority-card portal-footer-priority-card--alert" href="/alertas">
              <span className="portal-footer-priority-icon">
                <AlertIcon />
              </span>
              <span>
                <small>Chuva, vento e temporal</small>
                <strong>Condições de atenção</strong>
              </span>
              <ArrowIcon />
            </Link>

            <Link
              className="portal-footer-priority-card portal-footer-priority-card--water"
              href="/nivel-da-lagoa-dos-patos-laranjal"
            >
              <span className="portal-footer-priority-icon">
                <WaterIcon />
              </span>
              <span>
                <small>Estação Laranjal</small>
                <strong>Nível da Lagoa dos Patos</strong>
              </span>
              <ArrowIcon />
            </Link>
          </aside>
        </section>

        <section className="portal-footer-guidance" aria-label="Orientação de segurança">
          <span aria-hidden="true">i</span>
          <p>
            O TEMPO Pelotas organiza informações para acompanhamento. Em situações de risco, siga os
            comunicados da Defesa Civil, do INMET e das autoridades locais.
          </p>
          <Link href="/metodologia">Entenda os limites e as fontes</Link>
        </section>

        <div className="portal-footer-bottom">
          <div className="portal-footer-copyright">
            <strong>TEMPO Pelotas</strong>
            <span>© {currentYear} · Informação meteorológica local.</span>
          </div>

          <nav className="portal-footer-legal" aria-label="Links institucionais">
            <Link href="/metodologia">Metodologia</Link>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                Fonte meteorológica
              </a>
            ) : null}
          </nav>

          <a className="portal-footer-mobi" href={MOBI_SITE_URL} target="_blank" rel="noreferrer">
            <span>Estratégia e tecnologia</span>
            <strong>MOBI ↗</strong>
          </a>
        </div>
      </div>
    </footer>
  );
}
