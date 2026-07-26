import type { ReactNode } from "react";

import type {
  InmetForecastPeriod,
  InmetStationReference,
} from "@/lib/weather/official-sources.types";

import "./inmet-official-forecast-panel.css";
import "./inmet-official-forecast-panel-refinement.css";

type ForecastIconName = "sun" | "cloud" | "rain" | "storm" | "fog" | "wind";

function formatDate(value: string | null) {
  if (!value) return { weekday: "Data", date: "não informada" };

  const parsed = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return { weekday: "Previsão", date: value };

  return {
    weekday: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
    }).format(parsed),
    date: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "short",
    }).format(parsed),
  };
}

function temperatureRange(period: InmetForecastPeriod) {
  if (period.minimum === null && period.maximum === null) return null;
  if (period.minimum === null) return `Máx. ${period.maximum}°`;
  if (period.maximum === null) return `Mín. ${period.minimum}°`;
  return `${period.minimum}° / ${period.maximum}°`;
}

function humidityRange(period: InmetForecastPeriod) {
  if (period.humidityMinimum === null && period.humidityMaximum === null) return null;
  return `${period.humidityMinimum ?? "—"}% a ${period.humidityMaximum ?? "—"}%`;
}

function windLabel(period: InmetForecastPeriod) {
  const value = [period.windDirection, period.windIntensity].filter(Boolean).join(" · ");
  return value || null;
}

function forecastWindSpeedLabel(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return `${Math.round(value)} km/h previstos pelo modelo horário`;
}

function resolveForecastIcon(summary: string): ForecastIconName {
  const normalized = summary
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  if (/trovoad|temporal|raio/.test(normalized)) return "storm";
  if (/chuva|garoa|precipit|pancada/.test(normalized)) return "rain";
  if (/nevoeiro|nevoa|cerra[cç][aã]o/.test(normalized)) return "fog";
  if (/vento|rajada/.test(normalized)) return "wind";
  if (/sol|ensolarado|ceu claro|poucas nuvens/.test(normalized)) return "sun";
  return "cloud";
}

