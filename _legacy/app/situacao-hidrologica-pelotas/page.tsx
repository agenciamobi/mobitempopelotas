import type { Metadata } from "next";
import Link from "next/link";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { GuaibaLevelCard } from "@/components/guaiba-level-card";
import { LagoonMonitoringNetwork } from "@/components/lagoon-monitoring-network";
import { PelotasHydrologyWidget } from "@/components/pelotas-hydrology-widget";
import { getGuaibaObservation } from "@/lib/guaiba-monitor";
import {
  HYDROLOGY_FLOW,
  HYDROLOGY_STATIONS,
  SGB_SACE_URL,
} from "@/lib/hydrology";
import { getLagoonMonitoringNetwork } from "@/lib/lagoon-monitoring-network";
import { getLaranjalLevelData } from "@/lib/laranjal-level";
import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";
import { getNivelGuaibaRegionalObservations } from "@/lib/nivel-guaiba-regional";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Situação das águas em Pelotas e na Lagoa dos Patos",
  description:
    "Acompanhe primeiro o nível no Laranjal e depois a rede da Lagoa dos Patos, o Guaíba, o vento e a chuva para entender melhor a situação das águas em Pelotas.",
  alternates: { canonical: "/situacao-hidrologica-pelotas" },
  openGraph: {
    title: "Situação das águas em Pelotas",
    description:
      "Veja primeiro o nível no Laranjal e depois a rede da Lagoa dos Patos, o Guaíba e as condições que podem influenciar Pelotas.",
    url: "/situacao-hidrologica-pelotas",
  },
};

