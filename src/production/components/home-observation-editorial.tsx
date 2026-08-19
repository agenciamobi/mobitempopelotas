import Link from "@/production/compat/NextLink";
import type { EmbrapaObservationData } from "@/production/lib/embrapa-observation";
import type { WeatherData } from "@/production/lib/weather-data";

import "./home-observation-editorial.css";

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "Indisponível";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function observationStatusLabel(observation: EmbrapaObservationData) {
  if (observation.status === "partial") return "Alguns dados ainda não foram atualizados";
  if (observation.source.observationTime) {
    return `Atualizado às ${observation.source.observationTime}`;
  }
  return "Dados atualizados";
}

export function HomeObservationEditorial({
  weather,
  observation,
}: {
  weather: WeatherData;
  observation: EmbrapaObservationData;
}) {
  const available = weather.current.available;

  return (
    <section
      className="tp-home-observation"
      id="observacao-embrapa"
      aria-labelledby="tp-home-observation-title"
    >
      <header className="tp-home-observation__intro">
        <div>
          <span>Medição local · Embrapa</span>
          <h2 id="tp-home-observation-title">O que está sendo medido em Pelotas agora</h2>
        </div>
        <div className="tp-home-observation__context">
          <p>
            Diferente da previsão, esta seção mostra a observação local mais recente disponível da
            Embrapa Clima Temperado.
          </p>
          <Link href="/estacao-embrapa-pelotas">
            Ver dados completos da estação <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {available ? (
        <div className="tp-home-observation__reading">
          <div className="tp-home-observation__temperature">
            <small>{observationStatusLabel(observation)}</small>
            <strong>{formatNumber(weather.current.temperature)}°</strong>
            <span>
              {weather.current.feelsLike === null
                ? "Sensação indisponível"
                : `Sensação de ${formatNumber(weather.current.feelsLike)} °C`}
            </span>
          </div>

          <dl className="tp-home-observation__metrics">
            <div>
              <dt>Umidade</dt>
              <dd>
                {weather.current.humidity === null
                  ? "Indisponível"
                  : `${formatNumber(weather.current.humidity, 0)}%`}
              </dd>
            </div>
            <div>
              <dt>Vento agora</dt>
              <dd>
                {weather.current.windSpeed === null
                  ? "Indisponível"
                  : `${formatNumber(weather.current.windSpeed)} km/h`}
              </dd>
            </div>
            <div>
              <dt>Chuva registrada hoje</dt>
              <dd>{formatNumber(observation.accumulated.rainDaily)} mm</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="tp-home-observation__unavailable" role="status">
          <strong>Os dados da Embrapa estão indisponíveis agora</strong>
          <span>A previsão e as demais fontes do portal continuam disponíveis.</span>
        </div>
      )}
    </section>
  );
}
