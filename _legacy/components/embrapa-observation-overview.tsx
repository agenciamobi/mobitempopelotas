import Link from "next/link";
import type { EmbrapaObservationData } from "@/lib/embrapa-observation";

const EMBRAPA_MAP_URL = "https://maps.app.goo.gl/JjMT1vyqhzw6dqG17";
const EMBRAPA_MAP_EMBED_URL =
  "https://www.google.com/maps?q=Embrapa+Clima+Temperado+Pelotas+RS&z=14&output=embed";

type EmbrapaObservationOverviewProps = {
  observation: EmbrapaObservationData;
};

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatFetchedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ObservationIcon({ type }: { type: "temperature" | "humidity" | "wind" | "rain" }) {
  const paths = {
    temperature: (
      <>
        <path d="M9 14.7V5.5a3 3 0 0 1 6 0v9.2a5 5 0 1 1-6 0Z" />
        <path d="M12 8v8" />
      </>
    ),
    humidity: <path d="M12 3.5c3 3.7 5 6.3 5 9a5 5 0 0 1-10 0c0-2.7 2-5.3 5-9Z" />,
    wind: (
      <>
        <path d="M3 8h10.5a2.5 2.5 0 1 0-2.2-3.7" />
        <path d="M3 12h15a2.5 2.5 0 1 1-2.2 3.7" />
        <path d="M3 16h7" />
      </>
    ),
    rain: (
      <>
        <path d="M6.5 15.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.4 1.7 3.2 3.2 0 0 0-.1 6.3Z" />
        <path d="m9 18-1 2M13 18l-1 2M17 18l-1 2" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function EmbrapaObservationOverview({
  observation,
}: EmbrapaObservationOverviewProps) {
  const available = observation.status !== "unavailable";

  return (
    <section
      className="embrapa-observation-home"
      id="observacao-embrapa"
      aria-labelledby="embrapa-observation-title"
    >
      <div className="embrapa-observation-intro">
        <div>
          <span className="embrapa-stage-label">Medições feitas em Pelotas</span>
          <span className="eyebrow">Estação Embrapa Clima Temperado</span>
          <h2 id="embrapa-observation-title">
            Veja o que a estação registrou agora
          </h2>
          <p>
            Estes valores foram medidos em um ponto da Embrapa, em Pelotas. Eles mostram o tempo
            observado naquele local e ajudam a comparar com a previsão da cidade.
          </p>
        </div>
        <div className="embrapa-observation-actions">
          <Link className="embrapa-primary-action" href="/estacao-embrapa-pelotas">
            Ver todas as medições
            <span aria-hidden="true">→</span>
          </Link>
          <a
            className="embrapa-secondary-action"
            href={observation.source.url}
            target="_blank"
            rel="noreferrer"
          >
            Consultar na Embrapa
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      {available ? (
        <div className="embrapa-observation-grid">
          <article className="embrapa-current-card">
            <div className="embrapa-current-topline">
              <span className="embrapa-live-status">
                <i aria-hidden="true" />
                {observation.status === "live" ? "Medição disponível" : "Alguns valores indisponíveis"}
              </span>
              <small>
                Consultado em {formatFetchedAt(observation.source.fetchedAt)}
              </small>
            </div>

            <div className="embrapa-temperature-reading">
              <span>{formatNumber(observation.current.temperature)}°</span>
              <div>
                <strong>Temperatura medida</strong>
                <small>
                  Sensação de {formatNumber(observation.current.feelsLike)} °C
                </small>
              </div>
            </div>

            <div className="embrapa-primary-metrics">
              <div>
                <span>Umidade do ar</span>
                <strong>{formatNumber(observation.current.humidity, 0)}%</strong>
              </div>
              <div>
                <span>Possibilidade de orvalho ou neblina</span>
                <strong>{formatNumber(observation.current.dewPoint)} °C</strong>
              </div>
              <div>
                <span>Pressão do ar</span>
                <strong>{formatNumber(observation.current.pressure)} hPa</strong>
                {observation.current.pressureTrend ? (
                  <small>{observation.current.pressureTrend}</small>
                ) : null}
              </div>
            </div>
          </article>

          <div className="embrapa-observation-metrics">
            <article>
              <span className="embrapa-metric-icon">
                <ObservationIcon type="wind" />
              </span>
              <div>
                <small>Vento medido</small>
                <strong>{formatNumber(observation.current.windSpeed)} km/h</strong>
                <span>{observation.current.windDirection ?? "Direção indisponível"}</span>
              </div>
            </article>
            <article>
              <span className="embrapa-metric-icon">
                <ObservationIcon type="rain" />
              </span>
              <div>
                <small>Chuva medida hoje</small>
                <strong>{formatNumber(observation.accumulated.rainDaily)} mm</strong>
                <span>{formatNumber(observation.accumulated.rainMonthly)} mm no mês</span>
              </div>
            </article>
            <article>
              <span className="embrapa-metric-icon">
                <ObservationIcon type="temperature" />
              </span>
              <div>
                <small>Menor e maior temperatura de hoje</small>
                <strong>
                  {formatNumber(observation.extremes.temperatureMin.value)}° /{" "}
                  {formatNumber(observation.extremes.temperatureMax.value)}°
                </strong>
                <span>
                  Mín. {observation.extremes.temperatureMin.time ?? "—"} · Máx.{" "}
                  {observation.extremes.temperatureMax.time ?? "—"}
                </span>
              </div>
            </article>
            <article>
              <span className="embrapa-metric-icon">
                <ObservationIcon type="humidity" />
              </span>
              <div>
                <small>Água que voltou para o ar hoje</small>
                <strong>
                  {formatNumber(observation.accumulated.evapotranspirationDaily, 2)} mm
                </strong>
                <span>
                  {formatNumber(observation.accumulated.evapotranspirationMonthly, 2)} mm no mês
                </span>
              </div>
            </article>
          </div>

          <aside className="embrapa-station-context">
            <span className="eyebrow">Onde fica a estação</span>
            <h3>Sede da Embrapa Clima Temperado</h3>
            <p>
              A leitura representa esse local específico. O tempo pode ser diferente no Centro,
              Laranjal, bairros mais distantes e áreas rurais.
            </p>

            <div className="embrapa-station-map">
              <iframe
                src={EMBRAPA_MAP_EMBED_URL}
                title="Localização da sede da Embrapa Clima Temperado em Pelotas"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a href={EMBRAPA_MAP_URL} target="_blank" rel="noreferrer">
                <LocationIcon />
                <span>
                  <strong>Ver localização</strong>
                  <small>Abrir no Google Maps</small>
                </span>
                <b aria-hidden="true">↗</b>
              </a>
            </div>

            <dl>
              <div>
                <dt>Nascer do sol</dt>
                <dd>{observation.current.sunrise ?? "—"}</dd>
              </div>
              <div>
                <dt>Pôr do sol</dt>
                <dd>{observation.current.sunset ?? "—"}</dd>
              </div>
              <div>
                <dt>Chuva no ano</dt>
                <dd>{formatNumber(observation.accumulated.rainAnnual)} mm</dd>
              </div>
            </dl>
            <p className="embrapa-source-note">
              Fonte: Embrapa Clima Temperado. A atualização pode atrasar durante manutenção ou falha
              da estação.
            </p>
          </aside>
        </div>
      ) : (
        <div className="embrapa-unavailable-card" role="status">
          <strong>Medições temporariamente indisponíveis</strong>
          <p>{observation.error}</p>
          <a href={observation.source.url} target="_blank" rel="noreferrer">
            Consultar diretamente na Embrapa
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </section>
  );
}
