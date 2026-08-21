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
  { href: "#semana-dia-a-dia", label: "Dia a dia", detail: "Temperatura, chuva e rajadas" },
  { href: "#tendencia-semanal", label: "Temperaturas", detail: "Mínimas e máximas" },
  { href: "#riscos-da-semana", label: "Chuva e vento", detail: "Maiores valores previstos" },
  { href: "#contexto-regional-semanal", label: "INMET e UFPel", detail: "Outras previsões disponíveis" },
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

function hasPositiveRain(day: DailyForecast) {
  return (day.rainChance ?? 0) > 0 || day.precipitationMm > 0;
}

function hasPositiveGust(day: DailyForecast) {
  return (day.windGust ?? 0) > 0;
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
  if (tone === "high") return "Mais chuva ou vento";
  if (tone === "attention") return "Vale acompanhar";
  return "Menores valores";
}

function formatRainChance(day: DailyForecast) {
  return day.rainChance === null ? "Não informada" : `${day.rainChance}%`;
}

function formatGust(day: DailyForecast) {
  if (day.windGust === null) return "Não informada";
  if (day.windGust <= 0) return "Sem rajada prevista";
  return `${day.windGust} km/h`;
}

function rainSummary(day: DailyForecast) {
  return day.rainChance === null ? "Chance não informada" : `${day.rainChance}% de chance`;
}

function gustSummary(day: DailyForecast) {
  if (day.windGust === null) return "rajadas não informadas";
  if (day.windGust <= 0) return "sem rajada prevista";
  return `rajadas de até ${day.windGust} km/h`;
}

