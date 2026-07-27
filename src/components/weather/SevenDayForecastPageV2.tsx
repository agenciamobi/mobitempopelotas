import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  Gauge,
  Info,
  RefreshCw,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";
import type { CSSProperties } from "react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./SevenDayForecastPageV2.css";

const chapters = [
  { href: "#panorama-da-semana", label: "Resumo da semana", detail: "Destaques dos próximos dias" },
  { href: "#semana-dia-a-dia", label: "Previsão diária", detail: "Temperatura, chuva e rajadas" },
  { href: "#tendencia-semanal", label: "Temperaturas", detail: "Mínimas e máximas" },
  { href: "#riscos-da-semana", label: "Chuva e rajadas", detail: "Dias de maior atenção" },
  { href: "#contexto-regional-semanal", label: "Fontes oficiais", detail: "INMET e UFPel" },
];

type DayTone = "stable" | "attention" | "high";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

function riskScore(day: DailyForecast) {
  return rainScore(day) + (day.windGust ?? 0) * 0.7;
}

function dayTone(day: DailyForecast): DayTone {
  if ((day.rainChance ?? 0) >= 70 || day.precipitationMm >= 15 || (day.windGust ?? 0) >= 60) {
    return "high";
  }
  if ((day.rainChance ?? 0) >= 35 || day.precipitationMm >= 4 || (day.windGust ?? 0) >= 35) {
    return "attention";
  }
  return "stable";
}

function toneLabel(tone: DayTone) {
  if (tone === "high") return "Maior atenção";
  if (tone === "attention") return "Acompanhar";
  return "Mais estável";
}

function formatRainChance(day: DailyForecast) {
  return day.rainChance === null ? "Não informada" : `${day.rainChance}%`;
}

function formatGust(day: DailyForecast) {
  return day.windGust === null ? "Não informada" : `${day.windGust} km/h`;
}

function rainSummary(day: DailyForecast) {
  return day.rainChance === null ? "Chance não informada" : `${day.rainChance}% de chance`;
}

function gustSummary(day: DailyForecast) {
  return day.windGust === null ? "rajadas não informadas" : `rajadas de até ${day.windGust} km/h`;
}

