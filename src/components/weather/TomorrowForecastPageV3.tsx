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
import { localForecastDateKey } from "@/lib/weather/daily-temperature-reconciliation";
import type { CppmetForecastItem, InmetForecastPeriod } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast } from "@/lib/weather/types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./TomorrowForecastPageV3.css";

const chapters = [
  { href: "#resumo-amanha", label: "Amanhã em resumo", detail: "Temperatura, chuva e vento" },
  { href: "#comparacao-amanha", label: "Compare com hoje", detail: "O que deve mudar" },
  { href: "#planejamento-amanha", label: "Para sua rotina", detail: "Como se preparar" },
  { href: "#contexto-oficial-amanha", label: "INMET e UFPel", detail: "Outras previsões disponíveis" },
  { href: "#perguntas-amanha", label: "Perguntas", detail: "Respostas rápidas" },
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
  return day.rainChance === null ? "Chance não informada" : `${day.rainChance}% de chance`;
}

function dayWeatherSummary(day: DailyForecast) {
  const gust =
    day.windGust === null ? "rajadas não informadas" : `rajadas de até ${day.windGust} km/h`;
  return `${rainValue(day)} · ${gust}`;
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

  const dateKey = day.dateIso ?? localForecastDateKey(supplied === "amanha" ? 1 : 0);
  const parsed = new Date(`${dateKey}T12:00:00-03:00`);
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
  return `${value > 0 ? "+" : ""}${value} pontos`;
}

function tomorrowTitle(day: DailyForecast) {
  if ((day.rainChance ?? 0) >= 60 || day.precipitationMm >= 10) {
    return "A chuva deve ser o principal ponto de atenção amanhã";
  }
  if ((day.windGust ?? 0) >= 50) return "As rajadas devem ser o principal ponto de atenção amanhã";
  if (day.max <= 18) return "O frio deve permanecer durante boa parte de amanhã";
  if (day.max >= 30) return "O calor deve ganhar força ao longo de amanhã";
  if (day.max - day.min >= 10) return "A variação de temperatura pede roupa em camadas";
  return "A previsão de amanhã não mostra um único destaque principal";
}

function tomorrowSummary(day: DailyForecast) {
  const rain =
    day.rainChance === null
      ? `${day.precipitationMm} mm estimados, sem percentual de chance publicado`
      : `${day.rainChance}% de chance de chuva e ${day.precipitationMm} mm estimados`;
  const wind =
    day.windGust === null ? "rajadas ainda não informadas" : `rajadas de até ${day.windGust} km/h`;

  return `A temperatura deve ficar entre ${day.min}° e ${day.max}°. Para chuva, a previsão indica ${rain}; para o vento, ${wind}.`;
}

