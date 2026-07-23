import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Droplets,
  Moon,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast, WeatherIconName } from "@/lib/weather/types";

import "./TomorrowForecastPage.css";

const iconMap: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "partly-cloudy": CloudSun,
  "partly-cloudy-night": CloudMoon,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  wind: Wind,
};

const conditionLabels: Record<WeatherIconName, string> = {
  sun: "Predomínio de sol",
  moon: "Céu limpo durante a noite",
  "partly-cloudy": "Sol entre nuvens",
  "partly-cloudy-night": "Noite parcialmente nublada",
  cloud: "Céu nublado",
  rain: "Previsão de chuva",
  storm: "Risco de temporal",
  wind: "Vento forte",
};

const confidenceLabels = {
  high: "Alta confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

function WeatherIcon({ name, size = 42 }: { name: WeatherIconName; size?: number }) {
  const Icon = iconMap[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={1.65} />;
}

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function rainAnswer(tomorrow: DailyForecast) {
  const probability =
    tomorrow.rainChance === null
      ? "A fonte ativa não informou uma probabilidade percentual de chuva"
      : `A maior probabilidade prevista é de ${tomorrow.rainChance}%`;

  return `${probability}, com volume diário estimado de ${tomorrow.precipitationMm} mm.`;
}

function windAnswer(tomorrow: DailyForecast) {
  return tomorrow.windGust === null
    ? "A fonte ativa não informou previsão de rajadas para amanhã."
    : `As rajadas podem chegar a ${tomorrow.windGust} km/h durante o dia.`;
}

function buildFaqs(tomorrow: DailyForecast) {
  return [
    {
      question: "Qual será a temperatura amanhã em Pelotas?",
      answer: `A previsão indica máxima de ${tomorrow.max}°C e mínima de ${tomorrow.min}°C em Pelotas.`,
    },
    {
      question: "Vai chover amanhã em Pelotas?",
      answer: rainAnswer(tomorrow),
    },
    {
      question: "Como estará o vento amanhã em Pelotas?",
      answer: windAnswer(tomorrow),
    },
  ];
}

function ForecastUnavailable() {
  return (
    <section className="tomorrow-unavailable" aria-labelledby="tomorrow-unavailable-title">
      <p className="tomorrow-kicker">Previsão para o próximo dia</p>
      <h1 id="tomorrow-unavailable-title">A previsão de amanhã está em atualização</h1>
      <p>
        As fontes meteorológicas não forneceram dados suficientes para o próximo dia. O portal não
        substitui a ausência de dados por valores demonstrativos.
      </p>
      <Link to="/previsao-7-dias-pelotas">
        Consultar os próximos dias <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function TomorrowForecastPage({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const today = weather.daily[0];
  const tomorrow = weather.daily[1];

  if (!tomorrow) return <ForecastUnavailable />;

  const condition = conditionLabels[tomorrow.icon];
  const amplitude = Math.max(0, tomorrow.max - tomorrow.min);
  const activeAlerts = weather.alerts.filter((alert) => alert.period === "active");
  const upcomingAlerts = weather.alerts.filter((alert) => alert.period === "upcoming");
  const relevantAlert = activeAlerts[0] ?? upcomingAlerts[0] ?? null;
  const faqs = buildFaqs(tomorrow);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="tomorrow-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />

      <header className="tomorrow-header">
        <div>
          <Link className="tomorrow-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Tempo agora
          </Link>
          <p className="tomorrow-kicker">Previsão para o próximo dia</p>
          <h1>Tempo amanhã em Pelotas: {condition.toLocaleLowerCase("pt-BR")}</h1>
          <p>
            Temperatura, chuva e vento previstos para {tomorrow.weekday.toLocaleLowerCase("pt-BR")},
            com dados consolidados e indicação explícita de campos não informados pela fonte.
          </p>
        </div>

        <div className="tomorrow-quality" aria-label="Qualidade dos dados meteorológicos">
          <strong>{confidenceLabels[weather.quality.confidence]}</strong>
          <span>Índice {weather.quality.score}/100</span>
          <span>{weather.quality.forecastProvider ?? "Modelo meteorológico disponível"}</span>
        </div>
      </header>

      <section className="tomorrow-hero" aria-labelledby="tomorrow-condition-title">
        <div className="tomorrow-condition">
          <span className="tomorrow-icon">
            <WeatherIcon name={tomorrow.icon} size={72} />
          </span>
          <div>
            <p className="tomorrow-kicker">{tomorrow.date}</p>
            <h2 id="tomorrow-condition-title">{condition}</h2>
            <span>{tomorrow.weekday}</span>
          </div>
        </div>

        <dl className="tomorrow-temperature-range">
          <div>
            <dt>Máxima</dt>
            <dd>{tomorrow.max}°</dd>
          </div>
          <div>
            <dt>Mínima</dt>
            <dd>{tomorrow.min}°</dd>
          </div>
        </dl>
      </section>

      {relevantAlert ? (
        <section className="tomorrow-alert" aria-label="Aviso meteorológico relevante">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>
              {relevantAlert.period === "active" ? "Alerta oficial ativo" : "Alerta programado"}
            </strong>
            <span>{relevantAlert.headline || relevantAlert.event}</span>
          </div>
          <Link to="/alertas">
            Ver detalhes <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <section className="tomorrow-metrics" aria-label="Resumo da previsão para amanhã">
        <article>
          <Droplets aria-hidden="true" />
          <span>Chance de chuva</span>
          <strong>
            {tomorrow.rainChance === null ? "Não informada" : `${tomorrow.rainChance}%`}
          </strong>
          <small>Maior probabilidade prevista</small>
        </article>
        <article>
          <CloudRain aria-hidden="true" />
          <span>Volume previsto</span>
          <strong>{tomorrow.precipitationMm} mm</strong>
          <small>Acumulado diário estimado</small>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Rajada mais forte</span>
          <strong>
            {tomorrow.windGust === null ? "Não informada" : `${tomorrow.windGust} km/h`}
          </strong>
          <small>Maior rajada publicada pela fonte</small>
        </article>
        <article>
          <Thermometer aria-hidden="true" />
          <span>Amplitude térmica</span>
          <strong>{amplitude}°C</strong>
          <small>Diferença entre máxima e mínima</small>
        </article>
      </section>

      <section className="tomorrow-section" aria-labelledby="tomorrow-planning-title">
        <div className="tomorrow-section-heading">
          <div>
            <p className="tomorrow-kicker">Planejamento do próximo dia</p>
            <h2 id="tomorrow-planning-title">Como interpretar a previsão</h2>
          </div>
          <Link to="/previsao-7-dias-pelotas">Comparar com a semana</Link>
        </div>

        <div className="tomorrow-guidance-grid">
          <article>
            <strong>Chuva e volume</strong>
            <p>{rainAnswer(tomorrow)}</p>
          </article>
          <article>
            <strong>Vento e rajadas</strong>
            <p>{windAnswer(tomorrow)}</p>
          </article>
          <article>
            <strong>Comparação com hoje</strong>
            <p>
              {today
                ? `Hoje, a faixa prevista é de ${today.min}°C a ${today.max}°C. Amanhã, varia de ${tomorrow.min}°C a ${tomorrow.max}°C.`
                : "A previsão de hoje não está disponível para comparação neste momento."}
            </p>
          </article>
          <article>
            <strong>Atualizações</strong>
            <p>
              A previsão pode mudar conforme novas rodadas dos modelos. Consulte novamente antes de
              atividades externas e acompanhe alertas oficiais.
            </p>
          </article>
        </div>
      </section>

      <section className="tomorrow-section" aria-labelledby="tomorrow-faq-title">
        <div className="tomorrow-section-heading">
          <div>
            <p className="tomorrow-kicker">Dúvidas comuns</p>
            <h2 id="tomorrow-faq-title">Perguntas sobre o tempo de amanhã</h2>
          </div>
        </div>

        <div className="tomorrow-faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="tomorrow-related-links" aria-label="Outras previsões">
        <Link to="/tempo-hoje-pelotas">
          Previsão de hoje <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/chuva-em-pelotas">
          Chuva em Pelotas <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/vento-em-pelotas">
          Vento e rajadas <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <p className="tomorrow-source-note">
        Previsão consolidada em {formatFetchedAt(weather.source.fetchedAt)}. Fonte principal:{" "}
        {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}, enriquecida com
        fontes oficiais e regionais quando disponíveis.
      </p>
    </div>
  );
}