function planningHeadline(days: DailyForecast[]) {
  if (days.length === 0) return "A previsão dos próximos dias está em atualização";
  const rainiest = days.reduce((current, day) => (rainScore(day) > rainScore(current) ? day : current));
  const windiest = days.reduce((current, day) =>
    (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,
  );
  const minimum = Math.min(...days.map((day) => day.min));
  const maximum = Math.max(...days.map((day) => day.max));
  const hasPositiveRiskSignal = days.some((day) => hasPositiveRain(day) || hasPositiveGust(day));

  if (!hasPositiveRiskSignal) {
    return "Não há valores positivos de chuva ou rajadas nesta atualização";
  }
  if ((rainiest.rainChance ?? 0) >= 70 || rainiest.precipitationMm >= 15) {
    return `${rainiest.weekday} tem a maior combinação de chance e volume de chuva`;
  }
  if ((windiest.windGust ?? 0) >= 50) {
    return `${windiest.weekday} tem as rajadas mais fortes previstas`;
  }
  if (maximum - minimum >= 14) return "A temperatura deve variar bastante ao longo da semana";
  return "A maior parte da semana tem menores valores de chuva e rajadas";
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
  const riskScores = days.map((day) => riskScore(day));
  const minimumRisk = Math.min(...riskScores);
  const maximumRisk = Math.max(...riskScores);
  const hasPositiveRisk = maximumRisk > 0;
  const hasRiskContrast = maximumRisk > minimumRisk;
  const bestDay = days.reduce((current, day) => (riskScore(day) < riskScore(current) ? day : current));
  const attentionDay = days.reduce((current, day) =>
    riskScore(day) > riskScore(current) ? day : current,
  );
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitationMm >= 1,
  );
  const rainRanking = [...days]
    .filter(hasPositiveRain)
    .sort((a, b) => rainScore(b) - rainScore(a))
    .slice(0, 3);
  const windRanking = [...days]
    .filter(hasPositiveGust)
    .sort((a, b) => (b.windGust ?? 0) - (a.windGust ?? 0))
    .slice(0, 3);
  const hasPublishedGust = days.some((day) => day.windGust !== null);
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
            {hasPositiveRisk
              ? `A temperatura deve variar de ${minimum}° a ${maximum}°. Compare os dias com menos chuva e rajadas e aqueles que concentram os maiores valores.`
              : `A temperatura deve variar de ${minimum}° a ${maximum}°. Não há valores positivos de chuva ou rajadas publicados nesta atualização.`}
          </p>
        </div>

        <div className="seven-day-v2-overview__cards">
          <article className={hasRiskContrast ? "is-best" : undefined}>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>{hasRiskContrast ? "Menor chance de chuva e rajadas" : "Comparação de chuva e rajadas"}</span>
              <strong>
                {hasRiskContrast ? bestDay.weekday : hasPositiveRisk ? "Valores semelhantes" : "Sem destaque"}
              </strong>
              <small>
                {hasRiskContrast
                  ? `${rainSummary(bestDay)} · ${gustSummary(bestDay)}`
                  : hasPositiveRisk
                    ? "Os dias têm valores semelhantes nesta atualização."
                    : "Não há valores positivos de chuva ou rajadas publicados."}
              </small>
            </div>
          </article>
          <article className={hasRiskContrast ? "is-attention" : undefined}>
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>{hasRiskContrast ? "Mais chuva ou rajadas" : "Dia de maior atenção"}</span>
              <strong>{hasRiskContrast ? attentionDay.weekday : "Sem um único dia"}</strong>
              <small>
                {hasRiskContrast
                  ? `${rainSummary(attentionDay)} · ${gustSummary(attentionDay)}`
                  : hasPositiveRisk
                    ? "Nenhum dia se destaca dos demais pelos valores publicados."
                    : "Sem valor positivo que justifique destacar um dia específico."}
              </small>
            </div>
          </article>
          <article>
            <CalendarDays aria-hidden="true" />
            <div>
              <span>Dias com previsão de chuva</span>
              <strong>{rainyDays.length} de {days.length}</strong>
              <small>Inclui dias com pelo menos 30% de chance ou 1 mm previsto.</small>
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
                    <small>Maior valor previsto para o dia</small>
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
          <p>As barras mostram a faixa de temperatura prevista para cada dia.</p>
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
          <p>Os dias mais distantes podem mudar. Confira novamente conforme cada data se aproxima.</p>
        </header>

        <div className="seven-day-v2-risks__grid">
          <article className="is-rain">
            <div className="seven-day-v2-risks__title"><CloudRain aria-hidden="true" /><span><small>Chuva</small><strong>Maiores chances e volumes</strong></span></div>
            {rainRanking.length ? (
              <ol>
                {rainRanking.map((day) => (
                  <li key={`${day.weekday}-rain`}><span><strong>{day.weekday}</strong><small>{day.precipitationMm} mm estimados</small></span><b>{formatRainChance(day)}</b></li>
                ))}
              </ol>
            ) : <p>Não há valores positivos de chance ou volume de chuva nesta atualização.</p>}
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
            ) : (
              <p>
                {hasPublishedGust
                  ? "Não há rajadas positivas previstas para os próximos dias."
                  : "A previsão ainda não informou rajadas para os próximos dias."}
              </p>
            )}
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
            <span className="eyebrow">Outras previsões disponíveis</span>
            <h2 id="seven-day-v2-official-title">O que INMET e CPPMet/UFPel publicam para os próximos dias</h2>
          </div>
          <Link to="/metodologia">Entenda as fontes</Link>
        </header>

        {hasOfficialContext ? (
          <div className="seven-day-v2-official__grid">
            <article>
              <span>INMET</span>
              <strong>Previsão publicada</strong>
              <ul>
                {officialPeriods.map((period) => (
                  <li key={period.id}><span>{period.period}</span><p>{period.summary || "Resumo em atualização"}</p></li>
                ))}
              </ul>
            </article>
            <article className="is-regional">
              <span>CPPMet / UFPel</span>
              <strong>Previsão para a região</strong>
              {regionalDays.length ? (
                <ul>
                  {regionalDays.map((day) => (
                    <li key={`${day.day}-${day.summary}`}><span>{day.day}</span><p>{day.summary || day.text || "Informações em atualização"}</p></li>
                  ))}
                </ul>
              ) : <p>A UFPel ainda não publicou a previsão dos próximos dias.</p>}
            </article>
          </div>
        ) : (
          <div className="seven-day-v2-official__unavailable"><Info aria-hidden="true" /><div><strong>INMET e UFPel ainda não publicaram previsão para este período</strong><span>A previsão acima continua disponível.</span></div></div>
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
          Atualizado em {formatDateTime(weather.source.fetchedAt)}. Previsão principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}. INMET e UFPel aparecem quando há dados para o período.
        </p>
      </aside>
    </div>
  );
}
