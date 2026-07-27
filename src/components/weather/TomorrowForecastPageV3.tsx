import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Gauge,
  Info,
  RefreshCw,
  Thermometer,
  TriangleAlert,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type { CppmetForecastItem, InmetForecastPeriod } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast } from "@/lib/weather/types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./TomorrowForecastPageV3.css";

const chapters = [
  { href: "#resumo-amanha", label: "Resumo", detail: "Leitura rápida" },
  { href: "#comparacao-amanha", label: "Compare", detail: "Hoje e amanhã" },
  { href: "#planejamento-amanha", label: "Planeje", detail: "Impactos na rotina" },
  { href: "#contexto-oficial-amanha", label: "Contexto", detail: "INMET e UFPel" },
  { href: "#perguntas-amanha", label: "Entenda", detail: "Respostas diretas" },
];

type PlanningCard = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "normal" | "attention";
};

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

function rainValue(day: DailyForecast) {
  return day.rainChance === null ? "Não informada" : `${day.rainChance}%`;
}

function weekdayKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/-feira/g, "")
    .replace(/[^a-z]/g, "");
}

function forecastWeekdayKey(day: DailyForecast) {
  const supplied = weekdayKey(day.weekday);
  if (supplied !== "hoje" && supplied !== "amanha") return supplied;

  const parsed = new Date(`${day.date.slice(0, 10)}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return supplied;

  return weekdayKey(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: "America/Sao_Paulo",
    }).format(parsed),
  );
}

function findCppmetContext(
  tomorrow: DailyForecast,
  items: CppmetForecastItem[],
): CppmetForecastItem | null {
  const target = forecastWeekdayKey(tomorrow);
  return items.find((item) => weekdayKey(item.day) === target) ?? null;
}

function formatTemperatureDelta(value: number | null) {
  if (value === null) return "Sem comparação";
  if (value === 0) return "Sem mudança";
  return value > 0 ? `+${value}°` : `${value}°`;
}

function formatPercentDelta(value: number | null) {
  if (value === null) return "Sem comparação";
  if (value === 0) return "Sem mudança";
  return value > 0 ? `+${value} p.p.` : `${value} p.p.`;
}

function tomorrowTitle(day: DailyForecast) {
  if ((day.rainChance ?? 0) >= 60 || day.precipitationMm >= 10) {
    return "A chuva deve orientar boa parte do planejamento";
  }
  if ((day.windGust ?? 0) >= 50) return "As rajadas são o principal ponto de atenção";
  if (day.max <= 18) return "O frio deve permanecer durante boa parte do dia";
  if (day.max >= 30) return "O calor deve ganhar força ao longo do dia";
  if (day.max - day.min >= 10) return "A variação de temperatura pede roupa em camadas";
  return "A previsão indica um dia sem um único fator dominante";
}

function tomorrowSummary(day: DailyForecast) {
  const rain =
    day.rainChance === null
      ? `${day.precipitationMm} mm estimados, sem percentual publicado`
      : `${day.rainChance}% de chance e ${day.precipitationMm} mm estimados`;
  const wind =
    day.windGust === null ? "rajadas não informadas" : `rajadas de até ${day.windGust} km/h`;

  return `A temperatura deve variar de ${day.min}° a ${day.max}°. A previsão aponta ${rain} e ${wind}.`;
}

function buildPlanningCards(day: DailyForecast): PlanningCard[] {
  const amplitude = Math.max(0, day.max - day.min);
  const temperatureDescription =
    day.max >= 30
      ? "Priorize hidratação, sombra e ajuste atividades externas para horários menos quentes."
      : day.max <= 18
        ? "O dia tende a permanecer frio; considere proteção térmica durante os deslocamentos."
        : amplitude >= 10
          ? "A diferença entre mínima e máxima favorece roupa em camadas ao longo do dia."
          : "A faixa térmica prevista não indica mudanças bruscas entre mínima e máxima.";

  const rainDescription =
    day.rainChance === null
      ? `O modelo estima ${day.precipitationMm} mm, mas não publicou probabilidade percentual.`
      : day.rainChance >= 60 || day.precipitationMm >= 10
        ? `Com ${day.rainChance}% de chance e ${day.precipitationMm} mm previstos, leve proteção para chuva e acompanhe novas rodadas.`
        : day.rainChance >= 30
          ? `Há ${day.rainChance}% de chance. Vale manter uma alternativa coberta para compromissos mais sensíveis.`
          : `A chance máxima é de ${day.rainChance}%, com baixo impacto esperado no planejamento geral.`;

  const windDescription =
    day.windGust === null
      ? "A fonte ativa não publicou estimativa de rajadas para amanhã."
      : day.windGust >= 50
        ? `Rajadas de até ${day.windGust} km/h podem afetar estruturas leves e atividades ao ar livre.`
        : day.windGust >= 35
          ? `Rajadas de até ${day.windGust} km/h merecem atenção em áreas abertas e próximas à Lagoa.`
          : `Rajadas de até ${day.windGust} km/h não indicam impacto elevado neste momento.`;

  return [
    {
      label: "Temperatura",
      title: `${day.min}° a ${day.max}°`,
      description: temperatureDescription,
      icon: Thermometer,
      tone: day.max >= 30 || day.max <= 18 || amplitude >= 10 ? "attention" : "normal",
    },
    {
      label: "Chuva",
      title: day.rainChance === null ? `${day.precipitationMm} mm` : `${day.rainChance}%`,
      description: rainDescription,
      icon: CloudRain,
      tone: (day.rainChance ?? 0) >= 60 || day.precipitationMm >= 10 ? "attention" : "normal",
    },
    {
      label: "Vento",
      title: day.windGust === null ? "Não informado" : `${day.windGust} km/h`,
      description: windDescription,
      icon: Wind,
      tone: (day.windGust ?? 0) >= 35 ? "attention" : "normal",
    },
    {
      label: "Nova consulta",
      title: "Hoje à noite",
      description:
        "Os modelos recebem novas rodadas. Revise a previsão antes de dormir e novamente antes de sair.",
      icon: RefreshCw,
      tone: "normal",
    },
  ];
}

function ForecastUnavailable() {
  return (
    <section className="tomorrow-v3-unavailable" aria-labelledby="tomorrow-v3-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <span>Tempo Pelotas</span>
        <h2 id="tomorrow-v3-unavailable-title">Os detalhes de amanhã estão em atualização</h2>
        <p>Nenhum valor demonstrativo foi inserido. O portal tentará atualizar as fontes novamente.</p>
      </div>
      <Link to="/previsao-7-dias-pelotas">
        Consultar previsão estendida <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function TomorrowForecastPageV3({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const today = weather.daily[0] ?? null;
  const tomorrow = weather.daily[1] ?? null;

  if (!tomorrow) return <ForecastUnavailable />;

  const amplitude = Math.max(0, tomorrow.max - tomorrow.min);
  const maximumDelta = today ? tomorrow.max - today.max : null;
  const minimumDelta = today ? tomorrow.min - today.min : null;
  const rainDelta =
    today && today.rainChance !== null && tomorrow.rainChance !== null
      ? tomorrow.rainChance - today.rainChance
      : null;
  const gustDelta =
    today && today.windGust !== null && tomorrow.windGust !== null
      ? tomorrow.windGust - today.windGust
      : null;
  const planningCards = buildPlanningCards(tomorrow);
  const tomorrowDate = tomorrow.date.slice(0, 10);
  const inmetPeriods = weather.inmetForecast
    .filter((period) => period.date?.slice(0, 10) === tomorrowDate)
    .slice(0, 3);
  const cppmetContext = findCppmetContext(tomorrow, weather.officialForecast);
  const hasOfficialContext = inmetPeriods.length > 0 || Boolean(cppmetContext);
  const faqs = [
    {
      question: "Qual será a temperatura amanhã em Pelotas?",
      answer: `A previsão indica mínima de ${tomorrow.min}°C e máxima de ${tomorrow.max}°C, com amplitude de ${amplitude}°C.`,
    },
    {
      question: "Vai chover amanhã em Pelotas?",
      answer:
        tomorrow.rainChance === null
          ? `A fonte ativa não informou percentual de probabilidade, mas estima ${tomorrow.precipitationMm} mm.`
          : `A maior chance prevista é de ${tomorrow.rainChance}%, com volume diário estimado de ${tomorrow.precipitationMm} mm.`,
    },
    {
      question: "Como estará o vento amanhã?",
      answer:
        tomorrow.windGust === null
          ? "A fonte ativa não publicou uma estimativa de rajadas para amanhã."
          : `As rajadas podem chegar a ${tomorrow.windGust} km/h durante o dia.`,
    },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="tomorrow-v3-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />

      <InternalPageChapters items={chapters} label="Navegação da previsão de amanhã" />

      <section
        className="tomorrow-v3-overview"
        id="resumo-amanha"
        aria-labelledby="tomorrow-v3-overview-title"
      >
        <div className="tomorrow-v3-overview__intro">
          <span className="eyebrow">Leitura rápida</span>
          <h2 id="tomorrow-v3-overview-title">{tomorrowTitle(tomorrow)}</h2>
          <p>{tomorrowSummary(tomorrow)}</p>
        </div>

        <div className="tomorrow-v3-overview__cards">
          <article>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Para organizar</span>
              <strong>{amplitude >= 10 ? "Prepare-se para variação térmica" : "Faixa térmica relativamente estável"}</strong>
              <small>Amplitude prevista de {amplitude}°C.</small>
            </div>
          </article>
          <article className="is-caution">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Revisar antes de sair</span>
              <strong>
                {(tomorrow.rainChance ?? 0) >= 60 || (tomorrow.windGust ?? 0) >= 50
                  ? "Chuva ou rajadas podem alterar a rotina"
                  : "Acompanhe a atualização da noite"}
              </strong>
              <small>Alertas oficiais e novas rodadas podem mudar a leitura.</small>
            </div>
          </article>
        </div>
      </section>

      <section
        className="tomorrow-v3-comparison"
        id="comparacao-amanha"
        aria-labelledby="tomorrow-v3-comparison-title"
      >
        <header>
          <div>
            <span className="eyebrow">Comparação</span>
            <h2 id="tomorrow-v3-comparison-title">O que muda de hoje para amanhã</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Rever a previsão de hoje</Link>
        </header>

        <div className="tomorrow-v3-comparison__days">
          <article>
            <span>Hoje</span>
            {today ? (
              <>
                <strong>{today.min}° / {today.max}°</strong>
                <small>{rainValue(today)} de chuva · {today.windGust === null ? "rajadas não informadas" : `${today.windGust} km/h de rajada`}</small>
              </>
            ) : (
              <><strong>Em atualização</strong><small>Sem valores para comparação.</small></>
            )}
          </article>
          <ArrowRight aria-hidden="true" />
          <article className="is-tomorrow">
            <span>Amanhã</span>
            <strong>{tomorrow.min}° / {tomorrow.max}°</strong>
            <small>{rainValue(tomorrow)} de chuva · {tomorrow.windGust === null ? "rajadas não informadas" : `${tomorrow.windGust} km/h de rajada`}</small>
          </article>
        </div>

        <dl className="tomorrow-v3-comparison__deltas" aria-label="Diferenças previstas entre hoje e amanhã">
          <div><dt>Máxima</dt><dd>{formatTemperatureDelta(maximumDelta)}</dd></div>
          <div><dt>Mínima</dt><dd>{formatTemperatureDelta(minimumDelta)}</dd></div>
          <div><dt>Chuva</dt><dd>{formatPercentDelta(rainDelta)}</dd></div>
          <div><dt>Rajadas</dt><dd>{gustDelta === null ? "Sem comparação" : `${gustDelta > 0 ? "+" : ""}${gustDelta} km/h`}</dd></div>
        </dl>
      </section>

      <section
        className="tomorrow-v3-planning"
        id="planejamento-amanha"
        aria-labelledby="tomorrow-v3-planning-title"
      >
        <header>
          <div>
            <span className="eyebrow">Planejamento do próximo dia</span>
            <h2 id="tomorrow-v3-planning-title">Transforme a previsão em decisões simples</h2>
          </div>
          <Link to="/previsao-7-dias-pelotas">Comparar com a semana</Link>
        </header>

        <div className="tomorrow-v3-planning__grid">
          {planningCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className={card.tone === "attention" ? "is-attention" : undefined} key={card.label}>
                <Icon aria-hidden="true" />
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="tomorrow-v3-official"
        id="contexto-oficial-amanha"
        aria-labelledby="tomorrow-v3-official-title"
      >
        <header>
          <div>
            <span className="eyebrow">Contexto oficial e regional</span>
            <h2 id="tomorrow-v3-official-title">O que INMET e CPPMet/UFPel acrescentam</h2>
          </div>
          <Link to="/metodologia">Entender as fontes</Link>
        </header>

        {hasOfficialContext ? (
          <div className="tomorrow-v3-official__grid">
            {inmetPeriods.map((period: InmetForecastPeriod) => (
              <article key={period.id}>
                <span>INMET · {period.period}</span>
                <strong>{period.summary || "Resumo em atualização"}</strong>
                <dl>
                  <div><dt>Temperatura</dt><dd>{period.minimum === null || period.maximum === null ? "Não informada" : `${period.minimum}° / ${period.maximum}°`}</dd></div>
                  <div><dt>Umidade</dt><dd>{period.humidityMinimum === null || period.humidityMaximum === null ? "Não informada" : `${period.humidityMinimum}%–${period.humidityMaximum}%`}</dd></div>
                  <div><dt>Vento</dt><dd>{[period.windDirection, period.windIntensity].filter(Boolean).join(" · ") || "Não informado"}</dd></div>
                </dl>
              </article>
            ))}

            {cppmetContext ? (
              <article className="is-regional">
                <span>CPPMet / UFPel</span>
                <strong>{cppmetContext.summary || "Previsão regional"}</strong>
                <p>{cppmetContext.text || "Contexto regional sem detalhamento adicional."}</p>
                <small>{cppmetContext.minimum === null || cppmetContext.maximum === null ? "Temperaturas não publicadas" : `${cppmetContext.minimum}° / ${cppmetContext.maximum}°`}</small>
              </article>
            ) : null}
          </div>
        ) : (
          <div className="tomorrow-v3-official__unavailable">
            <Info aria-hidden="true" />
            <div>
              <strong>Contexto oficial em atualização</strong>
              <span>A previsão por modelo permanece disponível e identificada separadamente.</span>
            </div>
          </div>
        )}
      </section>

      <section
        className="tomorrow-v3-faq"
        id="perguntas-amanha"
        aria-labelledby="tomorrow-v3-faq-title"
      >
        <header>
          <div>
            <span className="eyebrow">Respostas diretas</span>
            <h2 id="tomorrow-v3-faq-title">Perguntas sobre o tempo de amanhã</h2>
          </div>
          <p>As respostas utilizam somente os valores publicados pelas fontes ativas.</p>
        </header>
        <div>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className="tomorrow-v3-related" aria-label="Continue consultando o Tempo Pelotas">
        <Link to="/tempo-hoje-pelotas"><span><small>Condição atual</small><strong>Previsão de hoje</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><small>Planejamento</small><strong>Próximos 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/chuva-em-pelotas"><span><small>Precipitação</small><strong>Chuva em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><small>Condição regional</small><strong>Vento e rajadas</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="tomorrow-v3-source-note" aria-label="Origem e atualização da previsão">
        <Gauge aria-hidden="true" />
        <p>
          Previsão consolidada em {formatDateTime(weather.source.fetchedAt)}. Fonte principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}, enriquecida com INMET e CPPMet/UFPel quando disponíveis.
        </p>
      </aside>
    </div>
  );
}
