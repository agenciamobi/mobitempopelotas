"use client";

import { useId, useMemo, useState } from "react";
import type { HourlyForecast } from "@/lib/weather-data";

export type ChartMetric = "temperature" | "precipitation" | "windGust";

type WeatherTrendChartProps = {
  hourly: HourlyForecast[];
  initialMetric?: ChartMetric;
};

const metrics: Record<
  ChartMetric,
  {
    label: string;
    shortLabel: string;
    unit: string;
    description: string;
    getValue: (hour: HourlyForecast) => number;
  }
> = {
  temperature: {
    label: "Temperatura",
    shortLabel: "Temperatura",
    unit: "°C",
    description: "Veja como a temperatura deve mudar ao longo das próximas horas.",
    getValue: (hour) => hour.temperature,
  },
  precipitation: {
    label: "Chance de chuva",
    shortLabel: "Chuva",
    unit: "%",
    description: "Veja em quais horários há maior chance de chuva.",
    getValue: (hour) => hour.precipitation,
  },
  windGust: {
    label: "Rajadas de vento",
    shortLabel: "Rajadas",
    unit: " km/h",
    description: "Veja quando o vento pode ficar mais forte nas próximas horas.",
    getValue: (hour) => hour.windGust,
  },
};

const VIEWBOX_WIDTH = 680;
const VIEWBOX_HEIGHT = 230;
const PADDING_X = 34;
const PADDING_TOP = 22;
const PADDING_BOTTOM = 32;

function normalizeRange(values: number[], metric: ChartMetric) {
  if (metric === "precipitation") {
    return { min: 0, max: 100 };
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = Math.max(rawMax - rawMin, 4);
  const padding = Math.max(Math.ceil(spread * 0.25), 2);

  return {
    min: Math.max(0, rawMin - padding),
    max: rawMax + padding,
  };
}

function createSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function WeatherTrendChart({
  hourly,
  initialMetric = "temperature",
}: WeatherTrendChartProps) {
  const [metric, setMetric] = useState<ChartMetric>(initialMetric);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const gradientId = `weather-chart-gradient-${safeId}`;
  const headingId = `weather-chart-title-${safeId}`;
  const config = metrics[metric];

  const chart = useMemo(() => {
    const values = hourly.map(config.getValue);
    const range = normalizeRange(values, metric);
    const drawableWidth = VIEWBOX_WIDTH - PADDING_X * 2;
    const drawableHeight = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const denominator = Math.max(range.max - range.min, 1);

    const points = values.map((value, index) => ({
      value,
      x:
        PADDING_X +
        (index / Math.max(values.length - 1, 1)) * drawableWidth,
      y:
        PADDING_TOP +
        ((range.max - value) / denominator) * drawableHeight,
    }));

    const linePath = createSmoothPath(points);
    const lastPoint = points.at(-1);
    const areaPath = lastPoint
      ? `${linePath} L ${lastPoint.x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} L ${points[0].x} ${VIEWBOX_HEIGHT - PADDING_BOTTOM} Z`
      : "";

    return { values, range, points, linePath, areaPath };
  }, [config, hourly, metric]);

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(hourly.length - 1, 0));
  const selectedHour = hourly[safeSelectedIndex];
  const selectedPoint = chart.points[safeSelectedIndex];
  const selectedValue = chart.values[safeSelectedIndex] ?? 0;

  const changeMetric = (nextMetric: ChartMetric) => {
    setMetric(nextMetric);
    setSelectedIndex(0);
  };

  if (!hourly.length) return null;

  return (
    <section
      className={`trend-chart trend-chart--${metric}`}
      aria-labelledby={headingId}
    >
      <div className="trend-chart-heading">
        <div>
          <span className="eyebrow">Próximas horas</span>
          <h2 id={headingId}>Como o tempo deve mudar</h2>
          <p>{config.description}</p>
        </div>

        <div className="trend-chart-value" aria-live="polite">
          <span>{selectedHour.time}</span>
          <strong>
            {selectedValue}
            <small>{config.unit}</small>
          </strong>
        </div>
      </div>

      <div className="trend-chart-tabs" role="tablist" aria-label="Escolha o que deseja ver">
        {(Object.keys(metrics) as ChartMetric[]).map((item) => (
          <button
            className={metric === item ? "is-active" : undefined}
            key={item}
            type="button"
            role="tab"
            aria-selected={metric === item}
            onClick={() => changeMetric(item)}
          >
            {metrics[item].shortLabel}
          </button>
        ))}
      </div>

      <div className="trend-chart-canvas">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="img"
          aria-label={`${config.label} entre ${hourly[0].time} e ${hourly.at(-1)?.time}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => {
            const y =
              PADDING_TOP +
              (line / 3) * (VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM);

            return (
              <line
                className="trend-chart-gridline"
                key={line}
                x1={PADDING_X}
                x2={VIEWBOX_WIDTH - PADDING_X}
                y1={y}
                y2={y}
              />
            );
          })}

          <path className="trend-chart-area" d={chart.areaPath} fill={`url(#${gradientId})`} />
          <path className="trend-chart-line" d={chart.linePath} />

          {selectedPoint ? (
            <line
              className="trend-chart-selection"
              x1={selectedPoint.x}
              x2={selectedPoint.x}
              y1={PADDING_TOP}
              y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
            />
          ) : null}

          {chart.points.map((point, index) => (
            <circle
              className={index === safeSelectedIndex ? "trend-chart-point is-active" : "trend-chart-point"}
              cx={point.x}
              cy={point.y}
              key={`${hourly[index].time}-${index}`}
              r={index === safeSelectedIndex ? 6 : 4}
            />
          ))}

          <text className="trend-chart-axis-label" x={PADDING_X} y={14}>
            {chart.range.max}{config.unit}
          </text>
          <text
            className="trend-chart-axis-label"
            x={PADDING_X}
            y={VIEWBOX_HEIGHT - 8}
          >
            {chart.range.min}{config.unit}
          </text>
        </svg>
      </div>

      <div className="trend-chart-hours" aria-label="Escolha um horário">
        {hourly.map((hour, index) => (
          <button
            className={index === safeSelectedIndex ? "is-active" : undefined}
            key={`${hour.time}-${index}`}
            type="button"
            aria-label={`${hour.time}: ${config.label.toLowerCase()} ${config.getValue(hour)}${config.unit}`}
            aria-pressed={index === safeSelectedIndex}
            onClick={() => setSelectedIndex(index)}
          >
            <span>{hour.time}</span>
            <strong>{config.getValue(hour)}{config.unit}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
