import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Gauge,
  Info,
  Navigation,
  ShieldAlert,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";
import type { CSSProperties } from "react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast, HourlyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./WindForecastPageV2.css";

const chapters = [
  { href: "#panorama-do-vento", label: "Panorama", detail: "Medição e previsão" },
  { href: "#vento-por-hora", label: "Por hora", detail: "Vento e rajadas" },
  { href: "#vento-na-semana", label: "7 dias", detail: "Picos previstos" },
  { href: "#planejamento-do-vento", label: "Planeje", detail: "Janelas e impactos" },
  { href: "#contexto-oficial-do-vento", label: "Contexto", detail: "INMET e UFPel" },
];

type WindTone = "stable" | "attention" | "high";

type WindWindow = {
  start: string;
  end: string;
  averageSpeed: number;
  maximumGust: number;
};

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatSpeed(value: number | null | undefined) {
  return value === null || value === undefined ? "Não informada" : `${value} km/h`;
}

function windValue(hour: HourlyForecast) {
  return hour.windGust ?? hour.windSpeed;
}

function windTone(value: number | null | undefined): WindTone {
  if (value !== null && value !== undefined && value >= 60) return "high";
  if (value !== null && value !== undefined && value >= 40) return "attention";
  return "stable";
}

function toneLabel(tone: WindTone) {
  if (tone === "high") return "Maior atenção";
  if (tone === "attention") return "Acompanhar";
  return "Mais tranquilo";
}

function buildWindows(hours: HourlyForecast[]): WindWindow[] {
  const result: WindWindow[] = [];
  for (let index = 0; index < hours.length; index += 3) {
    const group = hours.slice(index, index + 3);
    if (!group.length) continue;
    const averageSpeed = Math.round(
      group.reduce((total, hour) => total + hour.windSpeed, 0) / group.length,
    );
    const maximumGust = Math.max(...group.map(windValue));
    result.push({
      start: group[0]?.time ?? "—",
      end: group[group.length - 1]?.time ?? "—",
      averageSpeed,
      maximumGust,
    });
  }
  return result;
}

