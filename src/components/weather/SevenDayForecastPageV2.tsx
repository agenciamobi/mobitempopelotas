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
  { href: "#panorama-da-semana", label: "Panorama", detail: "Leitura rápida" },
  { href: "#semana-dia-a-dia", label: "Dia a dia", detail: "Compare os 7 dias" },
  { href: "#tendencia-semanal", label: "Tendência", detail: "Faixa térmica" },
  { href: "#riscos-da-semana", label: "Chuva e vento", detail: "Pontos de atenção" },
  { href: "#contexto-regional-semanal", label: "Contexto", detail: "INMET e UFPel" },
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

function planningHeadline(days: DailyForecast[]) {
  if (days.length === 0) return "A semana está em atualização";
  const rainiest = days.reduce((current, day) => (rainScore(day) > rainScore(current) ? day : current));
  const windiest = days.reduce((current, day) =>
    (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,
  );
  const minimum = Math.min(...days.map((day) => day.min));
  const maximum = Math.max(...days.map((day) => day.max));

  if ((rainiest.rainChance ?? 0) >= 70 || rainiest.precipitationMm >= 15) {
    return `${rainiest.weekday} concentra o maior sinal de chuva`;
  }
  if ((windiest.windGust ?? 0) >= 50) {
    return `${windiest.weekday} merece atenção para as rajadas`;
  }
  if (maximum - minimum >= 14) return "A variação térmica será o principal fator da semana";
  return "A previsão permite organizar a semana por estabilidade";
}

function ForecastUnavailable() {
  return (
    <section className="seven-day-v2-unavailable" aria-labelledby="seven-day-v2-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <span>Tempo Pelotas</span>
        <h2 id="seven-day-v2-unavailable-title">A previsão semanal está em atualização</h2>
        <p>Nenhum valor demonstrativo foi inserido. O portal tentará consultar as fontes novamente.</p>
      </div>
      <Link to="/tempo-hoje-pelotas">
        Consultar o tempo de hoje <ArrowRight aria-hidden="true" />
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
          <span className="eyebrow">Leitura da semana</span>
          <h2 id="seven-day-v2-overview-title">{planningHeadline(days)}</h2>
          <p>
            As temperaturas variam de {minimum}° a {maximum}°. A leitura abaixo separa os dias mais
            favoráveis dos períodos com maior chance de chuva ou rajadas.
          </p>
        </div>

        <div className="seven-day-v2-overview__cards">
          <article className="is-best">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Melhor janela estimada</span>
              <strong>{bestDay.weekday}</strong>
              <small>{formatRainChance(bestDay)} de chuva · {formatGust(bestDay)} de rajada</small>
            </div>
          </article>
          <article className="is-attention">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Maior atenção</span>
              <strong>{rainScore(rainiest) >= (windiest.windGust ?? 0) ? rainiest.weekday : windiest.weekday}</strong>
              <small>{formatRainChance(rainiest)} de chuva · rajada máxima de {formatGust(windiest)}</small>
            </div>
          </article>
          <article>
            <CalendarDays aria-hidden="true" />
            <div>
              <span>Dias com sinal de chuva</span>
              <strong>{rainyDays.length} de {days.length}</strong>
              <small>Considera chance a partir de 30% ou volume diário a partir de 1 mm.</small>
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
            <span className="eyebrow">Dia a dia</span>
            <h2 id="seven-day-v2-days-title">Compare os sete dias sem perder contexto</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Abrir detalhes de hoje</Link>
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
                    <dt><CloudRain aria-hidden="true" /> Chuva</dt>
                    <dd>{formatRainChance(day)}</dd>
                    <small>{day.precipitationMm} mm previstos</small>
                  </div>
                  <div>
                    <dt><Wind aria-hidden="true" /> Rajadas</dt>
                    <dd>{formatGust(day)}</dd>
                    <small>{toneLabel(tone)}</small>
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
            <span className="eyebrow">Tendência térmica</span>
            <h2 id="seven-day-v2-trend-title">Como a faixa de temperatura muda</h2>
          </div>
          <p>As barras mostram a posição da mínima e da máxima dentro da faixa semanal.</p>
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
          <article><Thermometer aria-hidden="true" /><span>Dia mais quente</span><strong>{warmest.weekday} · {warmest.max}°</strong></article>
          <article><Thermometer aria-hidden="true" /><span>Menor mínima</span><strong>{coldest.weekday} · {coldest.min}°</strong></article>
          <article><Gauge aria-hidden="true" /><span>Amplitude semanal</span><strong>{maximum - minimum}°</strong></article>
        </div>
      </section>

      <section
        className="seven-day-v2-risks"
        id="riscos-da-semana"
        aria-labelledby="seven-day-v2-risks-title"
      >
        <header>
          <div>
            <span className="eyebrow">Chuva e vento</span>
            <h2 id="seven-day-v2-risks-title">Os períodos que merecem nova consulta</h2>
          </div>
          <p>Quanto mais distante o dia, maior a possibilidade de ajuste nas próximas rodadas.</p>
        </header>

        <div className="seven-day-v2-risks__grid">
          <article className="is-rain">
            <div className="seven-day-v2-risks__title"><CloudRain aria-hidden="true" /><span><small>Chuva</small><strong>Maiores sinais da semana</strong></span></div>
            <ol>
              {rainRanking.map((day) => (
                <li key={`${day.weekday}-rain`}><span><strong>{day.weekday}</strong><small>{day.precipitationMm} mm previstos</small></span><b>{formatRainChance(day)}</b></li>
              ))}
            </ol>
            <Link to="/chuva-em-pelotas">Ver chuva em detalhes <ArrowRight aria-hidden="true" /></Link>
          </article>

          <article className="is-wind">
            <div className="seven-day-v2-risks__title"><Wind aria-hidden="true" /><span><small>Vento</small><strong>Rajadas mais fortes</strong></span></div>
            {windRanking.length ? (
              <ol>
                {windRanking.map((day) => (
                  <li key={`${day.weekday}-wind`}><span><strong>{day.weekday}</strong><small>Valor máximo previsto</small></span><b>{formatGust(day)}</b></li>
                ))}
              </ol>
            ) : <p>As fontes ativas ainda não publicaram rajadas para os próximos dias.</p>}
            <Link to="/vento-em-pelotas">Ver vento em detalhes <ArrowRight aria-hidden="true" /></Link>
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
            <span className="eyebrow">Contexto oficial e regional</span>
            <h2 id="seven-day-v2-official-title">O que INMET e CPPMet/UFPel acrescentam</h2>
          </div>
          <Link to="/metodologia">Entender as fontes</Link>
        </header>

        {hasOfficialContext ? (
          <div className="seven-day-v2-official__grid">
            <article>
              <span>INMET</span>
              <strong>Previsão oficial disponível</strong>
              <ul>
                {officialPeriods.map((period) => (
                  <li key={period.id}><span>{period.period}</span><p>{period.summary || "Resumo em atualização"}</p></li>
                ))}
              </ul>
            </article>
            <article className="is-regional">
              <span>CPPMet / UFPel</span>
              <strong>Leitura regional</strong>
              {regionalDays.length ? (
                <ul>
                  {regionalDays.map((day) => (
                    <li key={`${day.day}-${day.summary}`}><span>{day.day}</span><p>{day.summary || day.text || "Contexto em atualização"}</p></li>
                  ))}
                </ul>
              ) : <p>O boletim regional está em atualização.</p>}
            </article>
          </div>
        ) : (
          <div className="seven-day-v2-official__unavailable"><Info aria-hidden="true" /><div><strong>Contexto oficial em atualização</strong><span>A previsão por modelo continua disponível e identificada separadamente.</span></div></div>
        )}
      </section>

      <nav className="seven-day-v2-related" aria-label="Continue consultando o Tempo Pelotas">
        <Link to="/tempo-hoje-pelotas"><span><small>Condição atual</small><strong>Tempo de hoje</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/tempo-amanha-pelotas"><span><small>Próximo dia</small><strong>Previsão de amanhã</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/chuva-em-pelotas"><span><small>Precipitação</small><strong>Chuva em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><small>Condição regional</small><strong>Vento e rajadas</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="seven-day-v2-source-note" aria-label="Origem e atualização da previsão">
        <Info aria-hidden="true" />
        <p>
          Previsão consolidada em {formatDateTime(weather.source.fetchedAt)}. Fonte principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}, com INMET e CPPMet/UFPel quando disponíveis.
        </p>
      </aside>
    </div>
  );
}
