import {
  Activity,
  BarChart3,
  Clock3,
  CloudRain,
  Droplets,
  Gauge,
  History,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { EmbrapaHistorySnapshot } from "@/lib/weather/embrapa-history.server";

import "./EmbrapaHistoryCharts.css";

const TIMEZONE = "America/Sao_Paulo";
const chartMargin = { top: 12, right: 12, left: -12, bottom: 0 };
const tooltipStyle = {
  border: "1px solid rgba(7, 30, 47, 0.12)",
  borderRadius: "14px",
  boxShadow: "0 18px 45px rgba(7, 30, 47, 0.14)",
  background: "rgba(255, 255, 255, 0.98)",
};

function formatClock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIMEZONE,
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIMEZONE,
  }).format(date);
}

function formatNumber(value: number | null, digits = 1) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatCoverage(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

function chartTooltip(unit: string, digits = 1) {
  return (
    <Tooltip
      contentStyle={tooltipStyle}
      labelFormatter={(value) => formatDateTime(String(value))}
      formatter={(value, name) => {
        const numeric = typeof value === "number" ? value : Number(value);
        const formatted = Number.isFinite(numeric) ? formatNumber(numeric, digits) : "—";
        return [`${formatted}${unit}`, String(name)];
      }}
    />
  );
}

function ChartHeader({
  icon: Icon,
  title,
  description,
  summary,
}: {
  icon: typeof Thermometer;
  title: string;
  description: string;
  summary: string;
}) {
  return (
    <header className="embrapa-history-chart__header">
      <span className="embrapa-history-chart__icon"><Icon aria-hidden="true" /></span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <strong>{summary}</strong>
    </header>
  );
}

export function EmbrapaHistoryCharts({ snapshot }: { snapshot: EmbrapaHistorySnapshot }) {
  const chartData = snapshot.points;
  const hasEnoughData = chartData.length >= 2;
  const statusLabel =
    snapshot.status === "ready"
      ? "Janela de 24 horas disponível"
      : snapshot.status === "building"
        ? "Histórico em formação"
        : "Histórico indisponível";

  return (
    <section className={`embrapa-history is-${snapshot.status}`} id="historico-24-horas" aria-labelledby="embrapa-history-title">
      <header className="embrapa-history__heading">
        <div>
          <span className="embrapa-history__eyebrow">Histórico centralizado</span>
          <h2 id="embrapa-history-title">Como as medições evoluíram nas últimas 24 horas</h2>
          <p>
            Leituras da Estação Embrapa agrupadas em intervalos de {snapshot.bucketMinutes} minutos.
            Todos os gráficos usam o mesmo histórico armazenado pelo centralizador do Tempo Pelotas.
          </p>
        </div>
        <span className="embrapa-history__status"><History aria-hidden="true" />{statusLabel}</span>
      </header>

      <div className="embrapa-history__summary" aria-label="Resumo do histórico disponível">
        <article>
          <Clock3 aria-hidden="true" />
          <span>Cobertura disponível</span>
          <strong>{formatCoverage(snapshot.coverageMinutes)}</strong>
          <small>{formatDateTime(snapshot.from)} até {formatDateTime(snapshot.to)}</small>
        </article>
        <article>
          <Activity aria-hidden="true" />
          <span>Leituras processadas</span>
          <strong>{new Intl.NumberFormat("pt-BR").format(snapshot.sampleCount)}</strong>
          <small>{snapshot.pointCount} pontos exibidos nos gráficos</small>
        </article>
        <article>
          <Thermometer aria-hidden="true" />
          <span>Amplitude térmica</span>
          <strong>{formatNumber(snapshot.summary.temperatureMin)}° a {formatNumber(snapshot.summary.temperatureMax)}°</strong>
          <small>Menor e maior média dos intervalos</small>
        </article>
        <article>
          <CloudRain aria-hidden="true" />
          <span>Chuva no período</span>
          <strong>{formatNumber(snapshot.summary.rainTotal, 2)} mm</strong>
          <small>Incrementos identificados entre as leituras</small>
        </article>
      </div>

      {!hasEnoughData ? (
        <div className="embrapa-history__empty">
          <BarChart3 aria-hidden="true" />
          <div>
            <strong>Aguardando mais observações</strong>
            <p>Os gráficos aparecem após o centralizador armazenar pelo menos duas leituras válidas.</p>
          </div>
        </div>
      ) : (
        <div className="embrapa-history__charts">
          <figure className="embrapa-history-chart is-wide">
            <ChartHeader
              icon={Thermometer}
              title="Temperatura e sensação térmica"
              description="Médias de cada intervalo de dez minutos."
              summary={`${formatNumber(snapshot.summary.temperatureMin)}° / ${formatNumber(snapshot.summary.temperatureMax)}°`}
            />
            <div className="embrapa-history-chart__canvas">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={chartMargin} syncId="embrapa-history" accessibilityLayer>
                  <defs>
                    <linearGradient id="embrapa-temperature-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f27035" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#f27035" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatClock} minTickGap={28} />
                  <YAxis unit="°" domain={["auto", "auto"]} width={44} />
                  {chartTooltip(" °C")}
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    name="Temperatura"
                    stroke="#f27035"
                    strokeWidth={2.4}
                    fill="url(#embrapa-temperature-fill)"
                    connectNulls={false}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="feelsLike"
                    name="Sensação térmica"
                    stroke="#e70b85"
                    strokeWidth={1.8}
                    strokeDasharray="6 4"
                    connectNulls={false}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <figcaption>Laranja: temperatura. Magenta tracejado: sensação térmica informada pela estação.</figcaption>
          </figure>

          <figure className="embrapa-history-chart">
            <ChartHeader
              icon={Droplets}
              title="Umidade relativa"
              description="Variação percentual ao longo do período."
              summary={`${formatNumber(snapshot.summary.humidityMin, 0)}% / ${formatNumber(snapshot.summary.humidityMax, 0)}%`}
            />
            <div className="embrapa-history-chart__canvas">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={chartMargin} syncId="embrapa-history" accessibilityLayer>
                  <defs>
                    <linearGradient id="embrapa-humidity-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#18bdcd" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#18bdcd" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatClock} minTickGap={28} />
                  <YAxis domain={[0, 100]} unit="%" width={44} />
                  {chartTooltip(" %", 0)}
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    name="Umidade"
                    stroke="#18bdcd"
                    strokeWidth={2.2}
                    fill="url(#embrapa-humidity-fill)"
                    connectNulls={false}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </figure>

          <figure className="embrapa-history-chart">
            <ChartHeader
              icon={Gauge}
              title="Pressão atmosférica"
              description="Tendência registrada no posto meteorológico."
              summary={`${formatNumber(snapshot.summary.pressureMin)} / ${formatNumber(snapshot.summary.pressureMax)} hPa`}
            />
            <div className="embrapa-history-chart__canvas">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={chartMargin} syncId="embrapa-history" accessibilityLayer>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatClock} minTickGap={28} />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} width={48} />
                  {chartTooltip(" hPa")}
                  <Line
                    type="monotone"
                    dataKey="pressure"
                    name="Pressão"
                    stroke="#5e2ced"
                    strokeWidth={2.2}
                    connectNulls={false}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </figure>

          <figure className="embrapa-history-chart">
            <ChartHeader
              icon={Wind}
              title="Velocidade do vento"
              description="Média da velocidade em cada intervalo."
              summary={`Máxima ${formatNumber(snapshot.summary.windMax)} km/h`}
            />
            <div className="embrapa-history-chart__canvas">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={chartMargin} syncId="embrapa-history" accessibilityLayer>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatClock} minTickGap={28} />
                  <YAxis domain={[0, "auto"]} width={44} />
                  {chartTooltip(" km/h")}
                  <Line
                    type="monotone"
                    dataKey="windSpeed"
                    name="Vento"
                    stroke="#087f8d"
                    strokeWidth={2.2}
                    connectNulls={false}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </figure>

          <figure className="embrapa-history-chart">
            <ChartHeader
              icon={CloudRain}
              title="Chuva por intervalo"
              description="Incrementos do acumulado diário entre leituras."
              summary={`${formatNumber(snapshot.summary.rainTotal, 2)} mm no período`}
            />
            <div className="embrapa-history-chart__canvas">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={chartMargin} syncId="embrapa-history" accessibilityLayer>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatClock} minTickGap={28} />
                  <YAxis domain={[0, "auto"]} width={44} />
                  {chartTooltip(" mm", 2)}
                  <Bar
                    dataKey="rainIncrement"
                    name="Chuva no intervalo"
                    fill="#18bdcd"
                    radius={[5, 5, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </figure>
        </div>
      )}

      <footer className="embrapa-history__footer">
        <span><History aria-hidden="true" />Histórico atualizado junto com o ciclo meteorológico de um minuto.</span>
        <small>Os pontos exibidos são médias ou incrementos de intervalos de {snapshot.bucketMinutes} minutos.</small>
      </footer>
    </section>
  );
}
