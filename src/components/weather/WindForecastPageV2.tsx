import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Compass,
  Gauge,
  Navigation,
  RefreshCw,
  Wind,
} from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./RainWindPages.css";

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatWind(speed: number | null | undefined, direction: string | null | undefined) {
  if (speed === null || speed === undefined) return "Não informado";
  return direction ? `${speed} km/h · ${direction}` : `${speed} km/h`;
}

function gustLabel(value: number | null | undefined) {
  return value === null || value === undefined ? "Não informada" : `${value} km/h`;
}

function EmptyWindPage() {
  return (
    <section className="condition-empty" aria-labelledby="wind-unavailable-title">
      <p className="condition-kicker">Vento em Pelotas</p>
      <h1 id="wind-unavailable-title">Os dados de vento estão em atualização</h1>
      <p>As fontes ainda não publicaram velocidade ou rajadas suficientes. Nenhum valor foi estimado manualmente.</p>
      <Link to="/tempo-hoje-pelotas">
        <ArrowLeft aria-hidden="true" /> Ver o tempo de hoje
      </Link>
    </section>
  );
}

export function WindForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const current = weather.current;

  if (!current && weather.hourly.length === 0 && weather.daily.length === 0) {
    return <EmptyWindPage />;
  }

  const hasCurrentWind = current?.windSpeed !== null && current?.windSpeed !== undefined;
  const observedByEmbrapa = hasCurrentWind && weather.quality.currentSource === "embrapa";
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);
  const hoursWithGust = hours.filter((hour) => hour.windGust !== null);
  const windiestHour = hoursWithGust.length
    ? hoursWithGust.reduce((selected, hour) =>
        (hour.windGust ?? -1) > (selected.windGust ?? -1) ? hour : selected,
      )
    : null;
  const daysWithGust = days.filter((day) => day.windGust !== null);
  const windiestDay = daysWithGust.length
    ? daysWithGust.reduce((selected, day) =>
        (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,
      )
    : null;
  const maximumForecastGust = Math.max(
    windiestHour?.windGust ?? -1,
    windiestDay?.windGust ?? -1,
  );
  const windLevel =
    maximumForecastGust < 0
      ? "normal"
      : maximumForecastGust >= 70
        ? "warning"
        : maximumForecastGust >= 50
          ? "attention"
          : "normal";
  const activeWindAlerts = weather.alerts.filter(
    (alert) =>
      alert.period === "active" &&
      /vento|vendaval|rajada|tempestade|ciclone/i.test(
        `${alert.event} ${alert.headline} ${alert.description}`,
      ),
  );

  const headline =
    maximumForecastGust < 0
      ? "A velocidade está disponível, mas as rajadas ainda não foram informadas"
      : windLevel === "warning"
        ? "Rajadas fortes aparecem na previsão"
        : windLevel === "attention"
          ? "Alguns horários podem ter rajadas mais intensas"
          : "As rajadas previstas permanecem moderadas";

  return (
    <div className="condition-page condition-page-wind">
      <header className="condition-page-header">
        <div>
          <Link className="condition-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Visão geral
          </Link>
          <p className="condition-kicker">Vento em Pelotas</p>
          <h1>Vento em Pelotas: velocidade, direção e rajadas</h1>
          <p>
            Veja o vento atual quando houver medição local e compare as rajadas previstas para as
            próximas horas e os próximos sete dias.
          </p>
        </div>
      </header>

      <section
        className={`condition-highlight condition-highlight-wind condition-wind-${windLevel}`}
        aria-labelledby="wind-highlight-title"
      >
        <div>
          <p className="condition-kicker">Resumo do vento</p>
          <h2 id="wind-highlight-title">{headline}</h2>
          <p>
            {hasCurrentWind
              ? observedByEmbrapa
                ? `A estação da Embrapa registrou ${formatWind(current?.windSpeed, current?.windDirection)}. As rajadas abaixo são previsões do modelo.`
                : `O valor atual de ${formatWind(current?.windSpeed, current?.windDirection)} é estimado pelo modelo. As rajadas abaixo também são previstas.`
              : "A leitura atual está indisponível. Os valores das próximas horas e dos próximos dias são previsões."}
          </p>
        </div>

        <div className="condition-highlight-reading">
          <Wind aria-hidden="true" />
          <strong>{hasCurrentWind ? current?.windSpeed : "—"}</strong>
          <span>
            {hasCurrentWind
              ? `${observedByEmbrapa ? "km/h observados" : "km/h estimados"}${current?.windDirection ? ` · ${current.windDirection}` : ""}`
              : "vento atual indisponível"}
          </span>
        </div>
      </section>

      <section className="condition-summary-grid" aria-label="Principais informações sobre o vento">
        <article>
          <Navigation aria-hidden="true" />
          <span>Vento atual</span>
          <strong>{formatWind(current?.windSpeed, current?.windDirection)}</strong>
          <small>{observedByEmbrapa ? "Observado pela Embrapa" : hasCurrentWind ? "Estimado pelo modelo" : "Em atualização"}</small>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <span>Maior rajada nas próximas 12 horas</span>
          <strong>{gustLabel(windiestHour?.windGust)}</strong>
          <small>{windiestHour?.time ? `Prevista para ${windiestHour.time}` : "Horário não informado"}</small>
        </article>
        <article>
          <Compass aria-hidden="true" />
          <span>Maior rajada nos próximos 7 dias</span>
          <strong>{gustLabel(windiestDay?.windGust)}</strong>
          <small>{windiestDay?.weekday ?? "Dia não informado"}</small>
        </article>
      </section>

      {activeWindAlerts.length > 0 || windLevel !== "normal" ? (
        <section className="condition-alert condition-alert-wind">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>
              {activeWindAlerts.length
                ? activeWindAlerts.length === 1
                  ? "Há 1 aviso oficial relacionado a vento ou tempestade"
                  : `Há ${activeWindAlerts.length} avisos oficiais relacionados a vento ou tempestade`
                : windLevel === "warning"
                  ? "A previsão indica rajadas fortes"
                  : "A previsão indica períodos com rajadas mais intensas"}
            </strong>
            <span>
              {activeWindAlerts[0]?.headline ||
                activeWindAlerts[0]?.event ||
                "Objetos soltos, estruturas leves e atividades ao ar livre podem exigir atenção."}
            </span>
          </div>
          <Link to="/alertas">
            Ver avisos oficiais <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {hours.length > 0 ? (
        <section className="condition-section" aria-labelledby="wind-hourly-title">
          <div className="condition-section-heading">
            <div>
              <p className="condition-kicker">Próximas 12 horas</p>
              <h2 id="wind-hourly-title">Velocidade e rajadas previstas por horário</h2>
            </div>
            <Link to="/tempo-hoje-pelotas">Ver temperatura e chuva de hoje</Link>
          </div>

          <div className="wind-hourly-grid">
            {hours.map((hour, index) => (
              <article key={`${hour.time}-${index}`}>
                <span>{hour.time}</span>
                <Wind aria-hidden="true" />
                <strong>{hour.windSpeed} km/h</strong>
                <small>
                  {hour.windGust === null
                    ? "Rajada não informada"
                    : `Rajada máxima de ${hour.windGust} km/h`}
                </small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {days.length > 0 ? (
        <section className="condition-section" aria-labelledby="wind-week-title">
          <div className="condition-section-heading">
            <div>
              <p className="condition-kicker">Próximos 7 dias</p>
              <h2 id="wind-week-title">Rajada máxima prevista em cada dia</h2>
            </div>
            <Link to="/previsao-7-dias-pelotas">Ver previsão semanal completa</Link>
          </div>

          <div className="wind-week-list">
            {days.map((day) => (
              <article key={`${day.weekday}-${day.date}`}>
                <div>
                  <strong>{day.weekday}</strong>
                  <span>{day.date}</span>
                </div>
                <Wind aria-hidden="true" />
                <div className="wind-gust-track" aria-hidden="true">
                  <span
                    style={{
                      width: `${day.windGust === null ? 0 : Math.min(100, Math.max(8, day.windGust))}%`,
                    }}
                  />
                </div>
                <strong>{gustLabel(day.windGust)}</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <p className="condition-source-note">
        Atualizado em {formatFetchedAt(weather.source.fetchedAt)}. O vento atual é identificado como
        observação local ou estimativa. As rajadas futuras são previsões e podem variar entre bairros,
        áreas abertas e a orla da Lagoa dos Patos.
      </p>
    </div>
  );
}
