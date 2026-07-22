import { useId, useMemo, useState } from "react";

import type { HistoricalWeatherDay } from "@/lib/weather/history.types";

export type HistoryMetric = "temperature" | "precipitation" | "wind";
type HistoryPeriod = 7 | 14 | 30;

type WeatherHistoryChartProps = {
  days: HistoricalWeatherDay[];
};

type ChartPoint = {
  index: number;
  value: number;
  x: number;
  y: number;
};

const WIDTH = 820;
const HEIGHT = 300;
const PADDING_X = 40;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 38;

function getMetricValues(days: HistoricalWeatherDay[], metric: HistoryMetric) {
  if (metric === "temperature") {
    return {
      primary: days.map((day) => day.temperatureMax),
      secondary: days.map((day) => day.temperatureMin),
      unit: "°C",
      label: "Temperatura",
      primaryLabel: "Máxima",
      secondaryLabel: "Mínima",
    };
  }

  if (metric === "precipitation") {
    return {
      primary: days.map((day) => day.precipitation),
      secondary: [] as Array<number | null>,
      unit: " mm",
      label: "Chuva acumulada",
      primaryLabel: "Chuva",
      secondaryLabel: null,
    };
  }

  return {
    primary: days.map((day) => day.windGust),
    secondary: [] as Array<number | null>,
    unit: " km/h",
    label: "Rajada máxima",
    primaryLabel: "Rajada",
    secondaryLabel: null,
  };
}

function formatValue(value: number | null | undefined, metric: HistoryMetric) {
  if (value === null || value === undefined) return "Não informado";
  return metric === "precipitation" ? value.toFixed(1) : String(Math.round(value));
}