function EmptyWindPage() {
  return (
    <section className="wind-v2-unavailable" aria-labelledby="wind-v2-unavailable-title">
      <Wind aria-hidden="true" />
      <div>
        <span>Tempo Pelotas</span>
        <h2 id="wind-v2-unavailable-title">A previsão de vento está em atualização</h2>
        <p>Nenhum valor demonstrativo foi inserido. O portal tentará consultar as fontes novamente.</p>
      </div>
      <Link to="/tempo-hoje-pelotas">
        Consultar o tempo de hoje <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

function strongestHour(hours: HourlyForecast[]) {
  return hours.reduce<HourlyForecast | null>(
    (selected, hour) => (!selected || windValue(hour) > windValue(selected) ? hour : selected),
    null,
  );
}

function strongestDay(days: DailyForecast[]) {
  return days.reduce<DailyForecast | null>(
    (selected, day) =>
      !selected || (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,
    null,
  );
}

export function WindForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);

  if (!hours.length && !days.length && !weather.current) return <EmptyWindPage />;

  const observedCurrent = weather.quality.currentSource === "embrapa" ? weather.current : null;
  const peakHour = strongestHour(hours);
  const peakDay = strongestDay(days);
  const windows = buildWindows(hours);
  const bestWindow = windows.reduce<WindWindow | null>((selected, window) => {
    if (!selected) return window;
    if (window.maximumGust !== selected.maximumGust) {
      return window.maximumGust < selected.maximumGust ? window : selected;
    }
    return window.averageSpeed < selected.averageSpeed ? window : selected;
  }, null);
  const attentionWindow = windows.reduce<WindWindow | null>((selected, window) => {
    if (!selected) return window;
    return window.maximumGust > selected.maximumGust ? window : selected;
  }, null);
  const attentionHours = hours.filter((hour) => windValue(hour) >= 40);
  const highWindDays = days.filter((day) => (day.windGust ?? 0) >= 40);
  const activeWindAlerts = weather.alerts.filter(
    (alert) =>
      alert.period === "active" &&
      /vento|rajada|vendaval|ciclone|tempestade/i.test(
        `${alert.event} ${alert.headline} ${alert.description}`,
      ),
  );
  const officialPeriods = weather.inmetForecast
    .filter(
      (period) =>
        Boolean(period.windDirection || period.windIntensity) ||
        /vento|rajada|vendaval|ciclone/i.test(period.summary),
    )
    .slice(0, 4);
  const regionalWind = weather.officialForecast
    .filter((item) => /vento|rajada|vendaval|ciclone/i.test(`${item.summary} ${item.text}`))
    .slice(0, 4);
  const hasOfficialContext =
    activeWindAlerts.length > 0 || officialPeriods.length > 0 || regionalWind.length > 0;

  return (
    <div className="wind-v2-page">
      <InternalPageChapters items={chapters} label="Navegação da previsão de vento" />

      <section
        className="wind-v2-overview"
        id="panorama-do-vento"
        aria-labelledby="wind-v2-overview-title"
      >
        <div className="wind-v2-overview__intro">
          <span className="eyebrow">Leitura do vento</span>
          <h2 id="wind-v2-overview-title">
            {peakHour && windValue(peakHour) >= 60
              ? `Rajadas fortes aparecem por volta de ${peakHour.time}`
              : peakHour && windValue(peakHour) >= 40
                ? `O período mais intenso aparece por volta de ${peakHour.time}`
                : "O vento permanece em uma faixa mais moderada nas próximas horas"}
          </h2>
          <p>
            A medição local informa o vento observado. Rajadas e valores futuros são previsões do
            modelo e podem variar conforme bairros, edificações e proximidade da Lagoa dos Patos.
          </p>
        </div>

        <div className="wind-v2-overview__cards">
          <article>
            <Wind aria-hidden="true" />
            <div>
              <span>Vento observado</span>
              <strong>{formatSpeed(observedCurrent?.windSpeed)}</strong>
              <small>{observedCurrent ? "Embrapa Clima Temperado" : "Medição local indisponível"}</small>
            </div>
          </article>
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Maior rajada próxima</span>
              <strong>{formatSpeed(peakHour?.windGust ?? peakHour?.windSpeed)}</strong>
              <small>{peakHour?.time ?? "Horários em atualização"}</small>
            </div>
          </article>
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Janela mais tranquila</span>
              <strong>{bestWindow ? `${bestWindow.start}–${bestWindow.end}` : "—"}</strong>
              <small>{bestWindow ? `rajada máxima de ${bestWindow.maximumGust} km/h` : "Em atualização"}</small>
            </div>
          </article>
        </div>
      </section>

      <section
        className="wind-v2-hourly"
        id="vento-por-hora"
        aria-labelledby="wind-v2-hourly-title"
      >
        <header>
          <div>
            <span className="eyebrow">Próximas 12 horas</span>
            <h2 id="wind-v2-hourly-title">Como vento e rajadas devem mudar</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Abrir previsão completa de hoje</Link>
        </header>

        <div className="wind-v2-hourly__grid" aria-label="Vento e rajadas por horário">
          {hours.map((hour, index) => {
            const intensity = windValue(hour);
            const tone = windTone(intensity);
            const style = {
              "--wind-intensity": `${Math.min(100, Math.max(5, intensity))}%`,
            } as CSSProperties;
            return (
              <article
                className={`tone-${tone}${index === 0 ? " is-current" : ""}`}
                key={`${hour.time}-${index}`}
                style={style}
              >
                <header>
                  <strong>{hour.time}</strong>
                  {index === 0 ? <b>Agora</b> : <span>{toneLabel(tone)}</span>}
                </header>
                <div className="wind-v2-hourly__reading">
                  <WeatherIcon name={hour.icon} title={`Condição prevista para ${hour.time}`} />
                  <strong>{hour.windSpeed} km/h</strong>
                  <span>{hour.temperature}°</span>
                </div>
                <i aria-hidden="true"><b /></i>
                <small>Rajada: {formatSpeed(hour.windGust)}</small>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="wind-v2-week"
        id="vento-na-semana"
        aria-labelledby="wind-v2-week-title"
      >
        <header>
          <div>
            <span className="eyebrow">Próximos sete dias</span>
            <h2 id="wind-v2-week-title">Compare os picos previstos para a semana</h2>
          </div>
          <p>{highWindDays.length} de {days.length} dias apresentam rajadas a partir de 40 km/h.</p>
        </header>

        <div className="wind-v2-week__grid">
          {days.map((day, index) => {
            const tone = windTone(day.windGust);
            const style = {
              "--wind-intensity": `${day.windGust === null ? 0 : Math.min(100, Math.max(5, day.windGust))}%`,
            } as CSSProperties;
            return (
              <article
                className={`tone-${tone}${index === 0 ? " is-today" : ""}`}
                key={`${day.weekday}-${day.date}`}
                style={style}
              >
                <header>
                  <div><strong>{day.weekday}</strong><span>{day.date}</span></div>
                  <b>{index === 0 ? "Hoje" : index === 1 ? "Amanhã" : toneLabel(tone)}</b>
                </header>
                <div className="wind-v2-week__condition">
                  <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
                  <strong>{formatSpeed(day.windGust)}</strong>
                </div>
                <i aria-hidden="true"><b /></i>
                <small>{day.min}° / {day.max}° · {toneLabel(tone)}</small>
              </article>
            );
          })}
        </div>

        <div className="wind-v2-week__summary">
          <article><Wind aria-hidden="true" /><span>Maior rajada</span><strong>{formatSpeed(peakDay?.windGust)}</strong></article>
          <article><Compass aria-hidden="true" /><span>Dia mais ventoso</span><strong>{peakDay?.weekday ?? "—"}</strong></article>
          <article><Gauge aria-hidden="true" /><span>Dias de atenção</span><strong>{highWindDays.length} de {days.length}</strong></article>
        </div>
      </section>

      <section
        className="wind-v2-planning"
        id="planejamento-do-vento"
        aria-labelledby="wind-v2-planning-title"
      >
        <header>
          <div>
            <span className="eyebrow">Planejamento</span>
            <h2 id="wind-v2-planning-title">Use a previsão para reduzir exposição</h2>
          </div>
        </header>

        <div className="wind-v2-planning__grid">
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Janela mais favorável</span>
              <strong>{bestWindow ? `${bestWindow.start}–${bestWindow.end}` : "Em atualização"}</strong>
              <p>Menor combinação de vento médio e rajada máxima entre as janelas disponíveis.</p>
            </div>
          </article>
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Período para nova consulta</span>
              <strong>{attentionWindow ? `${attentionWindow.start}–${attentionWindow.end}` : "Em atualização"}</strong>
              <p>{attentionWindow ? `Pode alcançar rajadas de ${attentionWindow.maximumGust} km/h.` : "Dados em atualização."}</p>
            </div>
          </article>
          <article>
            <Navigation aria-hidden="true" />
            <div>
              <span>Direção observada</span>
              <strong>{observedCurrent?.windDirection ?? "Não informada"}</strong>
              <p>Direção atual vem da observação local; o modelo pode não publicar direção por hora.</p>
            </div>
          </article>
          <article>
            <Thermometer aria-hidden="true" />
            <div>
              <span>Horas de maior intensidade</span>
              <strong>{attentionHours.length} de {hours.length}</strong>
              <p>Contagem considera vento ou rajada igual ou superior a 40 km/h.</p>
            </div>
          </article>
        </div>
      </section>

      <section
        className="wind-v2-official"
        id="contexto-oficial-do-vento"
        aria-labelledby="wind-v2-official-title"
      >
        <header>
          <div>
            <span className="eyebrow">Contexto oficial e regional</span>
            <h2 id="wind-v2-official-title">Alertas, direção e intensidade publicadas</h2>
          </div>
          <Link to="/alertas">Consultar todos os avisos</Link>
        </header>

        {hasOfficialContext ? (
          <div className="wind-v2-official__grid">
            <article className={activeWindAlerts.length ? "has-alert" : "is-stable"}>
              {activeWindAlerts.length ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              <div>
                <span>Avisos relacionados ao vento</span>
                <strong>{activeWindAlerts.length ? `${activeWindAlerts.length} ativo(s)` : "Nenhum listado"}</strong>
                <p>{activeWindAlerts[0]?.headline || activeWindAlerts[0]?.event || "Sem aviso oficial relacionado ao vento."}</p>
              </div>
            </article>
            <article>
              <Info aria-hidden="true" />
              <div>
                <span>INMET</span>
                <strong>{officialPeriods.length ? `${officialPeriods.length} período(s) com vento publicado` : "Em atualização"}</strong>
                <p>
                  {officialPeriods[0]
                    ? [officialPeriods[0].windDirection, officialPeriods[0].windIntensity, officialPeriods[0].summary]
                        .filter(Boolean)
                        .join(" · ")
                    : "A previsão por modelo continua disponível e identificada separadamente."}
                </p>
              </div>
            </article>
            <article>
              <Compass aria-hidden="true" />
              <div>
                <span>CPPMet / UFPel</span>
                <strong>{regionalWind.length ? "Leitura regional disponível" : "Em atualização"}</strong>
                <p>{regionalWind[0]?.summary || regionalWind[0]?.text || "O boletim regional não destacou vento nesta rodada."}</p>
              </div>
            </article>
          </div>
        ) : (
          <div className="wind-v2-official__unavailable">
            <Info aria-hidden="true" />
            <div>
              <strong>Contexto oficial em atualização</strong>
              <span>O modelo principal continua disponível e identificado separadamente.</span>
            </div>
          </div>
        )}
      </section>

      <nav className="wind-v2-related" aria-label="Continue consultando o Tempo Pelotas">
        <Link to="/chuva-em-pelotas"><span><small>Condição associada</small><strong>Chuva em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/radar-e-satelite-pelotas"><span><small>Observação regional</small><strong>Radar e satélite</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><small>Planejamento</small><strong>Previsão de 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="wind-v2-source-note" aria-label="Origem e atualização da previsão de vento">
        <Info aria-hidden="true" />
        <p>
          Dados consolidados em {formatFetchedAt(weather.source.fetchedAt)}. Vento observado vem da
          Embrapa quando disponível; valores futuros e rajadas são previsões do modelo. Fonte principal:
          {` ${weather.quality.forecastProvider ?? "modelo meteorológico disponível"}`}.
        </p>
      </aside>
    </div>
  );
}
