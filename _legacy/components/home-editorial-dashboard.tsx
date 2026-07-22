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
import {
  getWeatherAdvisory,
  type AdvisoryLevel,
} from "@/lib/weather-insights";

type HomeEditorialDashboardProps = {
  weather: WeatherData;
  advisoryLevel?: AdvisoryLevel;
  observation: EmbrapaObservationData;
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};

const exploreGroups = [
  {
    title: "Planejar o dia",
    description: "Veja a previsão por hora e para os próximos dias.",
    links: [
      ["/tempo-hoje-pelotas", "Previsão de hoje"],
      ["/previsao-7-dias-pelotas", "Previsão para 7 dias"],
    ],
  },
  {
    title: "Acompanhar chuva e vento",
    description:
      "Consulte os horários com maior chance de chuva e as rajadas previstas.",
    links: [
      ["/chuva-em-pelotas", "Chuva por horário"],
      ["/vento-em-pelotas", "Vento e rajadas"],
      ["/alertas", "Avisos oficiais"],
    ],
  },
  {
    title: "Acompanhar as águas",
    description:
      "Acompanhe o nível no Laranjal e em outros pontos da Lagoa dos Patos.",
    links: [
      ["/situacao-hidrologica-pelotas", "Situação das águas"],
      ["/nivel-da-lagoa-dos-patos-laranjal", "Nível no Laranjal"],
    ],
  },
  {
    title: "Câmeras e fontes",
    description: "Veja imagens ao vivo e consulte as fontes usadas pelo portal.",
    links: [
      ["/cameras-ao-vivo-pelotas", "Câmeras ao vivo"],
      ["/metodologia", "Fontes e metodologia"],
    ],
  },
] as const;

const advisoryCopy = {
  normal: {
    eyebrow: "Sem agravamento previsto",
    title: "Não há sinal de chuva ou vento fortes nas próximas horas",
    description:
      "Acompanhe as atualizações e consulte os avisos oficiais antes de atividades ao ar livre.",
    action: "Consultar avisos oficiais",
  },
  attention: {
    eyebrow: "Mudança importante na previsão",
    title: "Chuva e rajadas podem ganhar intensidade",
    description:
      "Confira os horários com maior risco e verifique os avisos oficiais para Pelotas.",
    action: "Consultar avisos oficiais",
  },
  warning: {
    eyebrow: "Risco elevado nas próximas horas",
    title: "Há risco de chuva intensa, temporal ou rajadas fortes",
    description:
      "Consulte os períodos de maior risco e as orientações antes de sair.",
    action: "Consultar avisos oficiais",
  },
} as const;

type RainLevel = "none" | "low" | "moderate" | "high" | "very-high";

function rainReading(value: number) {
  const chance = Math.max(0, Math.min(100, Math.round(value)));

  if (chance === 0)
    return {
      chance,
      level: "none" as RainLevel,
      label: "Sem chuva indicada",
    };
  if (chance < 20)
    return { chance, level: "low" as RainLevel, label: "Chance baixa" };
  if (chance < 50)
    return {
      chance,
      level: "moderate" as RainLevel,
      label: "Chance moderada",
    };
  if (chance < 80)
    return { chance, level: "high" as RainLevel, label: "Chance alta" };
  return {
    chance,
    level: "very-high" as RainLevel,
    label: "Chance muito alta",
  };
}

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
  if (observation.status === "partial")
    return "Alguns dados ainda não foram atualizados";
  if (observation.source.observationTime)
    return `Atualizado às ${observation.source.observationTime}`;
  return "Dados atualizados";
}

