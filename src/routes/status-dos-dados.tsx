import { createFileRoute, Link } from "@tanstack/react-router";

import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";

import "./status-dos-dados.css";

const PAGE_TITLE = "Status dos dados e integrações — Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Acompanhe a disponibilidade das principais fontes meteorológicas e hidrológicas usadas pelo Tempo Pelotas, incluindo INMET, REDEMET, Embrapa, Open-Meteo e medições de nível.";
const PAGE_PATH = "/status-dos-dados";

type ServiceState = "operational" | "partial" | "maintenance" | "offline" | "implementation";

type ServiceCategory = "Meteorologia e avisos" | "Radar e satélite" | "Hidrologia";

type ServiceStatus = {
  id: string;
  name: string;
  provider: string;
  category: ServiceCategory;
  state: ServiceState;
  detail: string;
  checkedAt: string;
  sourceUrl?: string;
};

const weatherSourceMeta = [
  {
    key: "embrapa",
    name: "Observação meteorológica local",
    provider: "Embrapa Clima Temperado",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "inmet",
    name: "Avisos meteorológicos oficiais",
    provider: "INMET",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "cppmet",
    name: "Previsão e contexto regional",
    provider: "CPPMet / UFPel",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "open-meteo",
    name: "Previsão numérica principal",
    provider: "Open-Meteo",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "met-norway",
    name: "Previsão numérica complementar",
    provider: "MET Norway",
    category: "Meteorologia e avisos" as const,
  },
] as const;

function stateFromHealth(status: "live" | "partial" | "unavailable" | "stale", usable: boolean): ServiceState {
  if (status === "unavailable" || !usable) return "offline";
  if (status === "partial" || status === "stale") return "partial";
  return "operational";
}

function stateFromHydrology(status: "live" | "stale" | "unavailable"): ServiceState {
  if (status === "unavailable") return "offline";
  if (status === "stale") return "partial";
  return "operational";
}

function stateFromLayer(configured: boolean, available: boolean): ServiceState {
  return configured && available ? "operational" : "offline";
}

function detailForState(state: ServiceState) {
  if (state === "operational") return "A fonte respondeu normalmente na última verificação.";
  if (state === "partial") {
    return "A fonte respondeu, mas há atraso ou parte das informações não está atualizada.";
  }
  if (state === "maintenance") return "Serviço em manutenção programada pelo Tempo Pelotas.";
  if (state === "implementation") {
    return "Acesso concedido; integração pública ainda em implantação e validação.";
  }
  return "Não foi possível obter dados desta fonte na última verificação.";
}

function labelForState(state: ServiceState) {
  if (state === "operational") return "Ativo";
  if (state === "partial") return "Atualização parcial";
  if (state === "maintenance") return "Manutenção";
  if (state === "implementation") return "Em implantação";
  return "Offline";
}

function overallState(services: ServiceStatus[]): Exclude<ServiceState, "maintenance" | "implementation"> {
  const runtimeServices = services.filter(
    (service) => service.state !== "implementation" && service.state !== "maintenance",
  );
  const offline = runtimeServices.filter((service) => service.state === "offline").length;
  const partial = runtimeServices.filter((service) => service.state === "partial").length;

  if (runtimeServices.length > 0 && offline === runtimeServices.length) return "offline";
  if (offline > 0 || partial > 0) return "partial";
  return "operational";
}

