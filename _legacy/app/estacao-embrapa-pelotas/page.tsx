import type { Metadata } from "next";
import Link from "next/link";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import {
  EMBRAPA_MONITOR_URL,
  getEmbrapaObservation,
  type TimedObservation,
} from "@/lib/embrapa-observation";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Estação meteorológica da Embrapa em Pelotas",
  description:
    "Consulte temperatura, umidade, vento, pressão e chuva medidos pela Embrapa Clima Temperado em Pelotas.",
  alternates: { canonical: "/estacao-embrapa-pelotas" },
  openGraph: {
    title: "Medições da Embrapa em Pelotas",
    description:
      "Veja o que a estação da Embrapa Clima Temperado registrou em Pelotas.",
    url: "/estacao-embrapa-pelotas",
  },
};

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "Indisponível";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatFetchedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function ExtremeCard({
  label,
  minimum,
  maximum,
  unit,
}: {
  label: string;
  minimum: TimedObservation;
  maximum: TimedObservation;
  unit: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <div>
        <small>Menor valor</small>
        <strong>{formatNumber(minimum.value)}{unit}</strong>
        <em>{minimum.time ?? "Horário indisponível"}</em>
      </div>
      <div>
        <small>Maior valor</small>
        <strong>{formatNumber(maximum.value)}{unit}</strong>
        <em>{maximum.time ?? "Horário indisponível"}</em>
      </div>
    </article>
  );
}

