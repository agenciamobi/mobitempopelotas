import Link from "next/link";
import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function LagoonLevelHomeCard() {
  return (
    <section
      className="home-lagoon-card"
      aria-labelledby="home-lagoon-card-title"
    >
      <div className="home-lagoon-card-heading">
        <div>
          <span className="eyebrow">Praia do Laranjal</span>
          <h2 id="home-lagoon-card-title">Nível da Lagoa dos Patos</h2>
        </div>
        <Link href="/nivel-da-lagoa-dos-patos-laranjal">
          Saiba o que observar
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="home-lagoon-frame">
        <iframe
          src={LAGOON_LEVEL_SOURCE.dashboardUrl}
          title="Nível da Lagoa dos Patos na Estação Laranjal"
          loading="lazy"
          allow="fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />

        <div className="home-lagoon-toolbar">
          <span>
            <i aria-hidden="true" />
            Estação Laranjal
          </span>
          <a
            href={LAGOON_LEVEL_SOURCE.dashboardUrl}
            target="_blank"
            rel="noreferrer"
          >
            Abrir medidor completo
            <ExternalIcon />
          </a>
        </div>
      </div>

      <p className="home-lagoon-note">
        Veja se o nível está subindo ou baixando. Considere também o vento, a chuva e os avisos da
        Defesa Civil. Medição fornecida pelo LabHidroSens / UFPel.
      </p>
    </section>
  );
}
