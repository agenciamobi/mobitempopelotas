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

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Situação das águas em Pelotas e na Lagoa dos Patos",
  description:
    "Acompanhe a leitura local da Estação Laranjal e o contexto da Lagoa dos Patos, do Guaíba e das cidades monitoradas pelo NivelGuaíba.",
  alternates: { canonical: "/situacao-hidrologica-pelotas" },
  openGraph: {
    title: "Situação das águas em Pelotas",
    description:
      "Leitura local do Laranjal e contexto regional da Lagoa dos Patos e do Guaíba.",
    url: "/situacao-hidrologica-pelotas",
  },
};

export default async function SituacaoHidrologicaPelotasPage() {
  const [weather, laranjal, guaiba, guaibaRegional, lagoonMonitoring] =
    await Promise.all([
      getPelotasWeather(),
      getLaranjalLevelData(),
      getGuaibaObservation(),
      getNivelGuaibaRegionalObservations(),
      getLagoonMonitoringNetwork(),
    ]);
  const today = weather.daily[0];
  const strongestUpcomingGust = Math.max(
    weather.current.windGust,
    ...weather.hourly.map((hour) => hour.windGust),
  );

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Informações sobre as águas relacionadas a Pelotas",
    description:
      "Referências públicas sobre a Estação Laranjal, o Guaíba, a Lagoa dos Patos e outros pontos monitorados no Rio Grande do Sul.",
    url: absoluteUrl("/situacao-hidrologica-pelotas"),
    spatialCoverage: "Pelotas, Lagoa dos Patos e Rio Grande do Sul",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "TEMPO Pelotas",
    },
    isBasedOn: [
      LAGOON_LEVEL_SOURCE.dashboardUrl,
      "https://nivelguaiba.com.br/",
    ],
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
      description="Comece pela leitura local da Estação Laranjal. Depois consulte a rede da Lagoa dos Patos e os estados regionais informados pelo NivelGuaíba."
      currentPath="/situacao-hidrologica-pelotas"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
        }}
      />

      <nav
        className="hydrology-page-index"
        aria-label="Ordem de leitura da situação das águas"
      >
        <div className="hydrology-page-index-intro">
          <span className="eyebrow">Ordem recomendada</span>
          <strong>Leia do local para o regional</strong>
          <p>
            A Estação Laranjal é a referência local exibida para Pelotas. As redes
            regionais ajudam a compreender o contexto e mantêm os critérios das
            respectivas fontes.
          </p>
        </div>
        <div className="hydrology-page-index-links">
          <a href="#nivel-laranjal">
            <span>01</span>
            <strong>Pelotas e Laranjal</strong>
            <small>Leitura local da UFPel</small>
          </a>
          <a href="#rede-lagoa">
            <span>02</span>
            <strong>Lagoa dos Patos</strong>
            <small>Rede FURG e Portos RS</small>
          </a>
          <a href="#guaiba-regional">
            <span>03</span>
            <strong>Guaíba e região</strong>
            <small>Estados informados pelo NivelGuaíba</small>
          </a>
          <a href="#interpretacao">
            <span>04</span>
            <strong>Contexto</strong>
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
            <span className="eyebrow">01 · Fonte local</span>
            <h2 id="hydrology-local-title">Leitura da Estação Laranjal</h2>
          </div>
          <p>
            O TEMPO Pelotas consulta a telemetria pública do LabHidroSens/UFPel e
            organiza o valor, o horário e a variação recente. O portal não define
            cota ou situação de risco para a estação.
          </p>
        </div>

        <div className="hydrology-priority-grid">
          <PelotasHydrologyWidget
            initialData={laranjal}
            weather={{
              windSpeed: weather.current.windSpeed,
              windDirection: weather.current.windDirection,
              windGust: strongestUpcomingGust,
              precipitation: today?.precipitation ?? 0,
            }}
            headingLevel="h3"
            className="pelotas-hydrology-widget--priority"
          />

          <aside
            className="hydrology-priority-context"
            aria-label="Como consultar a leitura local"
          >
            <span className="eyebrow">Como consultar</span>
            <h3>Confirme atualização, tendência e fonte</h3>
            <ol>
              <li>
                <span>1</span>
                <div>
                  <strong>Confira o horário</strong>
                  <p>Verifique quando a última medição foi registrada pela estação.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Observe a evolução</strong>
                  <p>
                    Compare a leitura atual com as últimas horas, sem transformar a
                    variação em classificação de risco.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Siga os avisos oficiais</strong>
                  <p>
                    A leitura apoia o acompanhamento, mas não substitui Defesa Civil e
                    autoridades locais.
                  </p>
                </div>
              </li>
            </ol>
            <a
              href={LAGOON_LEVEL_SOURCE.dashboardUrl}
              target="_blank"
              rel="noreferrer"
            >
              Conferir no painel original da UFPel
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
            <strong>Leituras de pontos ao norte e ao sul de Pelotas</strong>
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
            <h2 id="hydrology-guaiba-title">Guaíba e cidades monitoradas</h2>
          </div>
          <p>
            Nível, cota, estado e indicação de subida ou descida para esses locais
            são apresentados conforme o NivelGuaíba e as fontes identificadas pelo
            serviço.
          </p>
        </div>

        <div className="hydrology-guaiba-note">
          <strong>Cada cidade possui referência própria</strong>
          <p>
            Não transfira a cota ou o valor absoluto de uma estação para outra.
            Consulte data, horário, fonte e situação informada para cada local.
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
            <span className="eyebrow">04 · Contexto geográfico</span>
            <h2 id="hydrology-path-title">Como as águas se relacionam com Pelotas</h2>
          </div>
          <p>
            Guaíba, rios, arroios, chuva, vento, Canal São Gonçalo e a saída para o
            oceano integram um sistema amplo. Esta seção explica relações gerais,
            sem produzir previsão hidrológica.
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

      <section
        className="topic-section hydrology-reference-section"
        aria-labelledby="station-network-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Referências oficiais</span>
            <h2 id="station-network-title">
              Estações relacionadas à Lagoa dos Patos
            </h2>
          </div>
          <p>
            Consulte a fonte original para confirmar uma medição. Cada estação pode
            utilizar metodologia, cota e referencial próprios.
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

      <section
        className="topic-section hydrology-guidance-section"
        aria-labelledby="hydrology-guidance-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Segurança e decisão</span>
            <h2 id="hydrology-guidance-title">O que observar antes de agir</h2>
          </div>
          <p>
            Não tome decisões por uma única leitura. Confirme a atualização,
            consulte a fonte original e siga orientações emitidas pelas autoridades
            responsáveis.
          </p>
        </div>

        <div className="methodology-rules-grid hydrology-guidance-grid">
          <article>
            <h3>Confira a fonte de cada estado</h3>
            <p>
              Normal, atenção, alerta ou inundação devem permanecer associados ao
              serviço que publicou a classificação.
            </p>
          </article>
          <article>
            <h3>Considere rios, lagoas e arroios</h3>
            <p>
              O Guaíba é relevante, mas outras bacias também se relacionam com a
              Lagoa dos Patos.
            </p>
          </article>
          <article>
            <h3>Observe vento e chuva</h3>
            <p>
              Os dados meteorológicos ajudam a contextualizar o cenário, sem
              substituir uma análise hidrológica oficial.
            </p>
          </article>
          <article>
            <h3>Confira data e horário</h3>
            <p>
              Sensores podem atrasar ou ficar fora do ar. Verifique sempre a
              atualização.
            </p>
          </article>
          <article>
            <h3>Siga os avisos oficiais</h3>
            <p>
              Em situação de risco, siga Defesa Civil, Prefeitura, Sanep e demais
              autoridades.
            </p>
          </article>
        </div>

        <div className="hydrology-final-panel">
          <div className="lagoon-disclaimer">
            <strong>O portal organiza fontes públicas</strong>
            <p>
              O TEMPO Pelotas não determina quando uma área vai alagar e não emite
              ordem de saída. Em situações de risco, siga sempre os avisos oficiais.
            </p>
          </div>

          <div className="hydrology-home-actions">
            <Link className="hydrology-primary-action" href="/metodologia">
              Ver de onde vêm as informações
              <span aria-hidden="true">→</span>
            </Link>
            <a
              className="hydrology-secondary-action"
              href={SGB_SACE_URL}
              target="_blank"
              rel="noreferrer"
            >
              Consultar o Serviço Geológico do Brasil
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </ForecastPageShell>
  );
}
