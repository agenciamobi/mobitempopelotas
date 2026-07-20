"use client";

import { useId, useMemo, useState } from "react";
import type { HistoricalWeatherDay } from "@/lib/weather-history";

type HistoryMetric = "temperature" | "precipitation" | "wind";
type HistoryPeriod = 7 | 14 | 30;

type WeatherHistoryChartProps = {
  days: HistoricalWeatherDay[];
};

const WIDTH = 760;
const HEIGHT = 270;
const PADDING_X = 34;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 34;

function createPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function getMetricValues(days: HistoricalWeatherDay[], metric: HistoryMetric) {
  if (metric === "temperature") {
    return {
      primary: days.map((day) => day.temperatureMax),
      secondary: days.map((day) => day.temperatureMin),
      unit: "°C",
      label: "Temperatura",
    };
  }

  if (metric === "precipitation") {
    return {
      primary: days.map((day) => day.precipitation),
      secondary: [] as number[],
      unit: " mm",
      label: "Chuva",
    };
  }

  return {
    primary: days.map((day) => day.windGust),
    secondary: [] as number[],
    unit: " km/h",
    label: "Rajada mais forte",
  };
}

function formatValue(value: number, metric: HistoryMetric) {
  return metric === "precipitation" ? value.toFixed(1) : String(Math.round(value));
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
    const combined = [...values.primary, ...values.secondary];
    const rawMin = metric === "temperature" ? Math.min(...combined) : 0;
    const rawMax = Math.max(...combined, 1);
    const spread = Math.max(rawMax - rawMin, metric === "temperature" ? 6 : 4);
    const padding = metric === "precipitation" ? Math.max(spread * 0.12, 1) : Math.max(spread * 0.18, 2);
    const min = metric === "temperature" ? Math.floor(rawMin - padding) : 0;
    const max = Math.ceil(rawMax + padding);
    const drawableWidth = WIDTH - PADDING_X * 2;
    const drawableHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const denominator = Math.max(max - min, 1);

    const pointsFor = (series: number[]) =>
      series.map((value, index) => ({
        value,
        x: PADDING_X + (index / Math.max(series.length - 1, 1)) * drawableWidth,
        y: PADDING_TOP + ((max - value) / denominator) * drawableHeight,
      }));

    const primary = pointsFor(values.primary);
    const secondary = pointsFor(values.secondary);
    const line = createPath(primary);
    const last = primary.at(-1);
    const area = last
      ? `${line} L ${last.x} ${HEIGHT - PADDING_BOTTOM} L ${primary[0].x} ${HEIGHT - PADDING_BOTTOM} Z`
      : "";

    return { min, max, primary, secondary, line, secondaryLine: createPath(secondary), area };
  }, [metric, values]);

  if (!visibleDays.length || !selectedDay) return null;

  const selectedPrimary = values.primary[selectedIndex] ?? 0;
  const selectedSecondary = values.secondary[selectedIndex];
  const selectedPoint = chart.primary[selectedIndex];

  const updatePeriod = (nextPeriod: HistoryPeriod) => {
    setPeriod(nextPeriod);
    setSelectedOffset(0);
  };

  const updateMetric = (nextMetric: HistoryMetric) => {
    setMetric(nextMetric);
    setSelectedOffset(0);
  };

  return (
    <section className={`history-chart history-chart--${metric}`} aria-labelledby="history-chart-title">
      <div className="history-chart-heading">
        <div>
          <span className="eyebrow">Veja dia por dia</span>
          <h2 id="history-chart-title">Como esteve o tempo em Pelotas</h2>
          <p>Escolha o que deseja comparar e toque em uma data para ver o valor daquele dia.</p>
        </div>
        <div className="history-chart-reading" aria-live="polite">
          <span>{selectedDay.weekday}, {selectedDay.label}</span>
          <strong>{formatValue(selectedPrimary, metric)}<small>{values.unit}</small></strong>
          {metric === "temperature" && selectedSecondary !== undefined ? (
            <small>Mínima de {formatValue(selectedSecondary, metric)}°C</small>
          ) : null}
        </div>
      </div>

      <div className="history-chart-controls">
        <div className="history-chart-tabs" role="tablist" aria-label="Escolha o que deseja comparar">
          <button type="button" role="tab" aria-selected={metric === "temperature"} className={metric === "temperature" ? "is-active" : undefined} onClick={() => updateMetric("temperature")}>Temperatura</button>
          <button type="button" role="tab" aria-selected={metric === "precipitation"} className={metric === "precipitation" ? "is-active" : undefined} onClick={() => updateMetric("precipitation")}>Chuva</button>
          <button type="button" role="tab" aria-selected={metric === "wind"} className={metric === "wind" ? "is-active" : undefined} onClick={() => updateMetric("wind")}>Rajadas</button>
        </div>
        <div className="history-period" aria-label="Escolha quantos dias deseja ver">
          {([7, 14, 30] as HistoryPeriod[]).map((item) => (
            <button type="button" className={period === item ? "is-active" : undefined} aria-pressed={period === item} key={item} onClick={() => updatePeriod(item)}>{item} dias</button>
          ))}
        </div>
      </div>

      <div className="history-chart-canvas">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${values.label} nos últimos ${period} dias`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`history-area-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.24" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => {
            const y = PADDING_TOP + (line / 3) * (HEIGHT - PADDING_TOP - PADDING_BOTTOM);
            return <line className="history-gridline" key={line} x1={PADDING_X} x2={WIDTH - PADDING_X} y1={y} y2={y} />;
          })}

          <path className="history-area" d={chart.area} fill={`url(#history-area-${id})`} />
          <path className="history-line history-line--primary" d={chart.line} />
          {metric === "temperature" ? <path className="history-line history-line--secondary" d={chart.secondaryLine} /> : null}

          {selectedPoint ? <line className="history-selection" x1={selectedPoint.x} x2={selectedPoint.x} y1={PADDING_TOP} y2={HEIGHT - PADDING_BOTTOM} /> : null}

          {chart.primary.map((point, index) => (
            <circle className={index === selectedIndex ? "history-point is-active" : "history-point"} cx={point.x} cy={point.y} key={`primary-${index}`} r={index === selectedIndex ? 5.5 : 3.2} />
          ))}
          {metric === "temperature" ? chart.secondary.map((point, index) => (
            <circle className="history-point history-point--secondary" cx={point.x} cy={point.y} key={`secondary-${index}`} r="2.7" />
          )) : null}

          <text className="history-axis-label" x={PADDING_X} y={17}>{chart.max}{values.unit}</text>
          <text className="history-axis-label" x={PADDING_X} y={HEIGHT - 8}>{chart.min}{values.unit}</text>
        </svg>
      </div>

      <div className="history-days" aria-label="Escolha um dia">
        {visibleDays.map((day, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button type="button" className={isSelected ? "is-active" : undefined} aria-pressed={isSelected} key={day.date} onClick={() => setSelectedOffset(visibleDays.length - 1 - index)}>
              <span>{day.weekday}</span>
              <strong>{day.label}</strong>
            </button>
          );
        })}
      </div>

      {metric === "temperature" ? (
        <div className="history-legend" aria-label="Legenda do gráfico">
          <span><i className="is-max" /> Máxima</span>
          <span><i className="is-min" /> Mínima</span>
        </div>
      ) : null}
    </section>
  );
}
