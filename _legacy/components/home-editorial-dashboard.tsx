import Link from "next/link";
import { WeatherIcon } from "@/components/weather-icon";
import { WeatherMap } from "@/components/weather-map";
import type { EmbrapaObservationData } from "@/lib/embrapa-observation";
import type { GuaibaObservationData } from "@/lib/guaiba-monitor";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/lib/lagoon-monitoring-network";
import type { LaranjalLevelData } from "@/lib/laranjal-level";
import type { WeatherData } from "@/lib/weather-data";
import { getWeatherAdvisory } from "@/lib/weather-insights";

type HomeEditorialDashboardProps = {
  weather: WeatherData;
  observation: EmbrapaObservationData;
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};

const exploreGroups = [
  {
    title: "Planejar o dia",
    description: "Temperaturas, chuva e horários para organizar sua rotina.",
    links: [
      ["/tempo-hoje-pelotas", "Ver o tempo de hoje"],
      ["/previsao-7-dias-pelotas", "Ver os próximos 7 dias"],
    ],
  },
  {
    title: "Acompanhar chuva e vento",
    description: "Veja quando a chuva ou o vento podem aumentar.",
    links: [
      ["/chuva-em-pelotas", "Chance de chuva"],
      ["/vento-em-pelotas", "Vento em Pelotas"],
      ["/alertas", "Avisos e cuidados"],
    ],
  },
  {
    title: "Acompanhar as águas",
    description: "Consulte o Laranjal e outros pontos da Lagoa dos Patos.",
    links: [
      ["/situacao-hidrologica-pelotas", "Ver como estão as águas"],
      ["/nivel-da-lagoa-dos-patos-laranjal", "Ver o nível no Laranjal"],
    ],
  },
  {
    title: "Conferir outras informações",
    description: "Acesse imagens ao vivo e saiba de onde vêm os dados.",
    links: [
      ["/cameras-ao-vivo-pelotas", "Abrir câmeras ao vivo"],
      ["/metodologia", "Conhecer as fontes"],
    ],
  },
] as const;

const advisoryCopy = {
  normal: {
    eyebrow: "Sem alerta importante agora",
    title: "O tempo segue sem sinal de maior risco",
    description: "Continue acompanhando, porque a previsão pode mudar ao longo do dia.",
    action: "Ver avisos oficiais",
  },
  attention: {
    eyebrow: "Atenção nas próximas horas",
    title: "Chuva ou vento podem aumentar",
    description: "Veja os horários abaixo e acompanhe os avisos oficiais.",
    action: "Entender os cuidados",
  },
  warning: {
    eyebrow: "Atenção redobrada",
    title: "Há chance de tempo forte",
    description: "Confira quando o risco aumenta e siga as orientações oficiais.",
    action: "Ver avisos e orientações",
  },
} as const;

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function observationStatusLabel(observation: EmbrapaObservationData) {
  if (observation.status === "partial") return "Alguns dados ainda não foram atualizados";
  if (observation.source.observationTime) return `Atualizado às ${observation.source.observationTime}`;
  return "Dados atualizados";
}

function trendLabel(value: number | null) {
  if (value === null) return { symbol: "·", label: "Sem mudança clara", direction: "unknown" };
  if (Math.abs(value) < 0.1) return { symbol: "→", label: "Praticamente estável", direction: "stable" };
  if (value > 0) return { symbol: "↑", label: `Subindo ${formatNumber(value)} cm por hora`, direction: "rising" };
  return { symbol: "↓", label: `Baixando ${formatNumber(Math.abs(value))} cm por hora`, direction: "falling" };
}

function stationState(observation: LagoonMonitoringObservation) {
  if (observation.status === "unavailable") return "Sem dados";
  if (observation.status === "stale") return "Dados atrasados";
  if (observation.risk === "flooding") return "Acima do nível de atenção";
  if (observation.risk === "attention") return "Perto do nível de atenção";
  return "Sem sinal de atenção";
}

