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
  { href: "#panorama-da-chuva", label: "Chuva em resumo", detail: "Chance, horário e volume" },
  { href: "#chuva-por-hora", label: "Próximas horas", detail: "Chance nas próximas 12 horas" },
  { href: "#volume-de-chuva-por-hora", label: "Volume por hora", detail: "Milímetros nas próximas 12 horas" },
  { href: "#chuva-na-semana", label: "Próximos 7 dias", detail: "Chance e volume diário" },
  { href: "#planejamento-da-chuva", label: "Melhores horários", detail: "Menor e maior chance" },
  { href: "#contexto-oficial-da-chuva", label: "Avisos do INMET", detail: "Alertas e previsão oficial" },
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

function timeReference(value: string | null | undefined) {
  if (!value) return "em horário ainda não informado";
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  if (normalized === "agora") return "agora";
  if (normalized === "próxima hora") return "na próxima hora";
  return `por volta de ${value}`;
}

function activeAlertLabel(count: number) {
  if (count === 0) return "Nenhum aviso de chuva ativo";
  return count === 1 ? "1 aviso ativo" : `${count} avisos ativos`;
}

function officialPeriodLabel(count: number) {
  if (count === 0) return "A previsão oficial ainda não menciona chuva";
  return count === 1 ? "1 período menciona chuva" : `${count} períodos mencionam chuva`;
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
        <p>As fontes ainda não publicaram dados suficientes. Nenhum valor foi estimado manualmente.</p>
      </div>
      <Link to="/tempo-hoje-pelotas">
        Ver o tempo de hoje <ArrowRight aria-hidden="true" />
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
  const highestVolumeDay = days.reduce<DailyForecast | null>(
    (selected, day) => (!selected || day.precipitationMm > selected.precipitationMm ? day : selected),
    null,
  );
  const hasPositiveRainVolume = (highestVolumeDay?.precipitationMm ?? 0) > 0;
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
          <span className="eyebrow">Chuva em resumo</span>
          <h2 id="rain-v2-overview-title">
            {nextWetHour
              ? `A chance de chuva chega a ${formatChance(nextWetHour.precipitationProbability)} ${timeReference(nextWetHour.time)}`
              : "Não há chance de chuva de 40% ou mais nas próximas 12 horas"}
          </h2>
          <p>
            A chance mostra a possibilidade de chover. O volume em milímetros indica quanto pode
            acumular; os dois valores respondem a perguntas diferentes.
          </p>
        </div>

        <div className="rain-v2-overview__cards">
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Maior chance nas próximas horas</span>
              <strong>{formatChance(peakHour?.precipitationProbability)}</strong>
              <small>{timeReference(peakHour?.time)}</small>
            </div>
          </article>
          <article>
            <Droplets aria-hidden="true" />
            <div>
              <span>Volume previsto para hoje</span>
              <strong>{today ? formatMillimeters(today.precipitationMm) : "—"}</strong>
              <small>Total previsto para o dia</small>
            </div>
          </article>
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Período com menor chance</span>
              <strong>{bestWindow ? `${bestWindow.start}–${bestWindow.end}` : "—"}</strong>
              <small>
                {bestWindow?.averageChance === null || !bestWindow
                  ? "Chance ainda não informada"
                  : `Chance média de ${bestWindow.averageChance}%`}
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
            <span className="eyebrow">Chuva por horário</span>
            <h2 id="rain-v2-hourly-title">Chance de chuva nas próximas 12 horas</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Ver temperatura e vento de hoje</Link>
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
                  {index === 0 ? <b>Próxima hora</b> : null}
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
            <span className="eyebrow">Chuva nos próximos 7 dias</span>
            <h2 id="rain-v2-week-title">Chance e volume de chuva em cada dia</h2>
          </div>
          <p>{rainyDays.length} de {days.length} dias têm pelo menos 30% de chance ou 1 mm previsto.</p>
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
                <div><dt>Chance de chuva</dt><dd>{formatChance(day.rainChance)}</dd></div>
                <div><dt>Volume previsto</dt><dd>{formatMillimeters(day.precipitationMm)}</dd></div>
              </dl>
              <small>Rajada: {day.windGust === null ? "não informada" : `até ${day.windGust} km/h`}</small>
            </article>
          ))}
        </div>

        <div className="rain-v2-week__summary">
          <article><Droplets aria-hidden="true" /><span>Total previsto em 7 dias</span><strong>{formatMillimeters(totalRain)}</strong></article>
          <article><Umbrella aria-hidden="true" /><span>Dia com maior volume</span><strong>{hasPositiveRainVolume ? highestVolumeDay?.weekday : "Sem volume previsto"}</strong></article>
          <article><CloudRain aria-hidden="true" /><span>Dias com previsão de chuva</span><strong>{rainyDays.length} de {days.length}</strong></article>
        </div>
      </section>

      <section
        className="rain-v2-planning"
        id="planejamento-da-chuva"
        aria-labelledby="rain-v2-planning-title"
      >
        <header>
          <div>
            <span className="eyebrow">Horários para planejar</span>
            <h2 id="rain-v2-planning-title">Quais períodos têm menor e maior chance de chuva?</h2>
          </div>
        </header>

        <div className="rain-v2-planning__grid">
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Período com menor chance</span>
              <strong>{bestWindow ? `${bestWindow.start}–${bestWindow.end}` : "Em atualização"}</strong>
              <p>É o período com menor chance média de chuva. Em caso de empate, aparece o período com menor rajada.</p>
            </div>
          </article>
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Período com maior chance</span>
              <strong>{attentionWindow ? `${attentionWindow.start}–${attentionWindow.end}` : "Em atualização"}</strong>
              <p>
                {attentionWindow?.maximumChance === null || !attentionWindow
                  ? "A previsão ainda não informou a chance para esse período."
                  : `A chance pode chegar a ${attentionWindow.maximumChance}%, com rajadas de até ${attentionWindow.maximumGust} km/h.`}
              </p>
            </div>
          </article>
          <article>
            <Umbrella aria-hidden="true" />
            <div>
              <span>Horários com 30% ou mais</span>
              <strong>{wetHours.length} de {hours.length}</strong>
              <p>Quantidade de horários com chance prevista de pelo menos 30% nas próximas 12 horas.</p>
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
            <span className="eyebrow">Avisos e previsão do INMET</span>
            <h2 id="rain-v2-official-title">O que o INMET publica sobre chuva em Pelotas</h2>
          </div>
          <Link to="/alertas">Ver todos os avisos oficiais</Link>
        </header>

        <div className="rain-v2-official__grid">
          <article className={activeRainAlerts.length ? "has-alert" : "is-stable"}>
            {activeRainAlerts.length ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            <div>
              <span>Avisos de chuva e tempestade</span>
              <strong>{activeAlertLabel(activeRainAlerts.length)}</strong>
              <p>{activeRainAlerts[0]?.headline || activeRainAlerts[0]?.event || "Nenhum aviso ativo relacionado à chuva."}</p>
            </div>
          </article>
          <article>
            <Info aria-hidden="true" />
            <div>
              <span>Previsão do INMET</span>
              <strong>{officialPeriodLabel(officialPeriods.length)}</strong>
              <p>{officialPeriods[0]?.summary || "A previsão por horário e por dia continua disponível acima."}</p>
            </div>
          </article>
        </div>
      </section>

      <nav className="rain-v2-related" aria-label="Continue consultando o Tempo Pelotas">
        <Link to="/radar-e-satelite-pelotas"><span><small>Acompanhe as áreas de chuva</small><strong>Radar e satélite</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><small>Veja velocidade e rajadas</small><strong>Vento em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><small>Compare chuva entre os dias</small><strong>Previsão de 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="rain-v2-source-note" aria-label="Origem e atualização da previsão de chuva">
        <Info aria-hidden="true" />
        <p>
          Atualizado em {formatFetchedAt(weather.source.fetchedAt)}. Chance e volume são previsões, não
          chuva já medida. Previsão principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}.
        </p>
      </aside>
    </div>
  );
}
