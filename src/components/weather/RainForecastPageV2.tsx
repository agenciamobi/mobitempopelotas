import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Droplets,
  Info,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  Umbrella,
  Wind,
} from "lucide-react";
import type { CSSProperties } from "react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast, HourlyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./RainForecastPageV2.css";

const chapters = [
  { href: "#panorama-da-chuva", label: "Panorama", detail: "Leitura rápida" },
  { href: "#chuva-por-hora", label: "Por hora", detail: "Próximas 12 horas" },
  { href: "#chuva-na-semana", label: "7 dias", detail: "Chance e volume" },
  { href: "#planejamento-da-chuva", label: "Planeje", detail: "Janelas e impacto" },
  { href: "#contexto-oficial-da-chuva", label: "Contexto", detail: "Alertas e fontes" },
];

type WindowSummary = {
  start: string;
  end: string;
  averageChance: number | null;
  maximumChance: number | null;
  maximumGust: number;
};

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

function formatChance(value: number | null | undefined) {
  return value === null || value === undefined ? "Não informada" : `${value}%`;
}

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

function chanceTone(value: number | null) {
  if (value === null) return "unknown";
  if (value >= 70) return "high";
  if (value >= 35) return "attention";
  return "stable";
}

function buildWindows(hours: HourlyForecast[]): WindowSummary[] {
  const result: WindowSummary[] = [];
  for (let index = 0; index < hours.length; index += 3) {
    const slice = hours.slice(index, index + 3);
    if (!slice.length) continue;
    const knownChances = slice
      .map((hour) => hour.precipitationProbability)
      .filter((value): value is number => value !== null);
    result.push({
      start: slice[0]?.time ?? "—",
      end: slice[slice.length - 1]?.time ?? "—",
      averageChance: knownChances.length
        ? Math.round(knownChances.reduce((total, value) => total + value, 0) / knownChances.length)
        : null,
      maximumChance: knownChances.length ? Math.max(...knownChances) : null,
      maximumGust: Math.max(...slice.map((hour) => hour.windGust ?? hour.windSpeed)),
    });
  }
  return result;
}