function trendLabel(value: number | null) {
  if (value === null)
    return {
      symbol: "·",
      label: "Sem mudança clara",
      direction: "unknown",
    };
  if (Math.abs(value) < 0.1)
    return {
      symbol: "→",
      label: "Praticamente estável",
      direction: "stable",
    };
  if (value > 0)
    return {
      symbol: "↑",
      label: `Subindo ${formatNumber(value)} cm por hora`,
      direction: "rising",
    };
  return {
    symbol: "↓",
    label: `Baixando ${formatNumber(Math.abs(value))} cm por hora`,
    direction: "falling",
  };
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
  advisoryLevel,
  observation,
  laranjal,
  guaiba,
  lagoon,
}: HomeEditorialDashboardProps) {
  const advisory = getWeatherAdvisory(weather);
  const resolvedAdvisoryLevel = advisoryLevel ?? advisory.level;
  const advisoryText = advisoryCopy[resolvedAdvisoryLevel];
  const today = weather.daily[0];
  const hourly = weather.hourly.slice(0, 7);
  const nextDays = weather.daily.slice(1, 5);
  const peakHour = hourly.reduce<(typeof hourly)[number] | null>(
    (highest, hour) =>
      !highest || hour.precipitation > highest.precipitation ? hour : highest,
    null,
  );
  const strongestHourlyGust = hourly.reduce(
    (highest, hour) => Math.max(highest, hour.windGust),
    weather.current.windGust,
  );
  const rainiestDayChance = nextDays.reduce(
    (highest, day) => Math.max(highest, day.rainChance),
    0,
  );
  const forecastWindow =
    hourly.length > 1
      ? `${hourly[0].time} até ${hourly[hourly.length - 1].time}`
      : (hourly[0]?.time ?? "Horários indisponíveis");
  const laranjalTrend = trendLabel(laranjal.trendCmPerHour);
  const guaibaTrend = trendLabel(guaiba.trendCmPerHour);
  const observationAvailable = observation.status !== "unavailable";

  return (
    <>
      <section
        className="home-story home-story--forecast"
        id="previsao-hoje"
        aria-labelledby="home-story-forecast-title"
      >
        <header className="home-story-heading">
          <div>
            <span className="eyebrow">Previsão hora a hora</span>
            <h2 id="home-story-forecast-title">
              Veja como o tempo deve mudar ao longo do dia
            </h2>
          </div>
          <dl className="home-today-facts" aria-label="Resumo do tempo de hoje">
            <div>
              <dt>Temperatura máxima</dt>
              <dd>{today?.max ?? weather.current.temperature}°</dd>
            </div>
            <div>
              <dt>Temperatura mínima</dt>
              <dd>{today?.min ?? weather.current.temperature}°</dd>
            </div>
            <div>
              <dt>Chance de chuva</dt>
              <dd>{today?.rainChance ?? 0}%</dd>
            </div>
            <div>
              <dt>Vento mais forte</dt>
              <dd>
                {today?.windGust ?? weather.current.windGust} km/h
              </dd>
            </div>
          </dl>
        </header>

        <div className={`home-advisory-strip is-${resolvedAdvisoryLevel}`}>
          <span aria-hidden="true" />
          <div>
            <small>{advisoryText.eyebrow}</small>
            <strong>{advisoryText.title}</strong>
          </div>
          <p>{advisoryText.description}</p>
          <Link href="/alertas">{advisoryText.action}</Link>
        </div>

        <div
          className="home-forecast-window"
          aria-label="Resumo das próximas horas"
        >
          <div>
            <small>Janela exibida</small>
            <strong>{hourly.length} horários</strong>
            <span>{forecastWindow}</span>
          </div>
          <div
            className={`rain-${rainReading(peakHour?.precipitation ?? 0).level}`}
          >
            <small>Maior chance de chuva</small>
            <strong>{peakHour?.precipitation ?? 0}%</strong>
            <span>
              {peakHour
                ? `por volta de ${peakHour.time}`
                : "sem horário disponível"}
            </span>
          </div>
          <div>
            <small>Rajada mais forte</small>
            <strong>{strongestHourlyGust} km/h</strong>
            <span>nas próximas horas</span>
          </div>
        </div>

        <div className="home-hourly-story" aria-label="Tempo nas próximas horas">
          {hourly.map((hour, index) => {
            const rain = rainReading(hour.precipitation);
            const isPeak = peakHour === hour && rain.chance > 0;
            const className = [
              `rain-${rain.level}`,
              index === 0 ? "is-current" : "",
              isPeak ? "is-rain-peak" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article
                className={className}
                key={`${hour.time}-${index}`}
                aria-label={`${hour.time}: ${hour.temperature} graus, ${rain.chance}% de chance de chuva e rajadas de até ${hour.windGust} quilômetros por hora`}
              >
                <div className="home-hourly-story__topline">
                  <span>{hour.time}</span>
                  {index === 0 ? (
                    <b>Agora</b>
                  ) : isPeak ? (
                    <b>Maior chance</b>
                  ) : null}
                </div>
                <div className="home-hourly-story__weather">
                  <WeatherIcon
                    name={hour.icon}
                    title={`Tempo às ${hour.time}`}
                  />
                  <strong>{hour.temperature}°</strong>
                </div>
                <div className="home-hourly-story__rain">
                  <div>
                    <span>Chuva</span>
                    <strong>{rain.chance}%</strong>
                  </div>
                  <span className="home-hourly-story__bar" aria-hidden="true">
                    <i style={{ width: `${rain.chance}%` }} />
                  </span>
                  <small>{rain.label}</small>
                </div>
                <span className="home-hourly-story__wind">
                  Rajada de até {hour.windGust} km/h
                </span>
              </article>
            );
          })}
        </div>

        <div className="home-next-days">
          <div className="home-next-days__heading">
            <span className="eyebrow">Próximos dias</span>
            <strong>Previsão para os próximos dias</strong>
          </div>
          <div className="home-next-days__list">
            {nextDays.map((day) => {
              const rain = rainReading(day.rainChance);
              const isRainiest =
                day.rainChance === rainiestDayChance && rain.chance >= 20;

              return (
                <article
                  className={`rain-${rain.level}${isRainiest ? " is-rainiest" : ""}`}
                  key={`${day.weekday}-${day.date}`}
                  aria-label={`${day.weekday}, ${day.date}: máxima de ${day.max} graus, mínima de ${day.min} graus e ${rain.chance}% de chance de chuva`}
                >
                  <div className="home-next-days__topline">
                    <div>
                      <strong>{day.weekday}</strong>
                      <span>{day.date}</span>
                    </div>
                    {isRainiest ? <b>Maior chance</b> : null}
                  </div>
                  <div className="home-next-days__condition">
                    <WeatherIcon
                      name={day.icon}
                      title={`Tempo previsto para ${day.weekday}`}
                    />
                    <span>{rain.label}</span>
                  </div>
                  <div className="home-next-days__rain-meter">
                    <div>
                      <span>Chance de chuva</span>
                      <strong>{rain.chance}%</strong>
                    </div>
                    <i aria-hidden="true">
                      <b style={{ width: `${rain.chance}%` }} />
                    </i>
                    <small>
                      {day.precipitation > 0
                        ? `${formatNumber(day.precipitation)} mm previstos`
                        : "Sem volume relevante"}
                    </small>
                  </div>
                  <div className="home-next-days__temperatures">
                    <span>
                      <small>Máx.</small>
                      <strong>{day.max}°</strong>
                    </span>
                    <span>
                      <small>Mín.</small>
                      <strong>{day.min}°</strong>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="home-inline-links">
            <Link href="/tempo-hoje-pelotas">
              Ver previsão completa de hoje <span aria-hidden="true">→</span>
            </Link>
            <Link href="/previsao-7-dias-pelotas">
              Ver previsão para 7 dias
            </Link>
          </div>
        </div>
      </section>

      <section
        className="home-map-story"
        aria-labelledby="home-map-story-title"
      >
        <div className="home-map-story__copy">
          <span className="eyebrow">Radar e satélite</span>
          <h2 id="home-map-story-title">
            Acompanhe a chuva e as nuvens na região
          </h2>
          <p>
            Use o mapa para observar o que se aproxima de Pelotas e das cidades
            da Zona Sul.
          </p>
          <p className="home-map-story__hint">
            Selecione <strong>Chuva</strong> para ver a animação da precipitação
            ou <strong>Satélite</strong> para acompanhar as nuvens.
          </p>
        </div>
        <div className="home-map-story__frame">
          <WeatherMap regionalWeather={weather.regional} />
        </div>
      </section>

      <section
        className="home-observation-story"
        id="observacao-embrapa"
        aria-labelledby="home-observation-story-title"
      >
        <div className="home-observation-story__intro">
          <span className="eyebrow">Medições da Embrapa em Pelotas</span>
          <h2 id="home-observation-story-title">
            Condições registradas agora
          </h2>
          <p>
            A previsão indica o que pode acontecer. A estação da Embrapa mostra
            as condições medidas neste momento.
          </p>
          <Link href="/estacao-embrapa-pelotas">
            Ver dados completos da estação <span aria-hidden="true">→</span>
          </Link>
        </div>

        {observationAvailable ? (
          <div className="home-observation-story__reading">
            <div className="home-observation-temperature">
              <small>{observationStatusLabel(observation)}</small>
              <strong>{formatNumber(observation.current.temperature)}°</strong>
              <span>
                Sensação de {formatNumber(observation.current.feelsLike)} °C
              </span>
            </div>
            <dl>
              <div>
                <dt>Umidade</dt>
                <dd>{formatNumber(observation.current.humidity, 0)}%</dd>
              </div>
              <div>
                <dt>Vento agora</dt>
                <dd>{formatNumber(observation.current.windSpeed)} km/h</dd>
              </div>
              <div>
                <dt>Chuva registrada hoje</dt>
                <dd>{formatNumber(observation.accumulated.rainDaily)} mm</dd>
              </div>
              <div>
                <dt>Vento mais forte hoje</dt>
                <dd>
                  {formatNumber(observation.extremes.windSpeedMax.value)} km/h
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="home-observation-story__unavailable">
            <strong>Os dados da Embrapa estão indisponíveis agora</strong>
            <span>Tente novamente em alguns minutos.</span>
          </div>
        )}
      </section>

      <section
        className="home-story home-story--water"
        id="situacao-das-aguas"
        aria-labelledby="home-water-story-title"
      >
        <header className="home-story-heading">
          <div>
            <span className="eyebrow">Lagoa dos Patos</span>
            <h2 id="home-water-story-title">
              Acompanhe o nível da água no Laranjal
            </h2>
          </div>
          <p>
            O Laranjal é a referência local para Pelotas. As estações de outras
            cidades ajudam a entender a variação da Lagoa dos Patos.
          </p>
        </header>

        <div className="home-water-story__layout">
          <article className={`home-water-focus is-${laranjal.status}`}>
            <div className="home-water-focus__topline">
              <div>
                <span>Praia do Laranjal</span>
                <small>{laranjal.source.station}</small>
              </div>
              <b>
                {laranjal.status === "live"
                  ? "Dados atualizados"
                  : laranjal.status === "stale"
                    ? "Dados atrasados"
                    : "Sem dados"}
              </b>
            </div>
            <div className="home-water-focus__reading">
              <strong>{formatNumber(laranjal.currentLevel, 2)}</strong>
              <span>m</span>
            </div>
            <p className={`home-water-trend is-${laranjalTrend.direction}`}>
              <b aria-hidden="true">{laranjalTrend.symbol}</b>
              {laranjalTrend.label}
            </p>
            <dl>
              <div>
                <dt>Mudança nas últimas 6 horas</dt>
                <dd>{formatNumber(laranjal.change6hCm)} cm</dd>
              </div>
              <div>
                <dt>Mudança nas últimas 24 horas</dt>
                <dd>{formatNumber(laranjal.change24hCm)} cm</dd>
              </div>
              <div>
                <dt>Última leitura</dt>
                <dd>{formatUpdatedAt(laranjal.updatedAt)}</dd>
              </div>
            </dl>
            <Link href="/nivel-da-lagoa-dos-patos-laranjal">
              Ver nível e histórico do Laranjal <span aria-hidden="true">→</span>
            </Link>
          </article>

          <div className="home-water-table">
            <div className="home-water-table__heading">
              <div>
                <span className="eyebrow">Dados da FURG e Portos RS</span>
                <strong>Outras estações da Lagoa dos Patos</strong>
              </div>
              <small>
                {lagoon.available} de {lagoon.total} locais com dados
              </small>
            </div>

            <div className="home-water-table__columns" aria-hidden="true">
              <span>Local</span>
              <span>Nível agora</span>
              <span>Variação</span>
              <span>Situação</span>
            </div>

            <div className="home-water-table__rows">
              {lagoon.observations.map((station) => {
                const trend = trendLabel(station.trendCmPerHour);
                return (
                  <article
                    key={station.station.id}
                    className={`risk-${station.risk} is-${station.status}`}
                  >
                    <div>
                      <strong>{station.station.city}</strong>
                      <span>{station.station.name}</span>
                    </div>
                    <b>{formatNumber(station.currentLevelCm)} cm</b>
                    <span className={`is-${trend.direction}`}>
                      {trend.symbol} {trend.label}
                    </span>
                    <small>{stationState(station)}</small>
                  </article>
                );
              })}
            </div>

            <div className="home-water-context">
              <div>
                <span>Referência adicional</span>
                <strong>Guaíba em Porto Alegre</strong>
              </div>
              <b>{formatNumber(guaiba.currentLevel, 2)} m</b>
              <span className={`is-${guaibaTrend.direction}`}>
                {guaibaTrend.symbol} {guaibaTrend.label}
              </span>
              <small>{formatUpdatedAt(guaiba.updatedAt)}</small>
            </div>
          </div>
        </div>

        <footer className="home-water-story__footer">
          <p>
            Compare a tendência de cada estação — subida, queda ou estabilidade
            — porque cada local usa uma régua própria.
          </p>
          <Link href="/situacao-hidrologica-pelotas">
            Ver a situação completa das águas <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </section>

      <section
        className="home-explore-story"
        id="explorar-portal"
        aria-labelledby="home-explore-story-title"
      >
        <header>
          <span className="eyebrow">Principais informações do portal</span>
          <h2 id="home-explore-story-title">
            Encontre o que precisa acompanhar
          </h2>
          <p>
            Escolha uma categoria para acessar diretamente a previsão, os
            avisos, as águas ou as fontes dos dados.
          </p>
        </header>
        <div className="home-explore-groups">
          {exploreGroups.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
              <div>
                {group.links.map(([href, label]) => (
                  <Link href={href} key={href}>
                    {label}
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
