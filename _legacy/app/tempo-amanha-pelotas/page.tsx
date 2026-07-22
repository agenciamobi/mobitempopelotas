import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherIcon } from "@/components/weather-icon";
import type { DailyForecast, WeatherIconName } from "@/lib/weather-data";
import { formatMillimeters } from "@/lib/weather-insights";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Previsão do tempo para amanhã em Pelotas",
  description:
    "Veja a previsão do tempo para amanhã em Pelotas, com máxima, mínima, chance de chuva, volume previsto e rajadas de vento.",
  alternates: { canonical: "/tempo-amanha-pelotas" },
  openGraph: {
    title: "Tempo amanhã em Pelotas, RS",
    description:
      "Confira temperatura, chuva e vento previstos para amanhã em Pelotas.",
    url: "/tempo-amanha-pelotas",
  },
};

const conditionLabels: Record<WeatherIconName, string> = {
  sun: "Predomínio de sol",
  moon: "Céu limpo durante a noite",
  "partly-cloudy": "Sol entre nuvens",
  "partly-cloudy-night": "Noite parcialmente nublada",
  cloud: "Céu nublado",
  rain: "Chuva",
  storm: "Risco de temporal",
  wind: "Vento forte",
};

function forecastDescription(day: DailyForecast) {
  return conditionLabels[day.icon] ?? "Tempo variável";
}

export default async function TempoAmanhaPelotasPage() {
  const weather = await getPelotasWeather();
  const today = weather.daily[0];
  const tomorrow = weather.daily[1];
  const hasReliableForecast = !weather.source.isFallback && Boolean(tomorrow);

  const faqs = hasReliableForecast && tomorrow
    ? [
        {
          question: "Qual será a temperatura amanhã em Pelotas?",
          answer: `A previsão indica máxima de ${tomorrow.max}°C e mínima de ${tomorrow.min}°C em Pelotas.`,
        },
        {
          question: "Vai chover amanhã em Pelotas?",
          answer: `A chance máxima de chuva prevista para amanhã é de ${tomorrow.rainChance}%, com volume diário estimado de ${formatMillimeters(tomorrow.precipitation)} mm.`,
        },
        {
          question: "Como estará o vento amanhã em Pelotas?",
          answer: `As rajadas podem chegar a ${tomorrow.windGust} km/h durante o dia, conforme a previsão disponível.`,
        },
      ]
    : [];

  const faqSchema = faqs.length
    ? {
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
      }
    : null;

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Previsão para o próximo dia"
      title="Previsão do tempo para amanhã em Pelotas"
      description="Consulte as temperaturas, a chuva e as rajadas previstas para organizar o próximo dia."
      currentPath="/tempo-amanha-pelotas"
      heroStat={{
        label: hasReliableForecast && tomorrow ? tomorrow.date : "Previsão diária",
        value: hasReliableForecast && tomorrow ? `${tomorrow.max}° / ${tomorrow.min}°` : "Indisponível",
        detail: hasReliableForecast && tomorrow ? forecastDescription(tomorrow) : "aguardando uma fonte confiável",
        ariaLabel:
          hasReliableForecast && tomorrow
            ? `Amanhã, máxima de ${tomorrow.max} graus e mínima de ${tomorrow.min} graus`
            : "Previsão de amanhã temporariamente indisponível",
        tone: "forecast",
      }}
    >
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      {hasReliableForecast && tomorrow ? (
        <>
          <section className="today-observation-band" aria-labelledby="tomorrow-condition-title">
            <div className="today-observation-icon">
              <WeatherIcon
                name={tomorrow.icon}
                title={`Condição prevista para amanhã: ${forecastDescription(tomorrow)}`}
              />
            </div>
            <div className="today-observation-copy">
              <span className="eyebrow">{tomorrow.weekday} · {tomorrow.date}</span>
              <h2 id="tomorrow-condition-title">{forecastDescription(tomorrow)}</h2>
              <p>
                Previsão diária consolidada para Pelotas, atualizada ao longo do dia.
              </p>
            </div>
            <dl
              className="today-temperature-range"
              aria-label="Temperaturas máxima e mínima previstas para amanhã"
            >
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

          <section className="topic-metrics" aria-label="Resumo da previsão para amanhã">
            <article>
              <span>Chance de chuva</span>
              <strong>{tomorrow.rainChance}%</strong>
              <small>Maior probabilidade prevista no dia</small>
            </article>
            <article>
              <span>Volume previsto</span>
              <strong>{formatMillimeters(tomorrow.precipitation)} mm</strong>
              <small>Acumulado diário estimado</small>
            </article>
            <article>
              <span>Rajada mais forte</span>
              <strong>{tomorrow.windGust} km/h</strong>
              <small>Maior rajada prevista</small>
            </article>
            <article>
              <span>Amplitude térmica</span>
              <strong>{Math.max(0, tomorrow.max - tomorrow.min)}°C</strong>
              <small>Diferença entre máxima e mínima</small>
            </article>
          </section>

          <section className="topic-section topic-copy" aria-labelledby="tomorrow-reading-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Planejamento do próximo dia</span>
                <h2 id="tomorrow-reading-title">Como interpretar a previsão de amanhã</h2>
              </div>
              <p>
                A previsão para amanhã é mais estável do que os dias mais distantes, mas ainda pode mudar com novas atualizações.
              </p>
            </div>
            <div className="copy-columns">
              <div>
                <h3>Compare chuva e volume</h3>
                <p>
                  A chance de chuva indica a possibilidade de precipitação. O volume em milímetros indica quanto pode chover ao longo do dia.
                </p>
              </div>
              <div>
                <h3>Observe as rajadas</h3>
                <p>
                  Rajadas são picos rápidos de vento. Valores mais altos exigem atenção em áreas abertas, na orla e durante atividades externas.
                </p>
              </div>
              {today ? (
                <div>
                  <h3>Comparação com hoje</h3>
                  <p>
                    Hoje, a previsão indica máxima de {today.max}°C e mínima de {today.min}°C. Amanhã, a faixa prevista é de {tomorrow.min}°C a {tomorrow.max}°C.
                  </p>
                </div>
              ) : null}
              <div>
                <h3>Confira novamente antes de sair</h3>
                <p>
                  Consulte a página no início do dia e verifique os avisos oficiais quando houver risco de chuva forte, temporal ou vento intenso.
                </p>
              </div>
            </div>
          </section>

          <section className="topic-section topic-copy" aria-labelledby="tomorrow-faq-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Dúvidas comuns</span>
                <h2 id="tomorrow-faq-title">Perguntas sobre o tempo de amanhã</h2>
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
          </section>
        </>
      ) : (
        <section className="history-note" aria-labelledby="tomorrow-unavailable-title">
          <span className="eyebrow">Dados temporariamente indisponíveis</span>
          <h2 id="tomorrow-unavailable-title">A previsão de amanhã não está disponível agora</h2>
          <p>
            O portal não apresenta números demonstrativos como previsão real. Tente novamente em alguns minutos para consultar os dados atualizados da fonte meteorológica.
          </p>
        </section>
      )}
    </ForecastPageShell>
  );
}
