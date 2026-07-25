import type {
  InmetForecastPeriod,
  InmetStationReference,
} from "@/lib/weather/official-sources.types";

import "./inmet-official-forecast-panel.css";

const INMET_PORTAL_URL = "https://portal.inmet.gov.br/";

function formatDate(value: string | null) {
  if (!value) return "Data não informada";
  const date = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function temperatureRange(period: InmetForecastPeriod) {
  if (period.minimum === null && period.maximum === null) return null;
  if (period.minimum === null) return `Máx. ${period.maximum}°`;
  if (period.maximum === null) return `Mín. ${period.minimum}°`;
  return `${period.minimum}° / ${period.maximum}°`;
}

export function InmetOfficialForecastPanel({
  periods,
  station,
}: {
  periods: InmetForecastPeriod[];
  station: InmetStationReference["station"];
}) {
  const visiblePeriods = periods.slice(0, 4);

  return (
    <section className="inmet-official-panel" aria-labelledby="inmet-official-title">
      <header>
        <div>
          <span>Referência institucional</span>
          <h2 id="inmet-official-title">Previsão oficial do INMET para Pelotas</h2>
          <p>
            Síntese municipal oficial apresentada separadamente da previsão horária por modelos.
          </p>
        </div>
        <a href={INMET_PORTAL_URL} target="_blank" rel="noreferrer">
          Consultar o INMET <span aria-hidden="true">↗</span>
        </a>
      </header>

      {visiblePeriods.length > 0 ? (
        <div className="inmet-official-grid">
          {visiblePeriods.map((period) => {
            const range = temperatureRange(period);
            return (
              <article key={period.id}>
                <div className="inmet-official-period-heading">
                  <span>{formatDate(period.date)}</span>
                  <strong>{period.period}</strong>
                </div>
                <p>{period.summary}</p>
                <dl>
                  {range ? (
                    <div>
                      <dt>Temperatura</dt>
                      <dd>{range}</dd>
                    </div>
                  ) : null}
                  {period.humidityMinimum !== null || period.humidityMaximum !== null ? (
                    <div>
                      <dt>Umidade</dt>
                      <dd>
                        {period.humidityMinimum ?? "—"}% a {period.humidityMaximum ?? "—"}%
                      </dd>
                    </div>
                  ) : null}
                  {period.windDirection || period.windIntensity ? (
                    <div>
                      <dt>Vento</dt>
                      <dd>{[period.windDirection, period.windIntensity].filter(Boolean).join(" · ")}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="inmet-official-unavailable">
          A previsão municipal oficial está temporariamente indisponível. A previsão horária do portal
          continua operando de forma independente.
        </div>
      )}

      <footer>
        <span>
          Fonte: INMET · código IBGE de Pelotas 4314407
        </span>
        {station ? (
          <span>
            Estação de referência: {station.name}
            {station.code ? ` (${station.code})` : ""}. A medição atual do portal permanece vinculada à
            Embrapa Clima Temperado.
          </span>
        ) : null}
      </footer>
    </section>
  );
}