export default async function EstacaoEmbrapaPelotasPage() {
  const [weather, observation] = await Promise.all([
    getPelotasWeather(),
    getEmbrapaObservation(),
  ]);
  const available = observation.status !== "unavailable";

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Observações meteorológicas da Embrapa Clima Temperado em Pelotas",
    description:
      "Temperatura, umidade, vento, pressão e chuva observados na Sede da Embrapa Clima Temperado.",
    url: absoluteUrl("/estacao-embrapa-pelotas"),
    sameAs: EMBRAPA_MONITOR_URL,
    spatialCoverage: "Pelotas, Rio Grande do Sul, Brasil",
    temporalCoverage: "Tempo real e acumulados do dia, mês e ano",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "Embrapa Clima Temperado",
      url: "https://www.embrapa.br/clima-temperado",
    },
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Medições feitas em Pelotas"
      title="Estação Embrapa Clima Temperado"
      description="Veja a temperatura, a chuva, o vento e outras condições medidas pela estação da Embrapa em Pelotas."
      currentPath="/estacao-embrapa-pelotas"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
        }}
      />

      {available ? (
        <>
          <section className="embrapa-page-current" aria-labelledby="embrapa-current-title">
            <div className="embrapa-page-reading">
              <span className="embrapa-live-status">
                <i aria-hidden="true" />
                {observation.status === "live" ? "Medição disponível" : "Alguns valores indisponíveis"}
              </span>
              <span className="eyebrow">Temperatura medida</span>
              <h2 id="embrapa-current-title">
                {formatNumber(observation.current.temperature)}°C
              </h2>
              <p>
                Sensação térmica de {formatNumber(observation.current.feelsLike)} °C. A temperatura em que
                pode haver formação de orvalho ou neblina está em {formatNumber(observation.current.dewPoint)} °C.
              </p>
              <small>Consultado na Embrapa em {formatFetchedAt(observation.source.fetchedAt)}</small>
            </div>

            <div className="embrapa-page-current-grid">
              <article>
                <span>Umidade do ar</span>
                <strong>{formatNumber(observation.current.humidity, 0)}%</strong>
              </article>
              <article>
                <span>Pressão do ar</span>
                <strong>{formatNumber(observation.current.pressure)} hPa</strong>
                <small>{observation.current.pressureTrend ?? "Sem comparação disponível"}</small>
              </article>
              <article>
                <span>Vento medido</span>
                <strong>{formatNumber(observation.current.windSpeed)} km/h</strong>
                <small>{observation.current.windDirection ?? "Direção indisponível"}</small>
              </article>
              <article>
                <span>Nascer e pôr do sol</span>
                <strong>
                  {observation.current.sunrise ?? "—"} · {observation.current.sunset ?? "—"}
                </strong>
              </article>
            </div>
          </section>

          <section className="topic-section" aria-labelledby="embrapa-rain-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Chuva medida</span>
                <h2 id="embrapa-rain-title">Quanto choveu na estação</h2>
              </div>
              <p>
                Estes valores foram medidos no local da Embrapa. A chuva pode ser diferente no Centro,
                Laranjal e em outros bairros de Pelotas.
              </p>
            </div>

            <div className="embrapa-accumulated-grid">
              <article>
                <span>Hoje</span>
                <strong>{formatNumber(observation.accumulated.rainDaily)} mm</strong>
              </article>
              <article>
                <span>Neste mês</span>
                <strong>{formatNumber(observation.accumulated.rainMonthly)} mm</strong>
              </article>
              <article>
                <span>Neste ano</span>
                <strong>{formatNumber(observation.accumulated.rainAnnual)} mm</strong>
              </article>
            </div>
          </section>

          <section className="topic-section" aria-labelledby="embrapa-extremes-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Menores e maiores valores de hoje</span>
                <h2 id="embrapa-extremes-title">O que a estação registrou</h2>
              </div>
              <p>Veja o menor e o maior valor do dia e o horário em que cada um foi registrado.</p>
            </div>

            <div className="embrapa-extremes-grid">
              <ExtremeCard
                label="Temperatura do ar"
                minimum={observation.extremes.temperatureMin}
                maximum={observation.extremes.temperatureMax}
                unit=" °C"
              />
              <ExtremeCard
                label="Umidade do ar"
                minimum={observation.extremes.humidityMin}
                maximum={observation.extremes.humidityMax}
                unit="%"
              />
              <ExtremeCard
                label="Temperatura para formação de orvalho"
                minimum={observation.extremes.dewPointMin}
                maximum={observation.extremes.dewPointMax}
                unit=" °C"
              />
              <article>
                <span>Vento mais forte do dia</span>
                <div>
                  <small>Maior valor</small>
                  <strong>
                    {formatNumber(observation.extremes.windSpeedMax.value)} km/h
                  </strong>
                  <em>
                    {observation.extremes.windSpeedMax.time ?? "Horário indisponível"}
                  </em>
                </div>
              </article>
            </div>
          </section>

          <section className="topic-section" aria-labelledby="embrapa-agro-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Água que voltou para o ar</span>
                <h2 id="embrapa-agro-title">Perda de água do solo e das plantas</h2>
              </div>
              <p>
                Esta informação ajuda agricultores, hortas e jardins a entender quanto de água pode ter
                voltado para o ar pela ação do calor, do vento, do solo e das plantas.
              </p>
            </div>

            <div className="embrapa-accumulated-grid embrapa-accumulated-grid--agro">
              <article>
                <span>Hoje</span>
                <strong>
                  {formatNumber(observation.accumulated.evapotranspirationDaily, 2)} mm
                </strong>
              </article>
              <article>
                <span>Neste mês</span>
                <strong>
                  {formatNumber(observation.accumulated.evapotranspirationMonthly, 2)} mm
                </strong>
              </article>
              <article>
                <span>Neste ano</span>
                <strong>
                  {formatNumber(observation.accumulated.evapotranspirationAnnual, 2)} mm
                </strong>
              </article>
            </div>
          </section>
        </>
      ) : (
        <section className="topic-section embrapa-page-unavailable" role="status">
          <span className="eyebrow">Medições temporariamente indisponíveis</span>
          <h2>Não foi possível mostrar os valores da estação</h2>
          <p>{observation.error}</p>
          <a href={EMBRAPA_MONITOR_URL} target="_blank" rel="noreferrer">
            Consultar diretamente na Embrapa
            <span aria-hidden="true">↗</span>
          </a>
        </section>
      )}

      <section className="topic-section" aria-labelledby="embrapa-location-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Onde a medição é feita</span>
            <h2 id="embrapa-location-title">O que estes valores representam</h2>
          </div>
          <p>
            A estação fica na Sede da Embrapa Clima Temperado, em Pelotas, a 57 metros de altura em relação ao mar.
          </p>
        </div>

        <div className="methodology-rules-grid">
          <article>
            <h3>O tempo muda entre os bairros</h3>
            <p>
              Temperatura, chuva e vento podem ser diferentes no local da estação, no Centro, no
              Laranjal e nas áreas rurais.
            </p>
          </article>
          <article>
            <h3>A estação mostra o que aconteceu</h3>
            <p>
              Estes valores foram medidos. A previsão mostra o que pode acontecer nas próximas horas e pode apresentar números diferentes.
            </p>
          </article>
          <article>
            <h3>A atualização pode parar</h3>
            <p>
              Se a página da Embrapa ficar fora do ar ou mudar, as medições podem deixar de aparecer temporariamente no portal.
            </p>
          </article>
          <article>
            <h3>Use junto dos avisos oficiais</h3>
            <p>
              As medições ajudam a entender o tempo local, mas não substituem os avisos da Defesa Civil, do INMET ou da própria Embrapa.
            </p>
          </article>
        </div>

        <div className="hydrology-home-actions">
          <a className="hydrology-primary-action" href={EMBRAPA_MONITOR_URL} target="_blank" rel="noreferrer">
            Consultar diretamente na Embrapa
            <span aria-hidden="true">↗</span>
          </a>
          <Link className="hydrology-secondary-action" href="/metodologia">
            Ver de onde vêm as informações
          </Link>
        </div>
      </section>
    </ForecastPageShell>
  );
}
