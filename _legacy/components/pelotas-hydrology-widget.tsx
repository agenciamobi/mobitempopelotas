"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LaranjalLevelData } from "@/lib/laranjal-level";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 160;
const CHART_PADDING = 10;

type WidgetHeading = "h2" | "h3";

export type PelotasHydrologyWidgetProps = {
  initialData: LaranjalLevelData;
  weather: {
    windSpeed: number;
    windDirection: string;
    windGust: number;
    precipitation: number;
  };
  headingLevel?: WidgetHeading;
  className?: string;
};

function formatLevel(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCentimeters(value: number | null) {
  if (value === null) return "—";

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value)} cm`;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTrend(data: LaranjalLevelData) {
  const rate = data.trendCmPerHour;

  if (rate === null) {
    return {
      label: "Sem comparação disponível",
      detail: "faltam leituras anteriores",
      direction: "unavailable" as const,
      symbol: "·",
    };
  }

  if (Math.abs(rate) < 0.1) {
    return {
      label: "Estável",
      detail: "sem mudança importante nas últimas horas",
      direction: "stable" as const,
      symbol: "→",
    };
  }

  if (rate > 0) {
    return {
      label: "Subindo",
      detail: `${formatSignedCentimeters(rate)} por hora`,
      direction: "rising" as const,
      symbol: "↑",
    };
  }

  return {
    label: "Baixando",
    detail: `${formatSignedCentimeters(Math.abs(rate))} por hora`,
    direction: "falling" as const,
    symbol: "↓",
  };
}

function buildChartPath(data: LaranjalLevelData) {
  if (data.series.length < 2) return null;

  const levels = data.series.map((point) => point.level);
  const minimum = Math.min(...levels);
  const maximum = Math.max(...levels);
  const range = Math.max(maximum - minimum, 0.02);
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const points = data.series.map((point, index) => {
    const x = CHART_PADDING + (index / (data.series.length - 1)) * innerWidth;
    const y = CHART_PADDING + ((maximum - point.level) / range) * innerHeight;

    return { x, y };
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  return {
    line,
    area: `${line} L${points.at(-1)!.x.toFixed(1)},${CHART_HEIGHT} L${points[0].x.toFixed(1)},${CHART_HEIGHT} Z`,
    minimum,
    maximum,
  };
}

export function PelotasHydrologyWidget({
  initialData,
  weather,
  headingLevel = "h2",
  className,
}: PelotasHydrologyWidgetProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const trend = useMemo(() => getTrend(data), [data]);
  const chart = useMemo(() => buildChartPath(data), [data]);
  const available = data.status !== "unavailable" && data.currentLevel !== null;
  const Heading = headingLevel;
  const rootClassName = ["laranjal-monitor", "pelotas-hydrology-widget", className]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    let cancelled = false;
    let activeRequest: AbortController | null = null;

    const refresh = async () => {
      if (document.visibilityState === "hidden") return;

      activeRequest?.abort();
      activeRequest = new AbortController();
      setIsRefreshing(true);

      try {
        const response = await fetch("/api/hydrology/laranjal", {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: activeRequest.signal,
        });
        const nextData = (await response.json()) as LaranjalLevelData;

        if (!cancelled && nextData && typeof nextData === "object") {
          setData(nextData);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Não foi possível atualizar o nível do Laranjal:", error);
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    };

    const interval = window.setInterval(() => void refresh(), 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      activeRequest?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <section className={rootClassName} aria-labelledby="pelotas-hydrology-widget-title">
      <article className={`guaiba-level-card laranjal-level-card guaiba-level-card--${data.status}`}>
        <div className="guaiba-level-card-header">
          <div>
            <span className="eyebrow">Acompanhamento em Pelotas</span>
            <Heading id="pelotas-hydrology-widget-title">Nível da Lagoa dos Patos no Laranjal</Heading>
            <p>Estação Laranjal · Praia do Laranjal · Pelotas / RS</p>
          </div>
          <span className="guaiba-data-status" aria-live="polite">
            <i aria-hidden="true" />
            {isRefreshing
              ? "Atualizando"
              : data.status === "live"
                ? "Atualizado"
                : data.status === "stale"
                  ? "Atualização atrasada"
                  : "Indisponível"}
          </span>
        </div>

        {available ? (
          <>
            <div className="guaiba-level-reading">
              <div className="guaiba-level-value">
                <strong>{formatLevel(data.currentLevel)}</strong>
                <span>m</span>
              </div>
              <div className={`guaiba-trend guaiba-trend--${trend.direction}`}>
                <span aria-hidden="true">{trend.symbol}</span>
                <div>
                  <strong>{trend.label}</strong>
                  <small>{trend.detail}</small>
                </div>
              </div>
            </div>

            <p className="guaiba-updated-at">Atualizado em {formatUpdatedAt(data.updatedAt)}</p>

            <p className="laranjal-level-guidance">
              Observe se o nível continua subindo ao longo das horas. O portal não define uma marca de
              alagamento para Pelotas; em situação de risco, siga os avisos oficiais.
            </p>

            {chart ? (
              <div className="guaiba-mini-chart laranjal-mini-chart" aria-label="Mudança do nível da Lagoa nas últimas 24 horas">
                <div className="guaiba-chart-labels">
                  <span>{formatLevel(chart.maximum)} m</span>
                  <span>{formatLevel(chart.minimum)} m</span>
                </div>
                <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-hidden="true">
                  <defs>
                    <linearGradient id="laranjal-area-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.34" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  <path className="guaiba-chart-area" d={chart.area} />
                  <path className="guaiba-chart-line" d={chart.line} />
                </svg>
                <div className="guaiba-chart-range">
                  <span>24 horas atrás</span>
                  <strong>Mudança de {formatSignedCentimeters(data.change24hCm)}</strong>
                  <span>Agora</span>
                </div>
              </div>
            ) : null}

            <dl className="guaiba-summary-grid laranjal-summary-grid">
              <div>
                <dt>Mudança na última hora</dt>
                <dd>{formatSignedCentimeters(data.change1hCm)}</dd>
              </div>
              <div>
                <dt>Mudança em 6 horas</dt>
                <dd>{formatSignedCentimeters(data.change6hCm)}</dd>
              </div>
              <div>
                <dt>Menor e maior nível em 24h</dt>
                <dd>
                  {formatLevel(data.periodMinimum)}–{formatLevel(data.periodMaximum)} m
                </dd>
              </div>
            </dl>

            <div className="laranjal-weather-grid" aria-label="Vento e chuva em Pelotas">
              <div>
                <span>Vento agora</span>
                <strong>{weather.windSpeed} km/h</strong>
                <small>Direção {weather.windDirection}</small>
              </div>
              <div>
                <span>Rajada mais forte prevista</span>
                <strong>{weather.windGust} km/h</strong>
                <small>Próximas horas</small>
              </div>
              <div>
                <span>Chuva prevista hoje</span>
                <strong>{weather.precipitation} mm</strong>
                <small>Previsão para Pelotas</small>
              </div>
            </div>
          </>
        ) : (
          <div className="guaiba-unavailable-state" role="status">
            <strong>Nível temporariamente indisponível</strong>
            <p>{data.error}</p>
          </div>
        )}

        <div className="guaiba-context-note laranjal-context-note">
          <strong>O que pode mudar o nível no Laranjal?</strong>
          <p>
            Chuva, vento, água que chega de rios e arroios, o Canal São Gonçalo e a saída para o oceano
            entre Rio Grande e São José do Norte podem influenciar o comportamento da lagoa.
          </p>
        </div>

        <div className="guaiba-source-links">
          <a href={data.source.url} target="_blank" rel="noreferrer">
            Ver o medidor original
            <span aria-hidden="true">↗</span>
          </a>
          <Link href="/situacao-hidrologica-pelotas">
            Entender a situação das águas
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <small className="guaiba-attribution">
          Fonte: {data.source.name}. A leitura representa a {data.source.station}, na Praia do Laranjal,
          e é atualizada automaticamente quando uma nova medição fica disponível.
        </small>
      </article>
    </section>
  );
}