function createSegments(points: Array<ChartPoint | null>) {
  const segments: ChartPoint[][] = [];
  let current: ChartPoint[] = [];

  for (const point of points) {
    if (point) {
      current.push(point);
      continue;
    }
    if (current.length > 0) segments.push(current);
    current = [];
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

function createPath(points: ChartPoint[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function WeatherHistoryChart({ days }: WeatherHistoryChartProps) {
  const [metric, setMetric] = useState<HistoryMetric>("temperature");
  const [period, setPeriod] = useState<HistoryPeriod>(14);
  const [selectedOffset, setSelectedOffset] = useState(0);
  const id = useId().replace(/:/g, "");

  const visibleDays = useMemo(() => days.slice(-period), [days, period]);
  const values = useMemo(() => getMetricValues(visibleDays, metric), [visibleDays, metric]);
  const selectedIndex = Math.max(0, visibleDays.length - 1 - selectedOffset);
  const selectedDay = visibleDays[selectedIndex];

  const chart = useMemo(() => {
    const availableValues = [...values.primary, ...values.secondary].filter(
      (value): value is number => value !== null,
    );
    if (availableValues.length === 0) return null;

    const rawMin = metric === "temperature" ? Math.min(...availableValues) : 0;
    const rawMax = Math.max(...availableValues, 1);
    const spread = Math.max(rawMax - rawMin, metric === "temperature" ? 6 : 4);
    const padding =
      metric === "precipitation" ? Math.max(spread * 0.12, 1) : Math.max(spread * 0.18, 2);
    const min = metric === "temperature" ? Math.floor(rawMin - padding) : 0;
    const max = Math.ceil(rawMax + padding);
    const drawableWidth = WIDTH - PADDING_X * 2;
    const drawableHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const denominator = Math.max(max - min, 1);

    const pointsFor = (series: Array<number | null>) =>
      series.map((value, index): ChartPoint | null => {
        if (value === null) return null;
        return {
          index,
          value,
          x: PADDING_X + (index / Math.max(series.length - 1, 1)) * drawableWidth,
          y: PADDING_TOP + ((max - value) / denominator) * drawableHeight,
        };
      });

    const primary = pointsFor(values.primary);
    const secondary = pointsFor(values.secondary);
    const primarySegments = createSegments(primary);
    const secondarySegments = createSegments(secondary);
    const longestPrimarySegment = primarySegments.reduce<ChartPoint[]>(
      (selected, segment) => (segment.length > selected.length ? segment : selected),
      [],
    );
    const area =
      longestPrimarySegment.length > 1
        ? `${createPath(longestPrimarySegment)} L ${longestPrimarySegment.at(-1)?.x} ${HEIGHT - PADDING_BOTTOM} L ${longestPrimarySegment[0].x} ${HEIGHT - PADDING_BOTTOM} Z`
        : "";

    return { min, max, primary, secondary, primarySegments, secondarySegments, area };
  }, [metric, values]);

  if (!visibleDays.length || !selectedDay) return null;

  const selectedPrimary = values.primary[selectedIndex];
  const selectedSecondary = values.secondary[selectedIndex];
  const selectedPoint = chart?.primary[selectedIndex] ?? null;

  const updatePeriod = (nextPeriod: HistoryPeriod) => {
    setPeriod(nextPeriod);
    setSelectedOffset(0);
  };

  const updateMetric = (nextMetric: HistoryMetric) => {
    setMetric(nextMetric);
    setSelectedOffset(0);
  };

  return (
    <section className={`history-chart history-chart-${metric}`} aria-labelledby="history-chart-title">
      <div className="history-chart-heading">
        <div>
          <p className="history-kicker">Comparação diária</p>
          <h2 id="history-chart-title">Como o tempo variou em Pelotas</h2>
          <p>Escolha uma variável e um período. Os pontos sem informação permanecem vazios.</p>
        </div>
        <div className="history-chart-reading" aria-live="polite">
          <span>
            {selectedDay.weekday}, {selectedDay.label}
          </span>
          <strong>
            {formatValue(selectedPrimary, metric)}
            {selectedPrimary !== null ? <small>{values.unit}</small> : null}
          </strong>
          {metric === "temperature" && selectedSecondary !== undefined ? (
            <small>Mínima de {formatValue(selectedSecondary, metric)}°C</small>
          ) : null}
        </div>
      </div>

      <div className="history-chart-controls">
        <div className="history-chart-tabs" role="tablist" aria-label="Variável do gráfico">
          {(
            [
              ["temperature", "Temperatura"],
              ["precipitation", "Chuva"],
              ["wind", "Rajadas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={metric === value}
              className={metric === value ? "is-active" : undefined}
              onClick={() => updateMetric(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="history-period" aria-label="Período exibido">
          {([7, 14, 30] as HistoryPeriod[]).map((item) => (
            <button
              key={item}
              type="button"
              className={period === item ? "is-active" : undefined}
              aria-pressed={period === item}
              onClick={() => updatePeriod(item)}
            >
              {item} dias
            </button>
          ))}
        </div>
      </div>

      {chart ? (
        <div className="history-chart-canvas">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${values.label} nos últimos ${Math.min(period, visibleDays.length)} dias`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`history-area-${id}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.24" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3].map((line) => {
              const y = PADDING_TOP + (line / 3) * (HEIGHT - PADDING_TOP - PADDING_BOTTOM);
              return (
                <line
                  className="history-gridline"
                  key={line}
                  x1={PADDING_X}
                  x2={WIDTH - PADDING_X}
                  y1={y}
                  y2={y}
                />
              );
            })}

            {chart.area ? (
              <path className="history-area" d={chart.area} fill={`url(#history-area-${id})`} />
            ) : null}
            {chart.primarySegments.map((segment, index) => (
              <path
                className="history-line history-line-primary"
                d={createPath(segment)}
                key={`primary-segment-${index}`}
              />
            ))}
            {metric === "temperature"
              ? chart.secondarySegments.map((segment, index) => (
                  <path
                    className="history-line history-line-secondary"
                    d={createPath(segment)}
                    key={`secondary-segment-${index}`}
                  />
                ))
              : null}

            {selectedPoint ? (
              <line
                className="history-selection"
                x1={selectedPoint.x}
                x2={selectedPoint.x}
                y1={PADDING_TOP}
                y2={HEIGHT - PADDING_BOTTOM}
              />
            ) : null}

            {chart.primary.map((point, index) =>
              point ? (
                <circle
                  className={index === selectedIndex ? "history-point is-active" : "history-point"}
                  cx={point.x}
                  cy={point.y}
                  key={`primary-${index}`}
                  r={index === selectedIndex ? 5.5 : 3.2}
                />
              ) : null,
            )}
            {metric === "temperature"
              ? chart.secondary.map((point, index) =>
                  point ? (
                    <circle
                      className="history-point history-point-secondary"
                      cx={point.x}
                      cy={point.y}
                      key={`secondary-${index}`}
                      r="2.7"
                    />
                  ) : null,
                )
              : null}

            <text className="history-axis-label" x={PADDING_X} y={18}>
              {chart.max}
              {values.unit}
            </text>
            <text className="history-axis-label" x={PADDING_X} y={HEIGHT - 8}>
              {chart.min}
              {values.unit}
            </text>
          </svg>
        </div>
      ) : (
        <div className="history-chart-empty">A fonte não informou esta variável no período.</div>
      )}

      <div className="history-days" aria-label="Escolha um dia do histórico">
        {visibleDays.map((day, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              type="button"
              className={isSelected ? "is-active" : undefined}
              aria-pressed={isSelected}
              key={day.date}
              onClick={() => setSelectedOffset(visibleDays.length - 1 - index)}
            >
              <span>{day.weekday}</span>
              <strong>{day.label}</strong>
            </button>
          );
        })}
      </div>

      <div className="history-legend" aria-label="Legenda do gráfico">
        <span>
          <i className="history-legend-primary" /> {values.primaryLabel}
        </span>
        {values.secondaryLabel ? (
          <span>
            <i className="history-legend-secondary" /> {values.secondaryLabel}
          </span>
        ) : null}
      </div>
    </section>
  );
}