function ForecastIcon({ name }: { name: ForecastIconName }) {
  const paths = {
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </>
    ),
    cloud: <path d="M6.5 18h10.1a4.4 4.4 0 0 0 .7-8.7A5.7 5.7 0 0 0 6.5 11 3.5 3.5 0 0 0 6.5 18Z" />,
    rain: (
      <>
        <path d="M6.5 15h10.1a4.4 4.4 0 0 0 .7-8.7A5.7 5.7 0 0 0 6.5 8 3.5 3.5 0 0 0 6.5 15Z" />
        <path d="m8 18-1 2M12 18l-1 2M16 18l-1 2" />
      </>
    ),
    storm: (
      <>
        <path d="M6.5 14h10.1a4.4 4.4 0 0 0 .7-8.7A5.7 5.7 0 0 0 6.5 7 3.5 3.5 0 0 0 6.5 14Z" />
        <path d="m13 15-3 4h3l-2 3" />
      </>
    ),
    fog: (
      <>
        <path d="M6.5 13h10.1a4.4 4.4 0 0 0 .7-8.7A5.7 5.7 0 0 0 6.5 6 3.5 3.5 0 0 0 6.5 13Z" />
        <path d="M4 17h16M6 20h12" />
      </>
    ),
    wind: <path d="M3 8h11c3.5 0 3.5-5 .2-5-1.8 0-2.7.9-2.7 2.5M3 13h15c3.5 0 3.5 6 .2 6-1.8 0-2.7-.9-2.7-2.5M3 18h7" />,
  } satisfies Record<ForecastIconName, ReactNode>;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function PeriodMetrics({
  period,
  forecastWindSpeedKmh = null,
}: {
  period: InmetForecastPeriod;
  forecastWindSpeedKmh?: number | null;
}) {
  const temperature = temperatureRange(period);
  const humidity = humidityRange(period);
  const wind = windLabel(period);
  const windSpeed = forecastWindSpeedLabel(forecastWindSpeedKmh);

  return (
    <dl className="inmet-official-metrics">
      {temperature ? (
        <div className="is-temperature">
          <dt>Temperatura</dt>
          <dd>{temperature}</dd>
        </div>
      ) : null}
      {humidity ? (
        <div>
          <dt>Umidade</dt>
          <dd>{humidity}</dd>
        </div>
      ) : null}
      {wind || windSpeed ? (
        <div className="is-wind">
          <dt>Vento</dt>
          <dd>
            {wind ? <span>{wind}</span> : null}
            {windSpeed ? <small>{windSpeed}</small> : null}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

export function InmetOfficialForecastPanel({
  periods,
  station,
  forecastWindSpeedKmh = null,
}: {
  periods: InmetForecastPeriod[];
  station: InmetStationReference["station"];
  forecastWindSpeedKmh?: number | null;
}) {
  const visiblePeriods = periods.slice(0, 4);
  const featuredPeriod = visiblePeriods[0] ?? null;
  const nextPeriods = visiblePeriods.slice(1);

  return (
    <section className="inmet-official-panel" aria-labelledby="inmet-official-title">
      <header className="inmet-official-header">
        <div className="inmet-official-heading">
          <h2 id="inmet-official-title">Previsão do tempo para Pelotas</h2>
          <p>
            Leitura institucional por períodos, apresentada separadamente da previsão horária por
            modelos e das medições observadas em estação.
          </p>
        </div>
      </header>

      {featuredPeriod ? (
        <div className="inmet-official-forecast-layout">
          <article className="inmet-official-featured">
            <div className="inmet-official-card-topline">
              <div>
                <span>{formatDate(featuredPeriod.date).weekday}</span>
                <strong>{formatDate(featuredPeriod.date).date}</strong>
              </div>
              <b>{featuredPeriod.period}</b>
            </div>

            <div className="inmet-official-featured-summary">
              <span className="inmet-official-icon is-featured">
                <ForecastIcon name={resolveForecastIcon(featuredPeriod.summary)} />
              </span>
              <div>
                <small>Síntese oficial</small>
                <h3>{featuredPeriod.summary}</h3>
              </div>
            </div>

            <PeriodMetrics
              period={featuredPeriod}
              forecastWindSpeedKmh={forecastWindSpeedKmh}
            />
          </article>

          <div className="inmet-official-next-periods" aria-label="Próximos períodos da previsão oficial">
            {nextPeriods.map((period) => {
              const formattedDate = formatDate(period.date);
              return (
                <article key={period.id}>
                  <div className="inmet-official-card-topline">
                    <div>
                      <span>{formattedDate.weekday}</span>
                      <strong>{formattedDate.date}</strong>
                    </div>
                    <b>{period.period}</b>
                  </div>

                  <div className="inmet-official-compact-summary">
                    <span className="inmet-official-icon">
                      <ForecastIcon name={resolveForecastIcon(period.summary)} />
                    </span>
                    <h3>{period.summary}</h3>
                  </div>

                  <PeriodMetrics period={period} />
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="inmet-official-unavailable">
          <strong>Previsão oficial temporariamente indisponível</strong>
          <span>
            A previsão horária do portal continua operando de forma independente enquanto uma nova
            consulta ao INMET é realizada.
          </span>
        </div>
      )}

      <footer className="inmet-official-footer">
        <div>
          <strong>Como interpretar esta seção</strong>
          <span>
            O INMET fornece a previsão municipal oficial. A condição atual exibida no portal continua
            vinculada à medição observada da Embrapa Clima Temperado.
          </span>
        </div>
        <div>
          <span>Fonte: Instituto Nacional de Meteorologia — INMET</span>
          {station ? (
            <span>
              Estação oficial de referência: {station.name}
              {station.code ? ` (${station.code})` : ""}.
            </span>
          ) : null}
        </div>
      </footer>
    </section>
  );
}
