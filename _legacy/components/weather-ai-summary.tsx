import type { WeatherData } from "@/lib/weather-data";
import type {
  ForecastNarrative,
  WeatherAiSummaries,
} from "@/lib/weather-ai-summary";

type HomeWeatherAiSummariesProps = {
  weather: WeatherData;
  summaries: WeatherAiSummaries;
};

type WeatherNarrativeBandProps = {
  period: "today" | "tomorrow";
  narrative: ForecastNarrative | null;
};

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function ForecastNarrativeContent({
  narrative,
}: {
  narrative: ForecastNarrative | null;
}) {
  if (!narrative) {
    return (
      <p className="weather-ai-summary__unavailable">
        Resumo automático temporariamente indisponível. Consulte os dados
        detalhados abaixo.
      </p>
    );
  }

  return (
    <>
      <h3>{narrative.headline}</h3>
      <p>{narrative.summary}</p>
    </>
  );
}

export function HomeWeatherAiSummaries({
  weather,
  summaries,
}: HomeWeatherAiSummariesProps) {
  const today = weather.daily[0];
  const tomorrow = weather.daily[1];

  if (!today || !tomorrow || weather.source.isFallback) return null;

  const cards = [
    {
      id: "today",
      label: "Hoje",
      date: today.date,
      narrative: summaries.today,
      day: today,
    },
    {
      id: "tomorrow",
      label: "Amanhã",
      date: tomorrow.date,
      narrative: summaries.tomorrow,
      day: tomorrow,
    },
  ] as const;

  return (
    <section
      className="home-weather-ai-summaries"
      aria-labelledby="home-weather-ai-title"
    >
      <header className="home-weather-ai-summaries__heading">
        <div>
          <span className="eyebrow">Resumo automático da previsão</span>
          <h2 id="home-weather-ai-title">Hoje e amanhã em leitura direta</h2>
        </div>
        <p>
          A síntese interpreta somente os dados meteorológicos apresentados. Os
          valores permanecem disponíveis para conferência.
        </p>
      </header>

      <div className="home-weather-ai-summaries__grid">
        {cards.map((card) => (
          <article className={`weather-ai-summary-card is-${card.id}`} key={card.id}>
            <div className="weather-ai-summary-card__topline">
              <strong>{card.label}</strong>
              <span>{card.date}</span>
            </div>

            <div className="weather-ai-summary-card__narrative">
              <small>
                <i aria-hidden="true" />
                {card.narrative ? "Síntese gerada por IA" : "Síntese indisponível"}
              </small>
              <ForecastNarrativeContent narrative={card.narrative} />
            </div>

            <dl className="weather-ai-summary-card__metrics">
              <div>
                <dt>Máxima</dt>
                <dd>{card.day.max}°</dd>
              </div>
              <div>
                <dt>Mínima</dt>
                <dd>{card.day.min}°</dd>
              </div>
              <div>
                <dt>Chance de chuva</dt>
                <dd>{card.day.rainChance}%</dd>
              </div>
              <div>
                <dt>Volume previsto</dt>
                <dd>{formatNumber(card.day.precipitation)} mm</dd>
              </div>
              <div>
                <dt>Rajada máxima</dt>
                <dd>{card.day.windGust} km/h</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <footer>
        Resumos gerados automaticamente a partir da previsão exibida. A previsão
        pode mudar com novas atualizações da fonte.
      </footer>
    </section>
  );
}

export function WeatherNarrativeBand({
  period,
  narrative,
}: WeatherNarrativeBandProps) {
  const isToday = period === "today";

  return (
    <section
      className={`weather-narrative-band is-${period}`}
      aria-labelledby={`weather-narrative-${period}-title`}
    >
      <div className="weather-narrative-band__label">
        <span aria-hidden="true" />
        <small>Resumo automático da previsão</small>
      </div>
      <div className="weather-narrative-band__copy">
        {narrative ? (
          <>
            <h2 id={`weather-narrative-${period}-title`}>{narrative.headline}</h2>
            <p>{narrative.summary}</p>
          </>
        ) : (
          <>
            <h2 id={`weather-narrative-${period}-title`}>
              Resumo automático temporariamente indisponível
            </h2>
            <p>
              Consulte {isToday ? "as condições e os horários" : "as temperaturas, a chuva e o vento"} nos dados detalhados abaixo.
            </p>
          </>
        )}
      </div>
      <p className="weather-narrative-band__note">
        A IA interpreta somente os dados da previsão. Os números abaixo vêm
        diretamente da fonte meteorológica usada pelo portal.
      </p>
    </section>
  );
}
