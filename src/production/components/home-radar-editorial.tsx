import Link from "@/production/compat/NextLink";
import { WeatherMap } from "@/production/components/weather-map";
import type { WeatherData } from "@/production/lib/weather-data";

import "./home-radar-editorial.css";

export function HomeRadarEditorial({ regionalWeather }: { regionalWeather: WeatherData["regional"] }) {
  return (
    <section className="tp-home-radar" aria-labelledby="tp-home-radar-title">
      <header className="tp-home-radar__intro">
        <div className="tp-home-radar__heading">
          <span>Monitoramento em tempo real</span>
          <h2 id="tp-home-radar-title">
            Radar e satélite para acompanhar chuva, nebulosidade e trovoadas
          </h2>
          <p>
            Camadas meteorológicas oficiais com foco em Pelotas e na Zona Sul. O mapa mostra o
            passado recente observado; não é uma projeção do deslocamento futuro.
          </p>
        </div>

        <div className="tp-home-radar__meta-wrap">
          <dl className="tp-home-radar__meta" aria-label="Referências do monitoramento">
            <div>
              <dt>Fonte</dt>
              <dd>REDEMET / DECEA</dd>
            </div>
            <div>
              <dt>Radar de referência</dt>
              <dd>Santiago / RS</dd>
              <small>seleção operacional conforme cobertura e disponibilidade</small>
            </div>
            <div>
              <dt>Foco</dt>
              <dd>Pelotas e Zona Sul</dd>
            </div>
          </dl>

          <Link className="tp-home-radar__detail-link" href="/radar-e-satelite-pelotas">
            Abrir monitoramento completo <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <div className="tp-home-radar__frame">
        <WeatherMap regionalWeather={regionalWeather} />
      </div>

      <div className="tp-home-radar__guide" aria-label="Como interpretar as camadas meteorológicas">
        <div className="tp-home-radar__guide-heading">
          <span>Como interpretar</span>
          <p>Compare as camadas pelo horário exibido. Cada produto responde a uma pergunta diferente.</p>
        </div>
        <div className="tp-home-radar__guide-items">
          <div>
            <strong>Radar</strong>
            <span>Ajuda a localizar áreas associadas à precipitação observada.</span>
          </div>
          <div>
            <strong>Satélite</strong>
            <span>Mostra cobertura e organização das nuvens em escala regional.</span>
          </div>
          <div>
            <strong>Trovoadas</strong>
            <span>Indica atividade elétrica detectada pelo produto STSC.</span>
          </div>
        </div>
        <p className="tp-home-radar__safety">
          Monitoramento visual não substitui avisos oficiais. Em situação de risco, consulte INMET,
          Defesa Civil e autoridades locais.
        </p>
      </div>
    </section>
  );
}
