import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Gauge,
  Info,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import "./WeatherEditorialHero.css";

const confidenceLabels = {
  high: "Alta confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

type HeroLevel = "normal" | "attention" | "warning";

type HeroMetricProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function HeroMetric({ icon: Icon, label, value }: HeroMetricProps) {
  return (
    <div className="weather-editorial-metric">
      <Icon aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function displayNumber(value: number | null, suffix: string) {
  return value === null ? "—" : `${value}${suffix}`;
}

function resolveHeroLevel(weather: WeatherIntelligenceData["weather"]): HeroLevel {
  const activeAlerts = weather.alerts.filter((alert) => alert.period === "active");
  if (
    activeAlerts.some((alert) => alert.severity === "danger" || alert.severity === "great-danger")
  ) {
    return "warning";
  }

  if (
    activeAlerts.length > 0 ||
    weather.quality.confidence === "low" ||
    weather.quality.degradedSources.length >= 3
  ) {
    return "attention";
  }

  return "normal";
}

function resolveHeroTitle(data: WeatherIntelligenceData, level: HeroLevel) {
  const today = data.weather.daily[0];
  const condition = data.weather.current?.condition?.toLocaleLowerCase("pt-BR") ?? "";

  if (level === "warning") {
    return {
      title: "Há risco de tempo forte.",
      highlight: "Acompanhe chuva, vento e alertas.",
    };
  }

  if (level === "attention") {
    return {
      title: "O tempo pede atenção.",
      highlight: "Confira os próximos horários.",
    };
  }

  if ((today?.rainChance ?? 0) >= 60 || /chuva|garoa|temporal|trovoada/.test(condition)) {
    return {
      title: "A chuva deve marcar o dia.",
      highlight: "Veja quando a intensidade aumenta.",
    };
  }

  if ((today?.max ?? data.weather.current?.temperature ?? 20) <= 15) {
    return {
      title: "O frio permanece em Pelotas.",
      highlight: "Confira mínima, máxima e sensação.",
    };
  }

  if ((today?.max ?? data.weather.current?.temperature ?? 20) >= 30) {
    return {
      title: "O calor ganha destaque.",
      highlight: "Planeje os horários do dia.",
    };
  }

  return {
    title: "Veja as condições para hoje.",
    highlight: "Planeje o restante do dia.",
  };
}

function statusLabel(level: HeroLevel, activeAlertCount: number) {
  if (level === "warning") {
    return activeAlertCount === 1
      ? "Aviso oficial ativo"
      : `${activeAlertCount} avisos oficiais ativos`;
  }
  if (level === "attention") return "Monitoramento em atenção";
  return "Monitoramento atualizado";
}

export function WeatherEditorialHero({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const current = weather.current;
  const today = weather.daily[0];
  const cppmetToday = weather.officialForecast[0];
  const level = resolveHeroLevel(weather);
  const title = resolveHeroTitle(data, level);
  const activeAlertCount = weather.alerts.filter((alert) => alert.period === "active").length;
  const description = cppmetToday?.summary || data.brief.summary;
  const currentSource = "Embrapa Clima Temperado";

  return (
    <section
      className={`weather-editorial-hero weather-editorial-hero-${level}`}
      aria-labelledby="weather-editorial-title"
    >
      <div className="weather-editorial-photo" aria-hidden="true" />
      <div className="weather-editorial-photo-overlay" aria-hidden="true" />

      <div className="weather-editorial-content">
        <div className="weather-editorial-copy">
          <span className={`weather-editorial-status weather-editorial-status-${level}`}>
            <i aria-hidden="true" />
            {statusLabel(level, activeAlertCount)}
          </span>

          <p className="weather-editorial-kicker">Tempo e águas em Pelotas</p>
          <h1 id="weather-editorial-title">
            {title.title}
            <em>{title.highlight}</em>
          </h1>
          <p className="weather-editorial-description">{description}</p>

          {cppmetToday ? (
            <p className="weather-editorial-description-source">
              Contexto regional elaborado pelo CPPMet / UFPel
            </p>
          ) : null}

          {today ? (
            <dl className="weather-editorial-facts" aria-label="Resumo da previsão de hoje">
              <div>
                <dt>Máx. e mín. previstas</dt>
                <dd>
                  {today.max}° <small>/ {today.min}°</small>
                </dd>
              </div>
              <div>
                <dt>Chance máxima de chuva</dt>
                <dd>{today.rainChance === null ? "Não informada" : `${today.rainChance}%`}</dd>
              </div>
              <div>
                <dt>Rajada máxima prevista</dt>
                <dd>
                  {today.windGust === null ? (
                    "Não informada"
                  ) : (
                    <>
                      {today.windGust} <small>km/h</small>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="weather-editorial-actions">
            <Link className="weather-editorial-primary" to="/tempo-hoje-pelotas">
              Ver previsão de hoje
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="weather-editorial-secondary" to="/previsao-7-dias-pelotas">
              Ver previsão para 7 dias
            </Link>
          </div>
        </div>

        <aside
          className={`weather-editorial-now${current ? "" : " is-unavailable"}`}
          aria-label={
            current ? "Medição atual da Embrapa em Pelotas" : "Medição atual indisponível"
          }
        >
          <div className="weather-editorial-now-heading">
            <div>
              <strong>Pelotas, RS</strong>
              <small>
                {current?.observedAt
                  ? `Leitura das ${current.observedAt} · ${currentSource}`
                  : `Medição recente indisponível · ${currentSource}`}
              </small>
            </div>
            <span className="weather-editorial-live">
              <i aria-hidden="true" /> {current ? "Medição" : "Indisponível"}
            </span>
          </div>

          {current ? (
            <>
              <div className="weather-editorial-visual">
                <div className="weather-editorial-icon">
                  <Gauge aria-hidden="true" size={64} strokeWidth={1.55} />
                </div>
                <div className="weather-editorial-temperature">
                  <strong>{current.temperature === null ? "—" : `${current.temperature}°`}</strong>
                  <div>
                    <span>Medição da estação</span>
                    <small>
                      {current.feelsLike === null
                        ? "Sensação não informada"
                        : `Sensação de ${current.feelsLike}°`}
                    </small>
                  </div>
                </div>
              </div>

              <div className="weather-editorial-metrics">
                <HeroMetric
                  icon={Droplets}
                  label="Umidade"
                  value={displayNumber(current.humidity, "%")}
                />
                <HeroMetric
                  icon={Wind}
                  label="Vento medido"
                  value={displayNumber(current.windSpeed, " km/h")}
                />
                <HeroMetric
                  icon={Gauge}
                  label="Pressão"
                  value={displayNumber(current.pressure, " hPa")}
                />
                <HeroMetric icon={Wind} label="Direção" value={current.windDirection ?? "—"} />
              </div>
            </>
          ) : (
            <div className="weather-editorial-forecast-only">
              <Gauge aria-hidden="true" size={54} strokeWidth={1.55} />
              <strong>Medição atual indisponível</strong>
              <span>A previsão permanece disponível abaixo, separada da observação local.</span>
            </div>
          )}

          <div className="weather-editorial-quality">
            <span
              className={`weather-editorial-confidence weather-editorial-confidence-${weather.quality.confidence}`}
            >
              {weather.quality.confidence === "high" ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <Info aria-hidden="true" />
              )}
              {confidenceLabels[weather.quality.confidence]}
            </span>
            <small>Índice de qualidade {weather.quality.score}/100</small>
          </div>
        </aside>
      </div>

      <a
        className="weather-editorial-credit"
        href="https://commons.wikimedia.org/wiki/File:Amanhecer_na_Praia_do_Laranjal.jpg"
        target="_blank"
        rel="noreferrer"
      >
        Praia do Laranjal · Sebastian2112 / CC BY-SA 4.0
      </a>
    </section>
  );
}