export default async function SituacaoHidrologicaPelotasPage() {
  const [weather, guaiba, guaibaRegional, lagoonMonitoring, laranjalLevel] =
    await Promise.all([
      getPelotasWeather(),
      getGuaibaObservation(),
      getNivelGuaibaRegionalObservations(),
      getLagoonMonitoringNetwork(),
      getLaranjalLevelData(),
    ]);
  const today = weather.daily[0];
  const maxHourlyGust = Math.max(
    weather.current.windGust,
    ...weather.hourly.map((hour) => hour.windGust),
  );

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Informações sobre as águas relacionadas a Pelotas",
    description:
      "Informações públicas sobre o nível no Laranjal, o Guaíba, a Lagoa dos Patos e outros pontos monitorados no Rio Grande do Sul.",
    url: absoluteUrl("/situacao-hidrologica-pelotas"),
    spatialCoverage: "Pelotas, Lagoa dos Patos e Rio Grande do Sul",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "TEMPO Pelotas",
    },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: absoluteUrl("/api/hydrology/laranjal"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: absoluteUrl("/api/hydrology/guaiba"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: absoluteUrl("/api/hydrology/guaiba/cities"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: absoluteUrl("/api/hydrology/lagoon-network"),
      },
    ],
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Águas e segurança em Pelotas"
      title="Situação das águas"
      description="Comece pela medição local do Laranjal. Depois acompanhe a Lagoa dos Patos, o Guaíba e os demais fatores que ajudam a compreender o que pode afetar as áreas mais baixas de Pelotas."
      currentPath="/situacao-hidrologica-pelotas"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetSchema).replace(/</g, "\u003c"),
        }}
      />

      <nav className="hydrology-page-index" aria-label="Ordem de leitura da situação das águas">
        <div className="hydrology-page-index-intro">
          <span className="eyebrow">Ordem recomendada</span>
          <strong>Leia do local para o regional</strong>
          <p>
            O nível medido em Pelotas tem prioridade. As demais redes ajudam a explicar o contexto, mas não
            substituem a leitura local nem os avisos oficiais.
          </p>
        </div>
        <div className="hydrology-page-index-links">
          <a href="#nivel-laranjal">
            <span>01</span>
            <strong>Pelotas e Laranjal</strong>
            <small>Medição local prioritária</small>
          </a>
          <a href="#rede-lagoa">
            <span>02</span>
            <strong>Lagoa dos Patos</strong>
            <small>Rede FURG e Portos RS</small>
          </a>
          <a href="#guaiba-regional">
            <span>03</span>
            <strong>Guaíba e região</strong>
            <small>Contexto de entrada da lagoa</small>
          </a>
          <a href="#interpretacao">
            <span>04</span>
            <strong>Interpretação</strong>
            <small>Caminho da água e segurança</small>
          </a>
        </div>
      </nav>

      <section
        className="topic-section hydrology-priority-section"
        id="nivel-laranjal"
        aria-labelledby="hydrology-local-title"
      >
        <div className="section-heading hydrology-priority-heading">
          <div>
            <span className="eyebrow">01 · Prioridade local</span>
            <h2 id="hydrology-local-title">Comece pelo nível medido em Pelotas</h2>
          </div>
          <p>
            A estação do Laranjal é a referência mais próxima para acompanhar a situação local. Observe o
            valor, a tendência, o horário da medição, o vento e a chuva antes de consultar o cenário regional.
          </p>
        </div>

        <div className="hydrology-priority-grid">
          <PelotasHydrologyWidget
            headingLevel="h3"
            initialData={laranjalLevel}
            weather={{
              windSpeed: weather.current.windSpeed,
              windDirection: weather.current.windDirection,
              windGust: maxHourlyGust,
              precipitation: today?.precipitation ?? 0,
            }}
            className="pelotas-hydrology-widget--priority"
          />

          <aside className="hydrology-priority-context" aria-label="Como interpretar a medição local">
            <span className="eyebrow">Como ler este painel</span>
            <h3>A medição local vem antes de qualquer comparação</h3>
            <ol>
              <li>
                <span>1</span>
                <div>
                  <strong>Confira o horário</strong>
                  <p>Uma leitura antiga pode não representar a condição atual.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Observe a tendência</strong>
                  <p>A sequência de subidas ou descidas importa mais que uma leitura isolada.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Considere vento e chuva</strong>
                  <p>Esses fatores podem empurrar, represar ou acelerar a movimentação da água.</p>
                </div>
              </li>
            </ol>
            <a href={LAGOON_LEVEL_SOURCE.dashboardUrl} target="_blank" rel="noreferrer">
              Abrir medidor original do Laranjal
              <span aria-hidden="true">↗</span>
            </a>
          </aside>
        </div>
      </section>

      <div className="hydrology-network-stage" id="rede-lagoa">
        <div className="hydrology-stage-heading">
          <span>02</span>
          <div>
            <small>Rede ao longo da lagoa</small>
            <strong>Compare Pelotas com pontos ao norte e ao sul</strong>
          </div>
        </div>
        <LagoonMonitoringNetwork data={lagoonMonitoring} variant="full" />
      </div>

      <section
        className="topic-section hydrology-guaiba-section"
        id="guaiba-regional"
        aria-labelledby="hydrology-guaiba-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 · Contexto regional</span>
            <h2 id="hydrology-guaiba-title">Guaíba e outros pontos do Rio Grande do Sul</h2>
          </div>
          <p>
            O Guaíba é uma das entradas da Lagoa dos Patos. Os demais pontos ajudam a acompanhar o cenário
            estadual, mas cada cidade possui régua, referência e dinâmica próprias.
          </p>
        </div>

        <div className="hydrology-guaiba-note">
          <strong>Não compare apenas os números absolutos</strong>
          <p>
            Use principalmente a tendência de cada local — subindo, estável ou baixando — e sempre verifique
            data, horário e fonte da medição.
          </p>
        </div>

        <GuaibaLevelCard data={guaiba} regional={guaibaRegional} />
      </section>

      <section
        className="topic-section hydrology-interpretation-section"
        id="interpretacao"
        aria-labelledby="hydrology-path-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">04 · Interpretação</span>
            <h2 id="hydrology-path-title">Como a água pode influenciar Pelotas</h2>
          </div>
          <p>
            A água que chega ao Laranjal não vem apenas do Guaíba. Rios, arroios, chuva, vento e a saída para
            o oceano atuam em conjunto e podem alterar o comportamento da lagoa.
          </p>
        </div>

        <div className="hydrology-page-flow">
          {HYDROLOGY_FLOW.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section hydrology-reference-section" aria-labelledby="station-network-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Referências oficiais</span>
            <h2 id="station-network-title">Estações relacionadas à Lagoa dos Patos</h2>
          </div>
          <p>
            Consulte a fonte original quando precisar confirmar uma medição. Cada estação pode utilizar
            metodologia, cota e referencial próprios.
          </p>
        </div>

        <div className="hydrology-stations-grid">
          {HYDROLOGY_STATIONS.map((station) => (
            <article key={station.code}>
              <span className="station-code">Identificação ANA {station.code}</span>
              <small>{station.city}</small>
              <h3>{station.name}</h3>
              <p>{station.role}</p>
              <a href={station.officialUrl} target="_blank" rel="noreferrer">
                Consultar medição oficial
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section hydrology-guidance-section" aria-labelledby="hydrology-guidance-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Segurança e decisão</span>
            <h2 id="hydrology-guidance-title">O que observar antes de agir</h2>
          </div>
          <p>
            Não tome decisões por uma única leitura. Acompanhe a evolução, confirme a atualização e siga as
            orientações emitidas pelas autoridades responsáveis.
          </p>
        </div>

        <div className="methodology-rules-grid hydrology-guidance-grid">
          <article>
            <h3>Veja se o nível continua subindo</h3>
            <p>Uma sequência de altas merece mais atenção do que uma pequena mudança isolada.</p>
          </article>
          <article>
            <h3>Considere todos os rios e arroios</h3>
            <p>O Guaíba é importante, mas outras bacias também alimentam a Lagoa dos Patos.</p>
          </article>
          <article>
            <h3>Observe vento, chuva e saída para o mar</h3>
            <p>Esses fatores podem alterar a velocidade e a direção da movimentação da água.</p>
          </article>
          <article>
            <h3>Confira a data e o horário</h3>
            <p>Sensores podem atrasar ou ficar fora do ar. Verifique sempre a atualização.</p>
          </article>
          <article>
            <h3>Siga os avisos oficiais</h3>
            <p>Em situação de risco, siga Defesa Civil, Prefeitura, Sanep e demais autoridades.</p>
          </article>
        </div>

        <div className="hydrology-final-panel">
          <div className="lagoon-disclaimer">
            <strong>O portal ajuda no acompanhamento</strong>
            <p>
              O TEMPO Pelotas não determina quando uma área vai alagar e não emite ordem de saída. Em
              situações de risco, siga sempre os avisos oficiais.
            </p>
          </div>

          <div className="hydrology-home-actions">
            <Link className="hydrology-primary-action" href="/metodologia">
              Ver de onde vêm as informações
              <span aria-hidden="true">→</span>
            </Link>
            <a className="hydrology-secondary-action" href={SGB_SACE_URL} target="_blank" rel="noreferrer">
              Consultar o Serviço Geológico do Brasil
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </ForecastPageShell>
  );
}
