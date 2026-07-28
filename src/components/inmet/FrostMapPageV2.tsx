"use client";

import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  Database,
  ExternalLink,
  Info,
  ListFilter,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Table2,
  ThermometerSnowflake,
} from "lucide-react";

import type { FrostMapData, FrostStationType } from "@/lib/inmet/frost.types";

import "./FrostMapPageV2.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const RS_CENTER: [number, number] = [-53.2, -29.8];
const SOURCE_ID = "inmet-frost-v2-source";
const CLUSTERS_LAYER_ID = "inmet-frost-v2-clusters";
const CLUSTER_COUNT_LAYER_ID = "inmet-frost-v2-cluster-count";
const POINTS_LAYER_ID = "inmet-frost-v2-points";
const PERIOD_OPTIONS = [1, 5, 10, 15, 20, 30] as const;

type FrostMapPageProps = { initialData: FrostMapData };

type PopupProperties = {
  stationCode?: unknown;
  stationName?: unknown;
  state?: unknown;
  date?: unknown;
  minimumTemperature?: unknown;
  intensityLabel?: unknown;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Data não informada";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatTemperature(value: number | null | undefined) {
  if (value === null || value === undefined) return "Não informada";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)} °C`;
}

function createPopupContent(properties: PopupProperties) {
  const wrapper = document.createElement("div");
  wrapper.className = "frost-v2-popup";

  const title = document.createElement("strong");
  title.textContent = `${String(properties.stationName ?? "Estação")}/${String(properties.state ?? "RS")}`;

  const code = document.createElement("span");
  code.textContent = `Código ${String(properties.stationCode ?? "não informado")}`;

  const date = document.createElement("span");
  date.textContent = `Registro: ${formatDate(String(properties.date ?? ""))}`;

  const rawTemperature = Number(properties.minimumTemperature);
  const temperature = document.createElement("span");
  temperature.textContent = `Mínima: ${formatTemperature(Number.isFinite(rawTemperature) ? rawTemperature : null)}`;

  const intensity = document.createElement("b");
  intensity.textContent = String(properties.intensityLabel ?? "Intensidade indefinida");

  wrapper.append(title, code, date, temperature, intensity);
  return wrapper;
}

function stationTypeLabel(value: FrostStationType) {
  return value === "CONVENCIONAL" ? "Estações convencionais" : "Estações automáticas";
}

export function FrostMapHero({ initialData }: FrostMapPageProps) {
  return (
    <section className="frost-v2-hero" aria-labelledby="frost-v2-hero-title">
      <div className="frost-v2-hero__content">
        <span className="frost-v2-eyebrow">Observação agrometeorológica · INMET</span>
        <h1 id="frost-v2-hero-title">Geadas observadas no Rio Grande do Sul.</h1>
        <p>
          Consulte registros associados às estações do INMET. O mapa representa pontos de observação e
          datas passadas; não é previsão de geada nem cobertura contínua de todo o território.
        </p>
        <div className="frost-v2-hero__actions">
          <a href="#mapa-de-ocorrencias">Explorar o mapa <ArrowRight aria-hidden="true" /></a>
          <Link to="/clima-em-pelotas">Entender o clima local</Link>
        </div>
      </div>

      <aside className={`frost-v2-hero__summary is-${initialData.status}`}>
        <header>
          <span><Snowflake aria-hidden="true" />{initialData.status === "live" ? "Fonte respondendo" : "Fonte indisponível"}</span>
          <small>Consulta em {formatDateTime(initialData.source.fetchedAt)}</small>
        </header>
        <div>
          <span>Consulta inicial</span>
          <strong>{initialData.summary.stations}</strong>
          <p>estações com registros no período selecionado pela rota</p>
        </div>
        <dl>
          <div><dt>Registros</dt><dd>{initialData.summary.observations}</dd></div>
          <div><dt>Menor mínima</dt><dd>{formatTemperature(initialData.summary.lowestTemperature)}</dd></div>
        </dl>
        <footer>{formatDate(initialData.filters.startDate)} a {formatDate(initialData.filters.endDate)}</footer>
      </aside>
    </section>
  );
}

export function FrostMapPageV2({ initialData }: FrostMapPageProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initializedRef = useRef(false);
  const firstFilterRunRef = useRef(true);
  const [data, setData] = useState(initialData);
  const [days, setDays] = useState(initialData.filters.days);
  const [stationType, setStationType] = useState<FrostStationType>(initialData.filters.stationType);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: data.stations.map((station) => ({
        type: "Feature" as const,
        id: station.stationCode,
        properties: {
          stationCode: station.stationCode,
          stationName: station.stationName,
          state: station.state,
          date: station.latest.date,
          minimumTemperature: station.latest.minimumTemperature,
          intensity: station.latest.intensity,
          intensityLabel: station.latest.intensityLabel,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [station.longitude, station.latitude],
        },
      })),
    }),
    [data.stations],
  );

  const recentObservations = useMemo(
    () =>
      data.stations
        .flatMap((station) => station.observations)
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || a.stationName.localeCompare(b.stationName, "pt-BR"),
        )
        .slice(0, 60),
    [data.stations],
  );

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || initializedRef.current) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const initializeMap = async () => {
      if (initializedRef.current || cancelled || !mapContainerRef.current) return;
      initializedRef.current = true;

      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !mapContainerRef.current) return;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: RS_CENTER,
          zoom: 5.3,
          minZoom: 4,
          maxZoom: 13,
          cooperativeGestures: true,
        });
        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        map.addControl(new maplibregl.FullscreenControl(), "bottom-right");

        map.once("load", () => {
          if (cancelled) return;
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: featureCollection,
            cluster: true,
            clusterMaxZoom: 8,
            clusterRadius: 44,
          });
          map.addLayer({
            id: CLUSTERS_LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": ["step", ["get", "point_count"], "#18bdcd", 8, "#5e2ced", 20, "#e70b85"],
              "circle-radius": ["step", ["get", "point_count"], 18, 8, 23, 20, 29],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
              "circle-opacity": 0.94,
            },
          });
          map.addLayer({
            id: CLUSTER_COUNT_LAYER_ID,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
            paint: { "text-color": "#ffffff" },
          });
          map.addLayer({
            id: POINTS_LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 9, 9, 13, 12],
              "circle-color": [
                "match",
                ["get", "intensity"],
                "strong", "#e70b85",
                "moderate", "#f27035",
                "weak", "#18bdcd",
                "possible", "#5e2ced",
                "#8b9aa3",
              ],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
              "circle-opacity": 0.96,
            },
          });

          map.on("click", CLUSTERS_LAYER_ID, (event) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            map.easeTo({
              center: feature.geometry.coordinates as [number, number],
              zoom: Math.min(map.getZoom() + 2, 10),
              duration: 550,
            });
          });
          map.on("click", POINTS_LAYER_ID, (event) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            new maplibregl.Popup({ closeButton: true, maxWidth: "310px" })
              .setLngLat(feature.geometry.coordinates as [number, number])
              .setDOMContent(createPopupContent(feature.properties ?? {}))
              .addTo(map);
          });
          for (const layerId of [CLUSTERS_LAYER_ID, POINTS_LAYER_ID]) {
            map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
          }
          setIsMapLoaded(true);
        });
      } catch (error) {
        console.error("Falha ao inicializar o mapa de geadas:", error);
        if (!cancelled) setMapError(true);
      }
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            void initializeMap();
            observer?.disconnect();
          }
        },
        { rootMargin: "260px" },
      );
      observer.observe(container);
    } else {
      void initializeMap();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    (map.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(featureCollection);

    if (!data.stations.length) {
      map.easeTo({ center: RS_CENTER, zoom: 5.3, duration: 500 });
      return;
    }

    const longitudes = data.stations.map((station) => station.longitude);
    const latitudes = data.stations.map((station) => station.latitude);
    const west = Math.min(...longitudes);
    const east = Math.max(...longitudes);
    const south = Math.min(...latitudes);
    const north = Math.max(...latitudes);

    if (west === east && south === north) {
      map.easeTo({ center: [west, south], zoom: 8, duration: 550 });
    } else {
      map.fitBounds([[west, south], [east, north]], { padding: 72, maxZoom: 8, duration: 650 });
    }
  }, [data.stations, featureCollection, isMapLoaded]);

  useEffect(() => {
    if (firstFilterRunRef.current) {
      firstFilterRunRef.current = false;
      return;
    }

    const controller = new AbortController();
    setIsRefreshing(true);
    setRefreshError(null);

    fetch(`/api/inmet/geadas?days=${days}&stationType=${stationType}&uf=RS`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`API de geadas respondeu com status ${response.status}`);
        return response.json() as Promise<FrostMapData>;
      })
      .then(setData)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Falha ao atualizar o mapa de geadas:", error);
        setRefreshError("Os filtros não puderam ser atualizados. A última consulta válida permanece na tela.");
      })
      .finally(() => setIsRefreshing(false));

    return () => controller.abort();
  }, [days, stationType]);

  return (
    <div className="frost-v2-page">
      <nav className="frost-v2-chapters" aria-label="Capítulos do mapa de geadas">
        <a href="#estado-da-consulta"><span>01</span><strong>Consulta</strong><small>Fonte, período e cobertura</small></a>
        <a href="#mapa-de-ocorrencias"><span>02</span><strong>Mapa</strong><small>Registros por estação</small></a>
        <a href="#distribuicao-das-ocorrencias"><span>03</span><strong>Intensidade</strong><small>Classificação retornada</small></a>
        <a href="#registros-de-geada"><span>04</span><strong>Tabela</strong><small>Lista acessível</small></a>
        <a href="#limites-do-monitoramento"><span>05</span><strong>Limites</strong><small>O que o mapa não confirma</small></a>
      </nav>

      <section className={`frost-v2-source is-${data.status}`} id="estado-da-consulta" aria-labelledby="frost-v2-source-title" role="status">
        <Database aria-hidden="true" />
        <div>
          <span className="frost-v2-eyebrow">Estado da fonte</span>
          <h2 id="frost-v2-source-title">{data.status === "live" ? "Consulta do INMET disponível" : "Consulta do INMET indisponível"}</h2>
          <p>{data.message ?? "Os registros foram processados para os filtros atualmente selecionados."}</p>
        </div>
        <dl>
          <div><dt>Período</dt><dd>{formatDate(data.filters.startDate)} a {formatDate(data.filters.endDate)}</dd></div>
          <div><dt>Tipo</dt><dd>{stationTypeLabel(data.filters.stationType)}</dd></div>
          <div><dt>Consulta</dt><dd>{formatDateTime(data.source.fetchedAt)}</dd></div>
        </dl>
      </section>

      <section className="frost-v2-map-section" id="mapa-de-ocorrencias" aria-labelledby="frost-v2-map-title">
        <header className="frost-v2-section-heading">
          <div>
            <span className="frost-v2-eyebrow">Registros por estação</span>
            <h2 id="frost-v2-map-title">Filtre o período e explore os pontos observados</h2>
          </div>
          <p>
            Cada marcador representa uma estação com registro retornado. Agrupamentos indicam apenas a
            quantidade de pontos próximos na visualização, não a extensão territorial da geada.
          </p>
        </header>

        <div className="frost-v2-filters">
          <fieldset>
            <legend><CalendarRange aria-hidden="true" />Período consultado</legend>
            <div>
              {PERIOD_OPTIONS.map((option) => (
                <button key={option} type="button" aria-pressed={days === option} className={days === option ? "is-active" : undefined} onClick={() => setDays(option)}>
                  {option === 1 ? "1 dia" : `${option} dias`}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend><ListFilter aria-hidden="true" />Tipo de estação</legend>
            <div>
              {(["CONVENCIONAL", "AUTOMATICA"] as FrostStationType[]).map((type) => (
                <button key={type} type="button" aria-pressed={stationType === type} className={stationType === type ? "is-active" : undefined} onClick={() => setStationType(type)}>
                  {type === "CONVENCIONAL" ? "Convencional" : "Automática"}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="frost-v2-filter-state" aria-live="polite">
            <RefreshCw className={isRefreshing ? "is-spinning" : undefined} aria-hidden="true" />
            <span>{isRefreshing ? "Atualizando filtros" : `${data.summary.stations} estações · ${data.summary.observations} registros`}</span>
          </div>
        </div>

        {refreshError ? <p className="frost-v2-refresh-error" role="status"><AlertTriangle aria-hidden="true" />{refreshError}</p> : null}

        <div className="frost-v2-map-shell" aria-busy={isRefreshing}>
          <div ref={mapContainerRef} className="frost-v2-map" aria-label="Mapa de registros de geada por estação no Rio Grande do Sul" />
          <div className="frost-v2-legend" aria-label="Legenda de intensidade da geada">
            <strong>Classificação</strong>
            <span><i className="is-strong" />Forte</span>
            <span><i className="is-moderate" />Moderada</span>
            <span><i className="is-weak" />Fraca</span>
            <span><i className="is-possible" />Possível ocorrência</span>
            <span><i className="is-undefined" />Indefinida</span>
          </div>
          <div className={`frost-v2-loading${isMapLoaded && !isRefreshing ? " is-hidden" : ""}`} role="status">
            <span aria-hidden="true" />
            <strong>{mapError ? "Mapa temporariamente indisponível" : isRefreshing ? "Atualizando registros" : "Carregando mapa"}</strong>
            <small>{mapError ? "A tabela continua disponível abaixo." : "Os pontos serão agrupados conforme o nível de zoom."}</small>
          </div>
        </div>
      </section>

      <section className="frost-v2-summary" id="distribuicao-das-ocorrencias" aria-labelledby="frost-v2-summary-title">
        <header className="frost-v2-section-heading">
          <div>
            <span className="frost-v2-eyebrow">Distribuição retornada</span>
            <h2 id="frost-v2-summary-title">Intensidade dos registros no filtro atual</h2>
          </div>
          <p>
            A classificação depende do tipo de estação. Estações automáticas são apresentadas pelo produto
            como possível ocorrência; não recebem a mesma gradação das convencionais.
          </p>
        </header>
        <div className="frost-v2-summary-grid">
          <article><Snowflake aria-hidden="true" /><span>Forte</span><strong>{data.summary.strong}</strong><small>Classificação convencional</small></article>
          <article><ThermometerSnowflake aria-hidden="true" /><span>Moderada</span><strong>{data.summary.moderate}</strong><small>Classificação convencional</small></article>
          <article><Snowflake aria-hidden="true" /><span>Fraca</span><strong>{data.summary.weak}</strong><small>Classificação convencional</small></article>
          <article><MapPinned aria-hidden="true" /><span>Possível ocorrência</span><strong>{data.summary.possible}</strong><small>Produto de estação automática</small></article>
          <article><Info aria-hidden="true" /><span>Indefinida</span><strong>{data.summary.undefined}</strong><small>Sem classificação reconhecida</small></article>
        </div>
      </section>

      <section className="frost-v2-table-section" id="registros-de-geada" aria-labelledby="frost-v2-table-title">
        <header className="frost-v2-section-heading">
          <div>
            <span className="frost-v2-eyebrow">Consulta acessível</span>
            <h2 id="frost-v2-table-title">Registros mais recentes do filtro</h2>
          </div>
          <p>
            A tabela complementa o mapa e permite conferir estação, código, data, temperatura mínima e
            classificação. São exibidas até 60 ocorrências recentes.
          </p>
        </header>

        {recentObservations.length ? (
          <>
            <div className="frost-v2-table-intro"><Table2 aria-hidden="true" /><span><strong>{recentObservations.length} linhas exibidas</strong><small>{formatDate(data.filters.startDate)} a {formatDate(data.filters.endDate)}</small></span></div>
            <div className="frost-v2-table-wrap">
              <table>
                <caption>Registros de geada retornados pelas estações do INMET no Rio Grande do Sul</caption>
                <thead><tr><th scope="col">Estação</th><th scope="col">Data</th><th scope="col">Mínima</th><th scope="col">Classificação</th></tr></thead>
                <tbody>
                  {recentObservations.map((observation) => (
                    <tr key={observation.id}>
                      <th scope="row"><strong>{observation.stationName}/{observation.state}</strong><small>{observation.stationCode}</small></th>
                      <td>{formatDate(observation.date)}</td>
                      <td>{formatTemperature(observation.minimumTemperature)}</td>
                      <td><span className={`frost-v2-intensity is-${observation.intensity}`}>{observation.intensityLabel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="frost-v2-empty" role="status">
            <Snowflake aria-hidden="true" />
            <div><strong>Nenhum registro foi retornado para estes filtros</strong><p>Isso não comprova ausência de geada em locais sem estação, fora do período ou sem dado reconhecido.</p></div>
          </div>
        )}
      </section>

      <section className="frost-v2-limits" id="limites-do-monitoramento" aria-labelledby="frost-v2-limits-title">
        <AlertTriangle aria-hidden="true" />
        <div>
          <span className="frost-v2-eyebrow">Interpretação correta</span>
          <h2 id="frost-v2-limits-title">Ausência de ponto não significa ausência de geada</h2>
          <p>
            O mapa é uma amostra espacial formada por estações. Baixadas, lavouras, áreas serranas e
            microclimas rurais podem apresentar condições diferentes da estação mais próxima. Para decisão
            agrícola, combine observação, previsão agrometeorológica e orientação técnica local.
          </p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </section>

      <section className="frost-v2-actions" aria-label="Ações relacionadas ao mapa de geadas">
        <div><span className="frost-v2-eyebrow">Fonte e contexto</span><h2>Compare observação passada com previsão e clima</h2></div>
        <div>
          <a href={data.source.portalUrl} target="_blank" rel="noopener noreferrer">Portal do INMET <ExternalLink aria-hidden="true" /></a>
          <Link to="/tempo-amanha-pelotas">Previsão de amanhã <ArrowRight aria-hidden="true" /></Link>
          <Link to="/clima-em-pelotas">Clima de Pelotas</Link>
          <Link to="/metodologia">Metodologia e fontes</Link>
        </div>
      </section>
    </div>
  );
}