function categoryId(category: ServiceCategory) {
  if (category === "Meteorologia e avisos") return "status-meteorologia";
  if (category === "Radar e satélite") return "status-radar-satelite";
  return "status-hidrologia";
}

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export const Route = createFileRoute("/status-dos-dados")({
  head: () => createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH),
  loader: async () => {
    const checkedAt = new Date().toISOString();
    const [weatherResult, redemetResult, laranjalResult, guaibaResult] = await Promise.allSettled([
      getWeatherIntelligence(),
      getRedemetOverview(),
      getLaranjalLevelData(),
      getGuaibaObservation(),
    ]);

    const services: ServiceStatus[] = [];

    if (weatherResult.status === "fulfilled") {
      for (const meta of weatherSourceMeta) {
        const health = weatherResult.value.weather.sources[meta.key];
        const state = stateFromHealth(health.status, health.usable);
        services.push({
          id: `weather-${meta.key}`,
          name: meta.name,
          provider: meta.provider,
          category: meta.category,
          state,
          detail: detailForState(state),
          checkedAt: health.fetchedAt || checkedAt,
        });
      }
    } else {
      for (const meta of weatherSourceMeta) {
        services.push({
          id: `weather-${meta.key}`,
          name: meta.name,
          provider: meta.provider,
          category: meta.category,
          state: "offline",
          detail: detailForState("offline"),
          checkedAt,
        });
      }
    }

    if (redemetResult.status === "fulfilled") {
      const layers = [
        {
          id: "redemet-radar",
          name: "Radar meteorológico",
          provider: redemetResult.value.radar.provider,
          layer: redemetResult.value.radar,
        },
        {
          id: "redemet-satellite",
          name: "Imagem de satélite",
          provider: redemetResult.value.satellite.provider,
          layer: redemetResult.value.satellite,
        },
        {
          id: "redemet-stsc",
          name: "Ocorrências de trovoadas — STSC",
          provider: redemetResult.value.storms.provider,
          layer: redemetResult.value.storms,
        },
        {
          id: "inmet-satellite",
          name: "Satélite meteorológico complementar",
          provider: redemetResult.value.inmetSatellite.provider,
          layer: redemetResult.value.inmetSatellite,
        },
      ];

      for (const item of layers) {
        const state = stateFromLayer(item.layer.configured, item.layer.available);
        services.push({
          id: item.id,
          name: item.name,
          provider: item.provider,
          category: "Radar e satélite",
          state,
          detail: detailForState(state),
          checkedAt: item.layer.updatedAt || checkedAt,
          sourceUrl: "officialUrl" in item.layer ? item.layer.officialUrl : undefined,
        });
      }
    } else {
      for (const item of [
        ["redemet-radar", "Radar meteorológico", "REDEMET / DECEA"],
        ["redemet-satellite", "Imagem de satélite", "REDEMET / DECEA"],
        ["redemet-stsc", "Ocorrências de trovoadas — STSC", "REDEMET / DECEA"],
        ["inmet-satellite", "Satélite meteorológico complementar", "INMET"],
      ] as const) {
        services.push({
          id: item[0],
          name: item[1],
          provider: item[2],
          category: "Radar e satélite",
          state: "offline",
          detail: detailForState("offline"),
          checkedAt,
        });
      }
    }

    if (laranjalResult.status === "fulfilled") {
      const state = stateFromHydrology(laranjalResult.value.status);
      services.push({
        id: "laranjal-level",
        name: "Nível da Lagoa dos Patos no Laranjal",
        provider: laranjalResult.value.source.name,
        category: "Hidrologia",
        state,
        detail: detailForState(state),
        checkedAt: laranjalResult.value.source.fetchedAt || checkedAt,
        sourceUrl: laranjalResult.value.source.url,
      });
    } else {
      services.push({
        id: "laranjal-level",
        name: "Nível da Lagoa dos Patos no Laranjal",
        provider: "LabHidroSens / UFPel",
        category: "Hidrologia",
        state: "offline",
        detail: detailForState("offline"),
        checkedAt,
      });
    }

    if (guaibaResult.status === "fulfilled") {
      const state = stateFromHydrology(guaibaResult.value.status);
      services.push({
        id: "guaiba-level",
        name: "Nível do Guaíba",
        provider: guaibaResult.value.source.name,
        category: "Hidrologia",
        state,
        detail: detailForState(state),
        checkedAt: guaibaResult.value.source.fetchedAt || checkedAt,
        sourceUrl: guaibaResult.value.source.url,
      });
    } else {
      services.push({
        id: "guaiba-level",
        name: "Nível do Guaíba",
        provider: "MetSul / TideSat Global",
        category: "Hidrologia",
        state: "offline",
        detail: detailForState("offline"),
        checkedAt,
      });
    }

    services.push({
      id: "ana-rhn",
      name: "Rede Hidrometeorológica Nacional",
      provider: "ANA / SNIRH / RHN",
      category: "Hidrologia",
      state: "implementation",
      detail: detailForState("implementation"),
      checkedAt,
      sourceUrl: "https://www.snirh.gov.br/hidroweb/",
    });

    return {
      checkedAt,
      overall: overallState(services),
      services,
    };
  },
  staleTime: 60 * 1_000,
  component: DataStatusPage,
});

