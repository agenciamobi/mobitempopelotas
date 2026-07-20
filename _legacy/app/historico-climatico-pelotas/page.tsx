import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherHistoryChart } from "@/components/weather-history-chart";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeatherHistory } from "@/lib/weather-history-service";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Como foi o tempo nos últimos 30 dias em Pelotas",
  description:
    "Compare temperatura, chuva e rajadas dos últimos 30 dias em Pelotas, RS.",
  alternates: { canonical: "/historico-climatico-pelotas" },
  openGraph: {
    title: "Últimos 30 dias do tempo em Pelotas",
    description:
      "Veja os dias mais quentes, mais frios e mais chuvosos do período recente em Pelotas.",
    url: "/historico-climatico-pelotas",
  },
};

export default async function HistoricoClimaticoPelotasPage() {
  const [weather, history] = await Promise.all([
    getPelotasWeather(),
    getPelotasWeatherHistory(),
  ]);
  const { summary } = history;

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Histórico meteorológico recente de Pelotas",
    description:
      "Informações diárias dos últimos 30 dias sobre temperaturas, chuva e rajadas de vento em Pelotas, RS.",
    url: absoluteUrl("/historico-climatico-pelotas"),
    temporalCoverage: `${history.days[0]?.date}/${history.days.at(-1)?.date}`,
    spatialCoverage: {
      "@type": "Place",
      name: "Pelotas, Rio Grande do Sul, Brasil",
      geo: {
        "@type": "GeoCoordinates",
        latitude: -31.7654,
        longitude: -52.3376,
      },
    },
    creator: {
      "@type": "Organization",
      name: "TEMPO Pelotas",
    },
    isBasedOn: history.source.url || undefined,
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Veja os últimos 30 dias"
      title="Como foi o tempo em Pelotas"
      description="Compare temperatura, chuva e vento para entender como o tempo mudou durante o último mês."
      currentPath="/historico-climatico-pelotas"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="history-summary" aria-label="Resumo dos últimos 30 dias">
        <article>
          <span>Média das temperaturas mais altas</span>
          <strong>{summary.averageMax}°C</strong>
          <small>{summary.periodLabel}</small>
        </article>
        <article>
          <span>Média das temperaturas mais baixas</span>
          <strong>{summary.averageMin}°C</strong>
          <small>Durante o período</small>
        </article>
        <article>
          <span>Chuva no período</span>
          <strong>{summary.totalPrecipitation.toFixed(1)} mm</strong>
          <small>Total estimado nos 30 dias</small>
        </article>
        <article>
          <span>Rajada mais forte</span>
          <strong>{summary.strongestWindGust} km/h</strong>
          <small>Maior valor encontrado</small>
        </article>
      </section>

      <WeatherHistoryChart days={history.days} />

      <section className="history-records" aria-label="Destaques dos últimos 30 dias">
        <article>
          <span>Dia mais quente</span>
          <strong>{summary.warmestDay.temperatureMax}°C</strong>
          <p>{summary.warmestDay.weekday}, {summary.warmestDay.label}</p>
        </article>
        <article>
          <span>Noite mais fria</span>
          <strong>{summary.coldestDay.temperatureMin}°C</strong>
          <p>{summary.coldestDay.weekday}, {summary.coldestDay.label}</p>
        </article>
        <article>
          <span>Dia mais chuvoso</span>
          <strong>{summary.wettestDay.precipitation.toFixed(1)} mm</strong>
          <p>{summary.wettestDay.weekday}, {summary.wettestDay.label}</p>
        </article>
      </section>

      <section className="history-note" aria-labelledby="history-method-title">
        <span className="eyebrow">Importante saber</span>
        <h2 id="history-method-title">Estes valores ajudam a comparar os dias</h2>
        <p>
          As informações representam uma estimativa para a região de Pelotas. Elas podem ser diferentes
          das medições feitas por estações instaladas em pontos específicos da cidade. Fonte: {history.source.name}.
        </p>
        {history.source.isFallback ? (
          <p className="data-note">
            A fonte habitual está temporariamente indisponível. Por isso, esta área mostra valores de exemplo e não deve ser usada para decisões importantes.
          </p>
        ) : null}
      </section>
    </ForecastPageShell>
  );
}
