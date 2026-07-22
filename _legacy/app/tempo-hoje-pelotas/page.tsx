import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherIcon } from "@/components/weather-icon";
import { WeatherTrendChart } from "@/components/weather-trend-chart";
import { formatMillimeters } from "@/lib/weather-insights";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Tempo hoje em Pelotas",
  description:
    "Veja a temperatura agora, sensação térmica, chuva, vento e previsão por hora para Pelotas, RS.",
  alternates: { canonical: "/tempo-hoje-pelotas" },
  openGraph: {
    title: "Tempo hoje em Pelotas, RS",
    description:
      "Veja como está o tempo agora e o que esperar ao longo do dia em Pelotas.",
    url: "/tempo-hoje-pelotas",
  },
};

export default async function TempoHojePelotasPage() {
  const weather = await getPelotasWeather();
  const { current, hourly, daily } = weather;
  const today = daily[0];
  const faqs = [
    {
      question: "Qual é a temperatura agora em Pelotas?",
      answer: `A temperatura atual em Pelotas é de ${current.temperature}°C, com sensação térmica de ${current.feelsLike}°C e condição de ${current.condition.toLowerCase()}.`,
    },
    {
      question: "Vai chover hoje em Pelotas?",
      answer: `A maior chance de chuva prevista para hoje é de ${today?.rainChance ?? 0}%, com volume previsto de ${formatMillimeters(today?.precipitation ?? 0)} mm.`,
    },
    {
      question: "Qual é a máxima e a mínima de hoje?",
      answer: `A previsão indica máxima de ${today?.max ?? current.temperature}°C e mínima de ${today?.min ?? current.temperature}°C em Pelotas.`,
    },
  ];
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
    <ForecastPageShell
      weather={weather}
      eyebrow="Tempo em Pelotas agora"
      title="Tempo hoje em Pelotas"
      description="Veja a temperatura, a sensação térmica e como a chuva e o vento devem mudar ao longo do dia."
      currentPath="/tempo-hoje-pelotas"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="today-observation-band" aria-labelledby="today-current-title">
        <div className="today-observation-icon">
          <WeatherIcon name={current.icon} title={current.condition} />
        </div>
        <div className="today-observation-copy">
          <span className="eyebrow">Condição observada</span>
          <h2 id="today-current-title">{current.condition}</h2>
          <p>
            Temperatura de {current.temperature}°C e sensação térmica de {current.feelsLike}°C.
          </p>
        </div>
        <dl className="today-temperature-range" aria-label="Temperaturas máxima e mínima previstas para hoje">
          <div>
            <dt>Máxima</dt>
            <dd>{today?.max ?? current.temperature}°</dd>
          </div>
          <div>
            <dt>Mínima</dt>
            <dd>{today?.min ?? current.temperature}°</dd>
          </div>
        </dl>
      </section>

      <section className="topic-metrics" aria-label="Resumo do tempo hoje">
        <article><span>Umidade do ar</span><strong>{current.humidity}%</strong><small>Quanto de umidade há no ar</small></article>
        <article><span>Vento agora</span><strong>{current.windSpeed} km/h</strong><small>Direção {current.windDirection}</small></article>
        <article><span>Rajadas</span><strong>{current.windGust} km/h</strong><small>Picos rápidos do vento</small></article>
        <article><span>Chuva prevista</span><strong>{formatMillimeters(today?.precipitation ?? 0)} mm</strong><small>{today?.rainChance ?? 0}% de chance</small></article>
      </section>

      <WeatherTrendChart hourly={hourly} initialMetric="temperature" />

      <section className="topic-section" aria-labelledby="today-hours-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Hora por hora</span>
            <h2 id="today-hours-title">O que esperar nas próximas horas</h2>
          </div>
          <p>Confira a temperatura, a chance de chuva e as rajadas previstas para cada horário.</p>
        </div>
        <div className="topic-hourly-table">
          {hourly.map((hour, index) => (
            <article
              className={index === 0 ? "is-current" : ""}
              key={`${hour.time}-${index}`}
              aria-label={`${hour.time}: ${hour.temperature} graus, ${hour.precipitation}% de chance de chuva e rajadas de ${hour.windGust} quilômetros por hora`}
            >
              <strong>{hour.time}</strong>
              <WeatherIcon name={hour.icon} title={`Condição às ${hour.time}`} />
              <span data-label="Temperatura">{hour.temperature}°C</span>
              <span data-label="Chuva">{hour.precipitation}% de chuva</span>
              <span data-label="Rajadas">{hour.windGust} km/h</span>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section topic-copy" aria-labelledby="today-faq-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Dúvidas comuns</span>
            <h2 id="today-faq-title">Perguntas sobre o tempo de hoje</h2>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="data-note">
          A previsão pode mudar ao longo do dia. Em situações de risco, siga os avisos da Defesa Civil, do INMET e das autoridades locais.
        </p>
      </section>
    </ForecastPageShell>
  );
}
