import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherIcon } from "@/components/weather-icon";
import { formatMillimeters, getWeekHighlights } from "@/lib/weather-insights";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Previsão do tempo para 7 dias em Pelotas",
  description:
    "Confira a previsão de 7 dias para Pelotas, RS, com máximas, mínimas, chuva e rajadas de vento.",
  alternates: { canonical: "/previsao-7-dias-pelotas" },
  openGraph: {
    title: "Previsão de 7 dias em Pelotas",
    description:
      "Veja o que esperar de temperatura, chuva e vento durante a semana em Pelotas.",
    url: "/previsao-7-dias-pelotas",
  },
};

export default async function PrevisaoSeteDiasPage() {
  const weather = await getPelotasWeather();
  const highlights = getWeekHighlights(weather.daily);
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Previsão do tempo para 7 dias em Pelotas",
    itemListElement: weather.daily.map((day, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${day.weekday}, ${day.date}: máxima de ${day.max}°C, mínima de ${day.min}°C e ${day.rainChance}% de chance de chuva`,
    })),
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Planeje os próximos dias"
      title="Previsão do tempo para 7 dias em Pelotas"
      description="Confira as temperaturas, a chuva e o vento previstos para organizar sua semana."
      currentPath="/previsao-7-dias-pelotas"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="topic-metrics" aria-label="Destaques da semana">
        <article>
          <span>Dia mais quente</span>
          <strong>{highlights.hottest?.max ?? 0}°C</strong>
          <small>{highlights.hottest?.weekday} · {highlights.hottest?.date}</small>
        </article>
        <article>
          <span>Noite mais fria</span>
          <strong>{highlights.coldest?.min ?? 0}°C</strong>
          <small>{highlights.coldest?.weekday} · {highlights.coldest?.date}</small>
        </article>
        <article>
          <span>Maior volume de chuva</span>
          <strong>{formatMillimeters(highlights.wettest?.precipitation ?? 0)} mm</strong>
          <small>{highlights.wettest?.weekday} · {highlights.wettest?.rainChance ?? 0}% de chance</small>
        </article>
        <article>
          <span>Vento mais forte</span>
          <strong>{highlights.windiest?.windGust ?? 0} km/h</strong>
          <small>{highlights.windiest?.weekday} · {highlights.windiest?.date}</small>
        </article>
      </section>

      <section className="topic-section" aria-labelledby="week-list-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Dia a dia</span>
            <h2 id="week-list-title">Veja a previsão de cada dia</h2>
          </div>
          <p>A previsão é atualizada ao longo do dia e pode mudar, principalmente para as datas mais distantes.</p>
        </div>

        <div className="week-forecast-grid">
          {weather.daily.map((day, index) => (
            <article className={index === 0 ? "is-today" : ""} key={`${day.weekday}-${day.date}`}>
              <div className="week-card-heading">
                <div><strong>{day.weekday}</strong><span>{day.date}</span></div>
                {index === 0 ? <small>Hoje</small> : null}
              </div>
              <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
              <div className="week-card-temperature">
                <strong>{day.max}°</strong>
                <span>{day.min}°</span>
              </div>
              <dl>
                <div><dt>Chance de chuva</dt><dd>{day.rainChance}%</dd></div>
                <div><dt>Volume previsto</dt><dd>{formatMillimeters(day.precipitation)} mm</dd></div>
                <div><dt>Rajadas</dt><dd>{day.windGust} km/h</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section topic-copy" aria-labelledby="week-reading-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Leia a previsão com atenção</span>
            <h2 id="week-reading-title">O que observar antes de planejar</h2>
          </div>
        </div>
        <div className="copy-columns">
          <div>
            <h3>Os próximos dias costumam ser mais confiáveis</h3>
            <p>A previsão para hoje e amanhã tende a mudar menos. Para o fim da semana, confira novamente antes de sair ou marcar uma atividade.</p>
          </div>
          <div>
            <h3>Chance e volume de chuva são informações diferentes</h3>
            <p>A porcentagem mostra a possibilidade de chover. Os milímetros mostram quanto pode chover durante o dia.</p>
          </div>
        </div>
      </section>
    </ForecastPageShell>
  );
}