function DataStatusPage() {
  const data = Route.useLoaderData();
  const categories: ServiceCategory[] = ["Meteorologia e avisos", "Radar e satélite", "Hidrologia"];
  const counts = {
    operational: data.services.filter((service) => service.state === "operational").length,
    partial: data.services.filter((service) => service.state === "partial").length,
    maintenance: data.services.filter((service) => service.state === "maintenance").length,
    offline: data.services.filter((service) => service.state === "offline").length,
    implementation: data.services.filter((service) => service.state === "implementation").length,
  };
  const overallLabel =
    data.overall === "operational"
      ? "Fontes operando normalmente"
      : data.overall === "offline"
        ? "Fontes essenciais indisponíveis"
        : "Algumas fontes estão com atualização parcial";

  const footerSource = {
    name: "Tempo Pelotas — monitoramento de fontes",
    url: PAGE_PATH,
    isFallback: data.overall !== "operational",
    observationName: "Status das fontes",
    observationUrl: PAGE_PATH,
    forecastName: "Status das integrações",
    forecastUrl: PAGE_PATH,
  } satisfies WeatherData["source"];

  return (
    <div className="site-shell data-status-shell">
      <SiteHeader advisoryLevel="normal" />

      <main className="data-status-page" id="conteudo-principal" tabIndex={-1}>
        <header className="data-status-hero">
          <div>
            <span className="data-status-eyebrow">Transparência operacional</span>
            <h1>Status dos dados e integrações</h1>
            <p>
              Esta página mostra se as principais fontes usadas pelo Tempo Pelotas estão respondendo,
              com atraso, em implantação ou temporariamente indisponíveis.
            </p>
          </div>

          <aside className={`data-status-overview is-${data.overall}`} aria-label="Estado geral dos dados">
            <span aria-hidden="true" />
            <div>
              <small>Estado geral</small>
              <strong>{overallLabel}</strong>
              <p>Última verificação: {formatCheckedAt(data.checkedAt)}</p>
            </div>
          </aside>
        </header>

        <section className="data-status-summary" aria-label="Resumo da disponibilidade">
          <div>
            <strong>{counts.operational}</strong>
            <span>Ativos</span>
          </div>
          <div>
            <strong>{counts.partial}</strong>
            <span>Atualização parcial</span>
          </div>
          <div>
            <strong>{counts.maintenance}</strong>
            <span>Em manutenção</span>
          </div>
          <div>
            <strong>{counts.offline}</strong>
            <span>Offline</span>
          </div>
          <div>
            <strong>{counts.implementation}</strong>
            <span>Em implantação</span>
          </div>
        </section>

        <div className="data-status-groups">
          {categories.map((category) => {
            const headingId = categoryId(category);
            const categoryServices = data.services.filter((service) => service.category === category);

            return (
              <section className="data-status-group" key={category} aria-labelledby={headingId}>
                <header>
                  <h2 id={headingId}>{category}</h2>
                  <strong>{categoryServices.length} integrações</strong>
                </header>

                <div className="data-status-services">
                  {categoryServices.map((service) => (
                    <article className={`data-status-service is-${service.state}`} key={service.id}>
                      <div className="data-status-service__heading">
                        <span className="data-status-service__dot" aria-hidden="true" />
                        <div>
                          <p>{service.provider}</p>
                          <h3>{service.name}</h3>
                        </div>
                        <strong>{labelForState(service.state)}</strong>
                      </div>
                      <p className="data-status-service__detail">{service.detail}</p>
                      <footer>
                        <span>Verificado em {formatCheckedAt(service.checkedAt)}</span>
                        {service.sourceUrl ? (
                          <a href={service.sourceUrl} target="_blank" rel="noopener noreferrer">
                            Fonte
                          </a>
                        ) : null}
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="data-status-explainer" aria-labelledby="data-status-explainer-title">
          <div>
            <span className="data-status-eyebrow">Como interpretar</span>
            <h2 id="data-status-explainer-title">Uma fonte offline não significa que todo o portal parou</h2>
          </div>
          <div>
            <p>
              O Tempo Pelotas combina fontes independentes. Quando uma delas falha, outras áreas podem
              continuar funcionando normalmente. “Atualização parcial” indica atraso ou perda de apenas
              parte do conteúdo; “offline” indica que a consulta daquela integração não respondeu na
              última verificação.
            </p>
            <p>
              Manutenções programadas serão sinalizadas nesta página quando ocorrerem. Integrações em
              implantação, como ANA/RHN, não são contabilizadas como falha operacional.
            </p>
            <Link to="/metodologia">Entenda como cada fonte é utilizada</Link>
          </div>
        </section>
      </main>

      <SiteFooter source={footerSource} />
    </div>
  );
}