function EmptyRainPage() {
  return (
    <section className="rain-v2-unavailable" aria-labelledby="rain-v2-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <span>Chuva em Pelotas</span>
        <h2 id="rain-v2-unavailable-title">A previsão de chuva está em atualização</h2>
        <p>Nenhum valor demonstrativo foi inserido. O portal tentará consultar as fontes novamente.</p>
      </div>
      <Link to="/tempo-hoje-pelotas">
        Consultar o tempo de hoje <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function RainForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);

  if (!hours.length && !days.length) return <EmptyRainPage />;

  const today = days[0] ?? null;
  const totalRain = days.reduce((total, day) => total + day.precipitationMm, 0);
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitationMm >= 1,
  );
  const rainiestDay = days.reduce<DailyForecast | null>(
    (selected, day) => (!selected || rainScore(day) > rainScore(selected) ? day : selected),
    null,
  );
  const peakHour = hours.reduce<HourlyForecast | null>(
    (selected, hour) =>
      !selected || (hour.precipitationProbability ?? -1) > (selected.precipitationProbability ?? -1)
        ? hour
        : selected,
    null,
  );
  const nextWetHour =
    hours.find((hour) => (hour.precipitationProbability ?? 0) >= 40) ?? null;
  const windows = buildWindows(hours);
  const bestWindow = windows.reduce<WindowSummary | null>((selected, window) => {
    if (!selected) return window;
    const selectedChance = selected.averageChance ?? 101;
    const currentChance = window.averageChance ?? 101;
    if (currentChance !== selectedChance) return currentChance < selectedChance ? window : selected;
    return window.maximumGust < selected.maximumGust ? window : selected;
  }, null);
  const attentionWindow = windows.reduce<WindowSummary | null>((selected, window) => {
    if (!selected) return window;
    return (window.maximumChance ?? -1) > (selected.maximumChance ?? -1) ? window : selected;
  }, null);
  const wetHours = hours.filter((hour) => (hour.precipitationProbability ?? 0) >= 30);
  const activeRainAlerts = weather.alerts.filter(
    (alert) =>
      alert.period === "active" &&
      /chuva|tempestade|alagamento|inunda|granizo/i.test(
        `${alert.event} ${alert.headline} ${alert.description}`,
      ),
  );
  const officialPeriods = weather.inmetForecast
    .filter((period) => /chuva|pancada|tempestade|granizo|precipita/i.test(period.summary))
    .slice(0, 4);

  return (
    <div className="rain-v2-page">
      <InternalPageChapters items={chapters} label="Navegação da previsão de chuva" />

      <section
        className="rain-v2-overview"
        id="panorama-da-chuva"
        aria-labelledby="rain-v2-overview-title"
      >
        <div className="rain-v2-overview__intro">
          <span className="eyebrow">Leitura da chuva</span>
          <h2 id="rain-v2-overview-title">
            {nextWetHour
              ? `A próxima janela relevante aparece por volta de ${nextWetHour.time}`
              : "A chuva não apresenta uma janela forte nas próximas horas"}
          </h2>
          <p>
            Probabilidade indica a chance de ocorrência. Volume em milímetros representa quanto o
            modelo estima que pode acumular no período.
          </p>
        </div>

        <div className="rain-v2-overview__cards">
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Maior chance próxima</span>
              <strong>{formatChance(peakHour?.precipitationProbability)}</strong>
              <small>{peakHour?.time ?? "Horários em atualização"}</small>
            </div>
          </article>
          <article>
            <Droplets aria-hidden="true" />
            <div>
              <span>Volume previsto hoje</span>
              <strong>{today ? formatMillimeters(today.precipitationMm) : "—"}</strong>
              <small>Estimativa diária do modelo</small>
            </div>
          </article>
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Melhor janela estimada</span>
              <strong>{bestWindow ? `${bestWindow.start}–${bestWindow.end}` : "—"}</strong>
              <small>
                {bestWindow?.averageChance === null || !bestWindow
                  ? "Probabilidade em atualização"
                  : `média de ${bestWindow.averageChance}%`}
              </small>
            </div>
          </article>
        </div>
      </section>

      <section
        className="rain-v2-hourly"
        id="chuva-por-hora"
        aria-labelledby="rain-v2-hourly-title"
      >
        <header>
          <div>
            <span className="eyebrow">Próximas 12 horas</span>
            <h2 id="rain-v2-hourly-title">Quando a probabilidade aumenta</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Abrir previsão completa de hoje</Link>
        </header>

        <div className="rain-v2-hourly__grid" aria-label="Probabilidade de chuva por horário">
          {hours.map((hour, index) => {
            const chance = hour.precipitationProbability;
            const style = {
              "--rain-chance": `${chance === null ? 0 : Math.max(4, chance)}%`,
            } as CSSProperties;
            return (
              <article
                className={`tone-${chanceTone(chance)}${index === 0 ? " is-current" : ""}`}
                key={`${hour.time}-${index}`}
                style={style}
              >
                <header>
                  <strong>{hour.time}</strong>
                  {index === 0 ? <b>Agora</b> : null}
                </header>
                <div className="rain-v2-hourly__reading">
                  <WeatherIcon name={hour.icon} title={`Condição prevista para ${hour.time}`} />
                  <strong>{formatChance(chance)}</strong>
                  <span>{hour.temperature}°</span>
                </div>
                <i aria-hidden="true"><b /></i>
                <small>Rajada de até {hour.windGust ?? hour.windSpeed} km/h</small>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="rain-v2-week"
        id="chuva-na-semana"
        aria-labelledby="rain-v2-week-title"
      >
        <header>
          <div>
            <span className="eyebrow">Próximos sete dias</span>
            <h2 id="rain-v2-week-title">Chance e volume não significam a mesma coisa</h2>
          </div>
          <p>{rainyDays.length} de {days.length} dias apresentam algum sinal relevante de chuva.</p>
        </header>

        <div className="rain-v2-week__grid">
          {days.map((day, index) => (
            <article className={`tone-${chanceTone(day.rainChance)}${index === 0 ? " is-today" : ""}`} key={`${day.weekday}-${day.date}`}>
              <header>
                <div><strong>{day.weekday}</strong><span>{day.date}</span></div>
                <b>{index === 0 ? "Hoje" : index === 1 ? "Amanhã" : "Previsão"}</b>
              </header>
              <CloudRain aria-hidden="true" />
              <dl>
                <div><dt>Chance</dt><dd>{formatChance(day.rainChance)}</dd></div>
                <div><dt>Volume</dt><dd>{formatMillimeters(day.precipitationMm)}</dd></div>
              </dl>
              <small>Rajadas: {day.windGust === null ? "não informadas" : `${day.windGust} km/h`}</small>
            </article>
          ))}
        </div>

        <div className="rain-v2-week__summary">
          <article><Droplets aria-hidden="true" /><span>Acumulado estimado</span><strong>{formatMillimeters(totalRain)}</strong></article>
          <article><Umbrella aria-hidden="true" /><span>Dia de maior sinal</span><strong>{rainiestDay?.weekday ?? "—"}</strong></article>
          <article><CloudRain aria-hidden="true" /><span>Dias com chuva</span><strong>{rainyDays.length} de {days.length}</strong></article>
        </div>
      </section>

      <section
        className="rain-v2-planning"
        id="planejamento-da-chuva"
        aria-labelledby="rain-v2-planning-title"
      >
        <header>
          <div>
            <span className="eyebrow">Planejamento</span>
            <h2 id="rain-v2-planning-title">Transforme a previsão em decisões simples</h2>
          </div>
        </header>

        <div className="rain-v2-planning__grid">
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Janela mais favorável</span>
              <strong>{bestWindow ? `${bestWindow.start}–${bestWindow.end}` : "Em atualização"}</strong>
              <p>Menor combinação de chance de chuva e rajadas entre as janelas disponíveis.</p>
            </div>
          </article>
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Período para nova consulta</span>
              <strong>{attentionWindow ? `${attentionWindow.start}–${attentionWindow.end}` : "Em atualização"}</strong>
              <p>
                {attentionWindow?.maximumChance === null || !attentionWindow
                  ? "A fonte ainda não publicou probabilidade para essa janela."
                  : `Pode chegar a ${attentionWindow.maximumChance}% de chance, com rajadas de até ${attentionWindow.maximumGust} km/h.`}
              </p>
            </div>
          </article>
          <article>
            <Umbrella aria-hidden="true" />
            <div>
              <span>Horas com sinal de chuva</span>
              <strong>{wetHours.length} de {hours.length}</strong>
              <p>Contagem considera probabilidade igual ou superior a 30% nas próximas horas.</p>
            </div>
          </article>
        </div>
      </section>

      <section
        className="rain-v2-official"
        id="contexto-oficial-da-chuva"
        aria-labelledby="rain-v2-official-title"
      >
        <header>
          <div>
            <span className="eyebrow">Contexto oficial</span>
            <h2 id="rain-v2-official-title">Alertas e previsão do INMET</h2>
          </div>
          <Link to="/alertas">Consultar todos os avisos</Link>
        </header>

        <div className="rain-v2-official__grid">
          <article className={activeRainAlerts.length ? "has-alert" : "is-stable"}>
            {activeRainAlerts.length ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            <div>
              <span>Avisos relacionados à chuva</span>
              <strong>{activeRainAlerts.length ? `${activeRainAlerts.length} ativo(s)` : "Nenhum listado"}</strong>
              <p>{activeRainAlerts[0]?.headline || activeRainAlerts[0]?.event || "Continue acompanhando a previsão por horário."}</p>
            </div>
          </article>
          <article>
            <Info aria-hidden="true" />
            <div>
              <span>Previsão oficial</span>
              <strong>{officialPeriods.length ? `${officialPeriods.length} período(s) com menção à chuva` : "Em atualização"}</strong>
              <p>{officialPeriods[0]?.summary || "O modelo principal continua disponível e identificado separadamente."}</p>
            </div>
          </article>
        </div>
      </section>

      <nav className="rain-v2-related" aria-label="Continue consultando o Tempo Pelotas">
        <Link to="/radar-e-satelite-pelotas"><span><small>Observação</small><strong>Radar e satélite</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><small>Impacto associado</small><strong>Vento e rajadas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><small>Planejamento</small><strong>Previsão de 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="rain-v2-source-note" aria-label="Origem e atualização da previsão de chuva">
        <Info aria-hidden="true" />
        <p>
          Dados consolidados em {formatFetchedAt(weather.source.fetchedAt)}. Probabilidade e volume são
          previsões do modelo, não medições acumuladas em tempo real. Fonte principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}.
        </p>
      </aside>
    </div>
  );
}