function buildPlanningCards(day: DailyForecast): PlanningCard[] {
  const amplitude = Math.max(0, day.max - day.min);
  const temperatureDescription =
    day.max >= 30
      ? "Priorize hidratação, sombra e atividades externas nos horários menos quentes."
      : day.max <= 18
        ? "O dia tende a permanecer frio; considere proteção térmica nos deslocamentos."
        : amplitude >= 10
          ? "A diferença entre mínima e máxima favorece o uso de roupa em camadas."
          : "A temperatura deve variar menos entre a manhã e a tarde.";

  const rainDescription =
    day.rainChance === null
      ? `A previsão indica ${day.precipitationMm} mm, mas ainda não informa a chance percentual.`
      : day.rainChance >= 60 || day.precipitationMm >= 10
        ? `Com ${day.rainChance}% de chance e ${day.precipitationMm} mm previstos, leve proteção e confira a atualização antes de sair.`
        : day.rainChance >= 30
          ? `Há ${day.rainChance}% de chance. Mantenha uma alternativa coberta para compromissos sensíveis ao tempo.`
          : `A chance máxima é de ${day.rainChance}%, com pouca chuva prevista neste momento.`;

  const windDescription =
    day.windGust === null
      ? "A previsão ainda não informou as rajadas para amanhã."
      : day.windGust >= 50
        ? `Rajadas de até ${day.windGust} km/h podem afetar estruturas leves e atividades ao ar livre.`
        : day.windGust >= 35
          ? `Rajadas de até ${day.windGust} km/h merecem atenção em áreas abertas e próximas à Lagoa.`
          : `Rajadas de até ${day.windGust} km/h são previstas para o dia.`;

  return [
    {
      label: "Temperatura amanhã",
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
      label: "Rajadas",
      title: day.windGust === null ? "Não informadas" : `${day.windGust} km/h`,
      description: windDescription,
      icon: Wind,
      tone: (day.windGust ?? 0) >= 35 ? "attention" : "normal",
    },
    {
      label: "Confira novamente",
      title: "Hoje à noite e amanhã cedo",
      description: "Veja a atualização antes de dormir e perto do horário em que pretende sair.",
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
        <h2 id="tomorrow-v3-unavailable-title">A previsão detalhada de amanhã está em atualização</h2>
        <p>As fontes ainda não publicaram dados suficientes. Nenhum valor foi estimado manualmente.</p>
      </div>
      <Link to="/previsao-7-dias-pelotas">
        Ver previsão de 7 dias <ArrowRight aria-hidden="true" />
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
  const tomorrowDate = tomorrow.dateIso ?? localForecastDateKey(1);
  const inmetPeriods = weather.inmetForecast
    .filter((period) => period.date?.slice(0, 10) === tomorrowDate)
    .slice(0, 3);
  const cppmetContext = findCppmetContext(tomorrow, weather.officialForecast);
  const hasOfficialContext = inmetPeriods.length > 0 || Boolean(cppmetContext);
  const faqs = [
    {
      question: "Qual será a temperatura amanhã em Pelotas?",
      answer: `A previsão indica mínima de ${tomorrow.min}°C e máxima de ${tomorrow.max}°C, uma diferença de ${amplitude}°C ao longo do dia.`,
    },
    {
      question: "Vai chover amanhã em Pelotas?",
      answer:
        tomorrow.rainChance === null
          ? `A previsão não informou a chance percentual, mas indica ${tomorrow.precipitationMm} mm para o dia.`
          : `A maior chance prevista é de ${tomorrow.rainChance}%, com volume diário estimado de ${tomorrow.precipitationMm} mm.`,
    },
    {
      question: "Como estará o vento amanhã?",
      answer:
        tomorrow.windGust === null
          ? "A previsão ainda não publicou a estimativa de rajadas para amanhã."
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
          <span className="eyebrow">Amanhã em resumo</span>
          <h2 id="tomorrow-v3-overview-title">{tomorrowTitle(tomorrow)}</h2>
          <p>{tomorrowSummary(tomorrow)}</p>
        </div>

        <div className="tomorrow-v3-overview__cards">
          <article>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Temperatura amanhã</span>
              <strong>
                {amplitude >= 10
                  ? "A manhã e a tarde terão uma diferença maior"
                  : "A temperatura deve variar menos"}
              </strong>
              <small>Mínima de {tomorrow.min}° e máxima de {tomorrow.max}°.</small>
            </div>
          </article>
          <article className="is-caution">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Confira antes de sair</span>
              <strong>
                {(tomorrow.rainChance ?? 0) >= 60 || (tomorrow.windGust ?? 0) >= 50
                  ? "Chuva ou rajadas podem mudar seus planos"
                  : "Veja a previsão novamente amanhã cedo"}
              </strong>
              <small>Use também radar e avisos oficiais quando houver instabilidade.</small>
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
            <span className="eyebrow">Hoje e amanhã</span>
            <h2 id="tomorrow-v3-comparison-title">Como o tempo de amanhã deve mudar em relação a hoje</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Ver detalhes de hoje</Link>
        </header>

        <div className="tomorrow-v3-comparison__days">
          <article>
            <span>Hoje</span>
            {today ? (
              <>
                <strong>{today.min}° / {today.max}°</strong>
                <small>{dayWeatherSummary(today)}</small>
              </>
            ) : (
              <><strong>Em atualização</strong><small>Sem valores para comparação.</small></>
            )}
          </article>
          <ArrowRight aria-hidden="true" />
          <article className="is-tomorrow">
            <span>Amanhã</span>
            <strong>{tomorrow.min}° / {tomorrow.max}°</strong>
            <small>{dayWeatherSummary(tomorrow)}</small>
          </article>
        </div>

        <dl className="tomorrow-v3-comparison__deltas" aria-label="Diferenças previstas entre hoje e amanhã">
          <div><dt>Temperatura máxima</dt><dd>{formatTemperatureDelta(maximumDelta)}</dd></div>
          <div><dt>Temperatura mínima</dt><dd>{formatTemperatureDelta(minimumDelta)}</dd></div>
          <div><dt>Chance de chuva</dt><dd>{formatPercentDelta(rainDelta)}</dd></div>
          <div><dt>Rajada máxima</dt><dd>{gustDelta === null ? "Sem comparação" : `${gustDelta > 0 ? "+" : ""}${gustDelta} km/h`}</dd></div>
        </dl>
      </section>

      <section
        className="tomorrow-v3-planning"
        id="planejamento-amanha"
        aria-labelledby="tomorrow-v3-planning-title"
      >
        <header>
          <div>
            <span className="eyebrow">Para organizar o próximo dia</span>
            <h2 id="tomorrow-v3-planning-title">Como se preparar para o tempo de amanhã</h2>
          </div>
          <Link to="/previsao-7-dias-pelotas">Ver próximos 7 dias</Link>
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
            <span className="eyebrow">Outras previsões disponíveis</span>
            <h2 id="tomorrow-v3-official-title">O que INMET e CPPMet/UFPel publicam para amanhã</h2>
          </div>
          <Link to="/metodologia">Entenda as fontes</Link>
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
                <p>{cppmetContext.text || "Sem detalhes adicionais."}</p>
                <small>{cppmetContext.minimum === null || cppmetContext.maximum === null ? "Temperaturas não publicadas" : `${cppmetContext.minimum}° / ${cppmetContext.maximum}°`}</small>
              </article>
            ) : null}
          </div>
        ) : (
          <div className="tomorrow-v3-official__unavailable">
            <Info aria-hidden="true" />
            <div>
              <strong>Ainda sem previsão específica do INMET ou da UFPel para amanhã</strong>
              <span>A previsão acima continua disponível.</span>
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
            <span className="eyebrow">Respostas rápidas</span>
            <h2 id="tomorrow-v3-faq-title">Dúvidas sobre o tempo de amanhã em Pelotas</h2>
          </div>
          <p>As respostas usam os dados disponíveis para amanhã.</p>
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
        <Link to="/tempo-hoje-pelotas"><span><small>Condição atual</small><strong>Tempo hoje em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><small>Planejamento semanal</small><strong>Previsão de 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/chuva-em-pelotas"><span><small>Chuva</small><strong>Chance e volume por horário</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><small>Vento</small><strong>Velocidade e rajadas</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="tomorrow-v3-source-note" aria-label="Origem e atualização da previsão">
        <Gauge aria-hidden="true" />
        <p>
          Atualizado em {formatDateTime(weather.source.fetchedAt)}. Previsão principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}. INMET e UFPel aparecem quando há dados para amanhã.
        </p>
      </aside>
    </div>
  );
}
