import Link from "next/link";

function WaterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 15.5c2.2 0 2.2-1.5 4.4-1.5s2.2 1.5 4.4 1.5 2.2-1.5 4.4-1.5 2.2 1.5 4.8 1.5" />
      <path d="M3 19c2.2 0 2.2-1.5 4.4-1.5S9.6 19 11.8 19s2.2-1.5 4.4-1.5S18.4 19 21 19" />
      <path d="M12 4.5c2.1 2.5 3.4 4.2 3.4 6a3.4 3.4 0 0 1-6.8 0c0-1.8 1.3-3.5 3.4-6Z" />
    </svg>
  );
}

export function LagoonLevelTeaser() {
  return (
    <section className="lagoon-teaser" aria-labelledby="lagoon-teaser-title">
      <div className="lagoon-teaser-icon">
        <WaterIcon />
      </div>
      <div>
        <span className="eyebrow">Praia do Laranjal</span>
        <h2 id="lagoon-teaser-title">Nível da Lagoa dos Patos</h2>
        <p>
          Veja a medição da Estação Laranjal e acompanhe se o nível está subindo, estável ou baixando.
        </p>
      </div>
      <Link href="/nivel-da-lagoa-dos-patos-laranjal">
        Acompanhar o nível
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
