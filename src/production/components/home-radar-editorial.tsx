import { WeatherMap } from "@/production/components/weather-map";
import type { WeatherData } from "@/production/lib/weather-data";

import "./home-radar-editorial.css";

export function HomeRadarEditorial({ regionalWeather }: { regionalWeather: WeatherData["regional"] }) {
  return (
    <section className="tp-home-radar" aria-labelledby="tp-home-radar-title">
      <header className="tp-home-radar__intro">
        <div>
          <span>Radar e satélite</span>
          <h2 id="tp-home-radar-title">Acompanhe a chuva e as nuvens na região</h2>
        </div>
        <div className="tp-home-radar__context">
          <p>Use o mapa para observar o que se aproxima de Pelotas e das cidades da Zona Sul.</p>
          <p>
            <strong>Radar</strong> mostra a precipitação observada. <strong>Satélite</strong> ajuda a
            acompanhar a nebulosidade e <strong>Trovoadas</strong> mostra ocorrências detectadas pela
            REDEMET.
          </p>
        </div>
      </header>

      <div className="tp-home-radar__frame">
        <WeatherMap regionalWeather={regionalWeather} />
      </div>
    </section>
  );
}