export function HomeEditorialDashboard({
  weather,
  observation,
  laranjal,
  guaiba,
  lagoon,
}: HomeEditorialDashboardProps) {
  const advisory = getWeatherAdvisory(weather);
  const advisoryText = advisoryCopy[advisory.level];
  const today = weather.daily[0];
  const hourly = weather.hourly.slice(0, 7);
  const nextDays = weather.daily.slice(1, 5);
  const laranjalTrend = trendLabel(laranjal.trendCmPerHour);
  const guaibaTrend = trendLabel(guaiba.trendCmPerHour);
  const observationAvailable = observation.status !== "unavailable";

  return (
    <>
      <section className="home-story home-story--forecast" id="previsao-hoje" aria-labelledby="home-story-forecast-title">
        <header className="home-story-heading">
          <div>
            <span className="eyebrow">Previsão de hoje</span>
            <h2 id="home-story-forecast-title">O que esperar nas próximas horas</h2>
          </div>
          <dl className="home-today-facts" aria-label="Resumo do tempo de hoje">
            <div><dt>Temperatura máxima</dt><dd>{today?.max ?? weather.current.temperature}°</dd></div>
            <div><dt>Temperatura mínima</dt><dd>{today?.min ?? weather.current.temperature}°</dd></div>
            <div><dt>Chance de chuva</dt><dd>{today?.rainChance ?? 0}%</dd></div>
            <div><dt>Vento mais forte</dt><dd>{today?.windGust ?? weather.current.windGust} km/h</dd></div>
          </dl>
        </header>

        <div className={`home-advisory-strip is-${advisory.level}`}>
          <span aria-hidden="true" />
          <div>
            <small>{advisoryText.eyebrow}</small>
            <strong>{advisoryText.title}</strong>
          </div>
          <p>{advisoryText.description}</p>
          <Link href="/alertas">{advisoryText.action}</Link>
        </div>

        <div className="home-hourly-story" aria-label="Tempo nas próximas horas">
          {hourly.map((hour, index) => (
            <article className={index === 0 ? "is-current" : undefined} key={`${hour.time}-${index}`}>
              <span>{hour.time}</span>
              <WeatherIcon name={hour.icon} title={`Tempo às ${hour.time}`} />
              <strong>{hour.temperature}°</strong>
              <small>{hour.precipitation}% de chance de chuva</small>
            </article>
          ))}
        </div>

        <div className="home-next-days">
          <div className="home-next-days__heading">
            <span className="eyebrow">Próximos dias</span>
            <strong>Como fica o tempo depois de hoje</strong>
          </div>
          <div className="home-next-days__list">
            {nextDays.map((day) => (
              <article key={`${day.weekday}-${day.date}`}>
                <div><strong>{day.weekday}</strong><span>{day.date}</span></div>
                <WeatherIcon name={day.icon} title={`Tempo previsto para ${day.weekday}`} />
                <span>{day.rainChance}% de chance de chuva</span>
                <b>{day.max}° <small>{day.min}°</small></b>
              </article>
            ))}
          </div>
          <div className="home-inline-links">
            <Link href="/tempo-hoje-pelotas">Ver detalhes de hoje <span aria-hidden="true">→</span></Link>
            <Link href="/previsao-7-dias-pelotas">Ver a previsão dos próximos 7 dias</Link>
          </div>
        </div>
      </section>

      <section className="home-map-story" aria-labelledby="home-map-story-title">
        <div className="home-map-story__copy">
          <span className="eyebrow">Mapa do tempo</span>
          <h2 id="home-map-story-title">Veja chuva e nuvens chegando à região</h2>
          <p>Use o mapa para acompanhar o que se aproxima. Para saber o que esperar em Pelotas, confira a previsão acima.</p>
          <p className="home-map-story__hint">Escolha <strong>Chuva</strong> para acompanhar a animação ou <strong>Satélite</strong> para observar as nuvens.</p>
        </div>
        <div className="home-map-story__frame">
          <WeatherMap regionalWeather={weather.regional} />
        </div>
      </section>

      <section className="home-observation-story" id="observacao-embrapa" aria-labelledby="home-observation-story-title">
        <div className="home-observation-story__intro">
          <span className="eyebrow">Tempo registrado em Pelotas · Embrapa</span>
          <h2 id="home-observation-story-title">O que está acontecendo agora</h2>
          <p>A previsão mostra o que pode acontecer. A Embrapa mostra o que já está sendo registrado em Pelotas.</p>
          <Link href="/estacao-embrapa-pelotas">Ver todos os dados da Embrapa <span aria-hidden="true">→</span></Link>
        </div>

        {observationAvailable ? (
          <div className="home-observation-story__reading">
            <div className="home-observation-temperature">
              <small>{observationStatusLabel(observation)}</small>
              <strong>{formatNumber(observation.current.temperature)}°</strong>
              <span>Sensação de {formatNumber(observation.current.feelsLike)} °C</span>
            </div>
            <dl>
              <div><dt>Umidade</dt><dd>{formatNumber(observation.current.humidity, 0)}%</dd></div>
              <div><dt>Vento agora</dt><dd>{formatNumber(observation.current.windSpeed)} km/h</dd></div>
              <div><dt>Chuva registrada hoje</dt><dd>{formatNumber(observation.accumulated.rainDaily)} mm</dd></div>
              <div><dt>Vento mais forte hoje</dt><dd>{formatNumber(observation.extremes.windSpeedMax.value)} km/h</dd></div>
            </dl>
          </div>
        ) : (
          <div className="home-observation-story__unavailable">
            <strong>Os dados da Embrapa estão indisponíveis agora</strong>
            <span>Tente novamente em alguns minutos.</span>
          </div>
        )}
      </section>

      <section className="home-story home-story--water" id="situacao-das-aguas" aria-labelledby="home-water-story-title">
        <header className="home-story-heading">
          <div>
            <span className="eyebrow">Nível das águas</span>
            <h2 id="home-water-story-title">Como estão as águas no Laranjal</h2>
          </div>
          <p>O Laranjal é a principal referência para Pelotas. As outras cidades ajudam a mostrar como a Lagoa dos Patos está se comportando.</p>
        </header>

        <div className="home-water-story__layout">
          <article className={`home-water-focus is-${laranjal.status}`}>
            <div className="home-water-focus__topline">
              <div><span>Praia do Laranjal</span><small>{laranjal.source.station}</small></div>
              <b>{laranjal.status === "live" ? "Dados atualizados" : laranjal.status === "stale" ? "Dados atrasados" : "Sem dados"}</b>
            </div>
            <div className="home-water-focus__reading"><strong>{formatNumber(laranjal.currentLevel, 2)}</strong><span>m</span></div>
            <p className={`home-water-trend is-${laranjalTrend.direction}`}><b aria-hidden="true">{laranjalTrend.symbol}</b>{laranjalTrend.label}</p>
            <dl>
              <div><dt>Mudança nas últimas 6 horas</dt><dd>{formatNumber(laranjal.change6hCm)} cm</dd></div>
              <div><dt>Mudança nas últimas 24 horas</dt><dd>{formatNumber(laranjal.change24hCm)} cm</dd></div>
              <div><dt>Última leitura</dt><dd>{formatUpdatedAt(laranjal.updatedAt)}</dd></div>
            </dl>
            <Link href="/nivel-da-lagoa-dos-patos-laranjal">Ver nível e histórico do Laranjal <span aria-hidden="true">→</span></Link>
          </article>

          <div className="home-water-table">
            <div className="home-water-table__heading">
              <div><span className="eyebrow">Dados da FURG e Portos RS</span><strong>Acompanhe outros pontos da Lagoa</strong></div>
              <small>{lagoon.available} de {lagoon.total} locais com dados</small>
            </div>

            <div className="home-water-table__columns" aria-hidden="true">
              <span>Local</span>
              <span>Nível agora</span>
              <span>Está mudando</span>
              <span>Situação</span>
            </div>

            <div className="home-water-table__rows">
              {lagoon.observations.map((station) => {
                const trend = trendLabel(station.trendCmPerHour);
                return (
                  <article key={station.station.id} className={`risk-${station.risk} is-${station.status}`}>
                    <div><strong>{station.station.city}</strong><span>{station.station.name}</span></div>
                    <b>{formatNumber(station.currentLevelCm)} cm</b>
                    <span className={`is-${trend.direction}`}>{trend.symbol} {trend.label}</span>
                    <small>{stationState(station)}</small>
                  </article>
                );
              })}
            </div>

            <div className="home-water-context">
              <div><span>Outra referência do estado</span><strong>Guaíba em Porto Alegre</strong></div>
              <b>{formatNumber(guaiba.currentLevel, 2)} m</b>
              <span className={`is-${guaibaTrend.direction}`}>{guaibaTrend.symbol} {guaibaTrend.label}</span>
              <small>{formatUpdatedAt(guaiba.updatedAt)}</small>
            </div>
          </div>
        </div>

        <footer className="home-water-story__footer">
          <p>Observe principalmente se a água está subindo, baixando ou estável. Cada local usa uma régua diferente.</p>
          <Link href="/situacao-hidrologica-pelotas">Ver a situação completa das águas <span aria-hidden="true">→</span></Link>
        </footer>
      </section>

      <section className="home-explore-story" id="explorar-portal" aria-labelledby="home-explore-story-title">
        <header>
          <span className="eyebrow">Continue pelo que importa</span>
          <h2 id="home-explore-story-title">O que você quer acompanhar?</h2>
          <p>Escolha um caminho para encontrar a informação sem precisar procurar pelo portal inteiro.</p>
        </header>
        <div className="home-explore-groups">
          {exploreGroups.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
              <div>
                {group.links.map(([href, label]) => (
                  <Link href={href} key={href}>{label}<span aria-hidden="true">→</span></Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