function planningHeadline(days: DailyForecast[]) {
  if (days.length === 0) return "A previsão dos próximos dias está em atualização";
  const rainiest = days.reduce((current, day) => (rainScore(day) > rainScore(current) ? day : current));
  const windiest = days.reduce((current, day) =>
    (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,
  );
  const minimum = Math.min(...days.map((day) => day.min));
  const maximum = Math.max(...days.map((day) => day.max));

  if ((rainiest.rainChance ?? 0) >= 70 || rainiest.precipitationMm >= 15) {
    return `${rainiest.weekday} tem o maior sinal de chuva da previsão`;
  }
  if ((windiest.windGust ?? 0) >= 50) {
    return `${windiest.weekday} tem as rajadas mais fortes previstas`;
  }
  if (maximum - minimum >= 14) return "A temperatura deve variar bastante ao longo da semana";
  return "A maior parte da semana apresenta condições mais estáveis";
}

function ForecastUnavailable() {
  return (
    <section className="seven-day-v2-unavailable" aria-labelledby="seven-day-v2-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <span>Tempo Pelotas</span>
        <h2 id="seven-day-v2-unavailable-title">A previsão de 7 dias está em atualização</h2>
        <p>As fontes ainda não publicaram dados suficientes. Nenhum valor foi estimado manualmente.</p>
      </div>
      <Link to="/tempo-hoje-pelotas">
        Ver o tempo de hoje <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function SevenDayForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const days = weather.daily.slice(0, 7);

  if (days.length === 0) return <ForecastUnavailable />;

  const minimum = Math.min(...days.map((day) => day.min));
  const maximum = Math.max(...days.map((day) => day.max));
  const temperatureSpan = Math.max(1, maximum - minimum);
  const warmest = days.reduce((current, day) => (day.max > current.max ? day : current));
  const coldest = days.reduce((current, day) => (day.min < current.min ? day : current));
  const rainiest = days.reduce((current, day) => (rainScore(day) > rainScore(current) ? day : current));
  const windiest = days.reduce((current, day) =>
    (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,
  );
  const bestDay = days.reduce((current, day) => (riskScore(day) < riskScore(current) ? day : current));
  const attentionDay = days.reduce((current, day) =>
    riskScore(day) > riskScore(current) ? day : current,
  );
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitationMm >= 1,
  );
  const rainRanking = [...days].sort((a, b) => rainScore(b) - rainScore(a)).slice(0, 3);
  const windRanking = [...days]
    .filter((day) => day.windGust !== null)
    .sort((a, b) => (b.windGust ?? 0) - (a.windGust ?? 0))
    .slice(0, 3);
  const officialPeriods = weather.inmetForecast.slice(0, 5);
  const regionalDays = weather.officialForecast.slice(0, 5);
  const hasOfficialContext = officialPeriods.length > 0 || regionalDays.length > 0;

  return (
    <div className="seven-day-v2-page">
      <InternalPageChapters items={chapters} label="Navegação da previsão de sete dias" />

      <section
        className="seven-day-v2-overview"
        id="panorama-da-semana"
        aria-labelledby="seven-day-v2-overview-title"
      >
        <div className="seven-day-v2-overview__intro">
          <span className="eyebrow">Resumo dos próximos 7 dias</span>
          <h2 id="seven-day-v2-overview-title">{planningHeadline(days)}</h2>
          <p>
            A previsão varia de {minimum}° a {maximum}°. Compare abaixo os dias com menor impacto e
            aqueles com maior chance de chuva ou rajadas.
          </p>
        </div>

        <div className="seven-day-v2-overview__cards">
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Dia mais favorável</span>
              <strong>{bestDay.weekday}</strong>
              <small>{rainSummary(bestDay)} · {gustSummary(bestDay)}</small>
            </div>
          </article>
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Dia que exige mais atenção</span>
              <strong>{attentionDay.weekday}</strong>
              <small>{rainSummary(attentionDay)} · {gustSummary(attentionDay)}</small>
            </div>
          </article>
          <article>
            <CalendarDays aria-hidden="true" />
            <div>
              <span>Dias com chance ou volume de chuva</span>
              <strong>{rainyDays.length} de {days.length}</strong>
              <small>Conta chance de 30% ou mais ou volume diário a partir de 1 mm.</small>
            </div>
          </article>
        </div>
      </section>

      <section
        className="seven-day-v2-days"
        id="semana-dia-a-dia"
        aria-labelledby="seven-day-v2-days-title"
      >
        <header>
          <div>
            <span className="eyebrow">Previsão diária</span>
            <h2 id="seven-day-v2-days-title">Temperatura, chuva e rajadas em cada dia</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Ver previsão detalhada de hoje</Link>
        </header>

        <div className="seven-day-v2-days__grid">
          {days.map((day, index) => {
            const tone = dayTone(day);
            return (
              <article className={`tone-${tone}${index === 0 ? " is-today" : ""}`} key={`${day.weekday}-${day.date}`}>
                <header>
                  <div>
                    <strong>{day.weekday}</strong>
                    <span>{day.date}</span>
                  </div>
                  <b>{index === 0 ? "Hoje" : index === 1 ? "Amanhã" : toneLabel(tone)}</b>
                </header>

                <div className="seven-day-v2-days__condition">
                  <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
                  <strong>{day.min}° <span>/</span> {day.max}°</strong>
                </div>

                <dl>
                  <div>
                    <dt><CloudRain aria-hidden="true" /> Chance de chuva</dt>
                    <dd>{formatRainChance(day)}</dd>
                    <small>{day.precipitationMm} mm estimados</small>
                  </div>
                  <div>
                    <dt><Wind aria-hidden="true" /> Rajada máxima</dt>
                    <dd>{formatGust(day)}</dd>
                    <small>Condição do dia: {toneLabel(tone).toLocaleLowerCase("pt-BR")}</small>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="seven-day-v2-trend"
        id="tendencia-semanal"
        aria-labelledby="seven-day-v2-trend-title"
      >
        <header>
          <div>
            <span className="eyebrow">Temperaturas da semana</span>
            <h2 id="seven-day-v2-trend-title">Mínimas e máximas ao longo dos próximos 7 dias</h2>
          </div>
          <p>As barras comparam a faixa prevista de cada dia dentro dos extremos da semana.</p>
        </header>

        <div className="seven-day-v2-trend__list">
          {days.map((day) => {
            const low = ((day.min - minimum) / temperatureSpan) * 100;
            const span = Math.max(4, ((day.max - day.min) / temperatureSpan) * 100);
            const style = {
              "--week-low": `${low}%`,
              "--week-span": `${Math.min(span, 100 - low)}%`,
            } as CSSProperties;

            return (
              <article key={`${day.weekday}-${day.date}-trend`}>
                <strong>{day.weekday}</strong>
                <div>
                  <span>{day.min}°</span>
                  <i style={style} aria-label={`Faixa de ${day.min} a ${day.max} graus`}><b /></i>
                  <span>{day.max}°</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="seven-day-v2-trend__facts">
          <article><Thermometer aria-hidden="true" /><span>Maior máxima</span><strong>{warmest.weekday} · {warmest.max}°</strong></article>
          <article><Thermometer aria-hidden="true" /><span>Menor mínima</span><strong>{coldest.weekday} · {coldest.min}°</strong></article>
          <article><Gauge aria-hidden="true" /><span>Diferença entre extremos</span><strong>{maximum - minimum}°</strong></article>
        </div>
      </section>

      <section
        className="seven-day-v2-risks"
        id="riscos-da-semana"
        aria-labelledby="seven-day-v2-risks-title"
      >
        <header>
          <div>
            <span className="eyebrow">Chuva e rajadas</span>
            <h2 id="seven-day-v2-risks-title">Dias com maior chance de chuva e rajadas mais fortes</h2>
          </div>
          <p>Os dias mais distantes podem mudar. Confirme a previsão conforme eles se aproximarem.</p>
        </header>

        <div className="seven-day-v2-risks__grid">
          <article className="is-rain">
            <div className="seven-day-v2-risks__title"><CloudRain aria-hidden="true" /><span><small>Chuva</small><strong>Maiores chances e volumes</strong></span></div>
            <ol>
              {rainRanking.map((day) => (
                <li key={`${day.weekday}-rain`}><span><strong>{day.weekday}</strong><small>{day.precipitationMm} mm estimados</small></span><b>{formatRainChance(day)}</b></li>
              ))}
            </ol>
            <Link to="/chuva-em-pelotas">Ver chance e volume por horário <ArrowRight aria-hidden="true" /></Link>
          </article>

          <article className="is-wind">
            <div className="seven-day-v2-risks__title"><Wind aria-hidden="true" /><span><small>Vento</small><strong>Rajadas máximas previstas</strong></span></div>
            {windRanking.length ? (
              <ol>
                {windRanking.map((day) => (
                  <li key={`${day.weekday}-wind`}><span><strong>{day.weekday}</strong><small>Maior valor previsto para o dia</small></span><b>{formatGust(day)}</b></li>
                ))}
              </ol>
            ) : <p>As fontes ainda não publicaram rajadas para os próximos dias.</p>}
            <Link to="/vento-em-pelotas">Ver velocidade e rajadas <ArrowRight aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section
        className="seven-day-v2-official"
        id="contexto-regional-semanal"
        aria-labelledby="seven-day-v2-official-title"
      >
        <header>
          <div>
            <span className="eyebrow">Previsão oficial e regional</span>
            <h2 id="seven-day-v2-official-title">O que INMET e CPPMet/UFPel publicam para os próximos dias</h2>
          </div>
          <Link to="/metodologia">Como usamos cada fonte</Link>
        </header>

        {hasOfficialContext ? (
          <div className="seven-day-v2-official__grid">
            <article>
              <span>INMET</span>
              <strong>Previsão oficial publicada</strong>
              <ul>
                {officialPeriods.map((period) => (
                  <li key={period.id}><span>{period.period}</span><p>{period.summary || "Resumo em atualização"}</p></li>
                ))}
              </ul>
            </article>
            <article className="is-regional">
              <span>CPPMet / UFPel</span>
              <strong>Previsão regional publicada</strong>
              {regionalDays.length ? (
                <ul>
                  {regionalDays.map((day) => (
                    <li key={`${day.day}-${day.summary}`}><span>{day.day}</span><p>{day.summary || day.text || "Contexto em atualização"}</p></li>
                  ))}
                </ul>
              ) : <p>O boletim regional ainda não publicou os próximos dias.</p>}
            </article>
          </div>
        ) : (
          <div className="seven-day-v2-official__unavailable"><Info aria-hidden="true" /><div><strong>INMET e CPPMet/UFPel ainda não publicaram contexto para o período</strong><span>A previsão principal continua disponível e identificada pela fonte utilizada.</span></div></div>
        )}
      </section>

      <nav className="seven-day-v2-related" aria-label="Continue consultando o Tempo Pelotas">
        <Link to="/tempo-hoje-pelotas"><span><small>Condição atual e próximas horas</small><strong>Tempo hoje em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/tempo-amanha-pelotas"><span><small>Próximo dia em detalhes</small><strong>Tempo amanhã em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/chuva-em-pelotas"><span><small>Chance e volume</small><strong>Chuva por horário</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><small>Velocidade e rajadas</small><strong>Vento em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="seven-day-v2-source-note" aria-label="Origem e atualização da previsão">
        <Info aria-hidden="true" />
        <p>
          Previsão atualizada em {formatDateTime(weather.source.fetchedAt)}. A fonte principal é {weather.quality.forecastProvider ?? "o modelo meteorológico disponível"}. INMET e CPPMet/UFPel aparecem como contexto complementar quando publicam dados para o período.
        </p>
      </aside>
    </div>
  );
}
