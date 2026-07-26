"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type { FrostMapData, FrostStationType } from "@/lib/inmet/frost.types";

import styles from "./FrostMapPage.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const RS_CENTER: [number, number] = [-53.2, -29.8];
const SOURCE_ID = "inmet-frost-source";
const CLUSTERS_LAYER_ID = "inmet-frost-clusters";
const CLUSTER_COUNT_LAYER_ID = "inmet-frost-cluster-count";
const POINTS_LAYER_ID = "inmet-frost-points";
const PERIOD_OPTIONS = [1, 5, 10, 15, 20, 30] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatTemperature(value: number | null) {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)} °C`;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createPopupContent(properties: Record<string, unknown>) {
  const wrapper = document.createElement("div");
  wrapper.className = styles.popup;

  const title = document.createElement("strong");
  title.textContent = `${String(properties.stationName)} — ${String(properties.state)}`;

  const station = document.createElement("span");
  station.textContent = `Estação ${String(properties.stationCode)}`;

  const date = document.createElement("span");
  date.textContent = `Último registro: ${formatDate(String(properties.date))}`;

  const temperature = document.createElement("span");
  const numericTemperature = Number(properties.minimumTemperature);
  temperature.textContent = `Temperatura mínima: ${formatTemperature(
    Number.isFinite(numericTemperature) ? numericTemperature : null,
  )}`;

  const intensity = document.createElement("b");
  intensity.textContent = String(properties.intensityLabel);

  wrapper.append(title, station, date, temperature, intensity);
  return wrapper;
}

export function FrostMapPage({ initialData }: { initialData: FrostMapData }) {
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
        .slice(0, 40),
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
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#18bdcd",
                8,
                "#5e2ced",
                20,
                "#e70b85",
              ],
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
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
              "text-font": ["Noto Sans Bold"],
            },
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
                "strong",
                "#e70b85",
                "moderate",
                "#f27035",
                "weak",
                "#18bdcd",
                "possible",
                "#5e2ced",
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
            new maplibregl.Popup({ closeButton: true, maxWidth: "290px" })
              .setLngLat(feature.geometry.coordinates as [number, number])
              .setDOMContent(createPopupContent(feature.properties ?? {}))
              .addTo(map);
          });
          for (const layerId of [CLUSTERS_LAYER_ID, POINTS_LAYER_ID]) {
            map.on("mouseenter", layerId, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layerId, () => {
              map.getCanvas().style.cursor = "";
            });
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

    if (data.stations.length === 0) {
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
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: 72, maxZoom: 8, duration: 650 },
      );
    }
  }, [data.stations, featureCollection, isMapLoaded]);

  useEffect(() => {
    if (firstFilterRunRef.current) {
      firstFilterRunRef.current = false;
      return;
    }

    const controller = new AbortController();
    setIsRefreshing(true);

    fetch(`/api/inmet/geadas?days=${days}&stationType=${stationType}&uf=RS`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`API de geadas respondeu com status ${response.status}`);
        return response.json() as Promise<FrostMapData>;
      })
      .then(setData)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Falha ao atualizar o mapa de geadas:", error);
      })
      .finally(() => setIsRefreshing(false));

    return () => controller.abort();
  }, [days, stationType]);

  return (
    <main className={styles.page} id="conteudo-principal">
      <section className={styles.hero}>
        <div>
          <span>Monitoramento agrometeorológico · INMET</span>
          <h1>Mapa de geadas observadas no Rio Grande do Sul</h1>
          <p>
            Consulte ocorrências registradas pelas estações meteorológicas, com temperatura mínima,
            intensidade estimada, data e localização. O mapa mostra observações passadas, não previsão.
          </p>
        </div>
        <dl>
          <div><dt>Estações no período</dt><dd>{data.summary.stations}</dd></div>
          <div><dt>Registros</dt><dd>{data.summary.observations}</dd></div>
          <div><dt>Menor temperatura</dt><dd>{formatTemperature(data.summary.lowestTemperature)}</dd></div>
        </dl>
      </section>

      <section className={styles.panel} aria-labelledby="frost-map-title">
        <header className={styles.heading}>
          <div>
            <span>Registros oficiais</span>
            <h2 id="frost-map-title">Ocorrências por estação</h2>
          </div>
          <small>Atualizado em {formatUpdatedAt(data.source.fetchedAt)}</small>
        </header>

        <div className={styles.filters}>
          <fieldset>
            <legend>Período consultado</legend>
            <div className={styles.periodNavigation}>
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={days === option ? styles.active : undefined}
                  aria-pressed={days === option}
                  onClick={() => setDays(option)}
                >
                  {option === 1 ? "1 dia" : `${option} dias`}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Tipo de estação</legend>
            <div className={styles.stationNavigation}>
              <button
                type="button"
                className={stationType === "CONVENCIONAL" ? styles.active : undefined}
                aria-pressed={stationType === "CONVENCIONAL"}
                onClick={() => setStationType("CONVENCIONAL")}
              >
                Convencional
              </button>
              <button
                type="button"
                className={stationType === "AUTOMATICA" ? styles.active : undefined}
                aria-pressed={stationType === "AUTOMATICA"}
                onClick={() => setStationType("AUTOMATICA")}
              >
                Automática
              </button>
            </div>
          </fieldset>
        </div>

        <div className={styles.mapShell} aria-busy={isRefreshing}>
          <div
            ref={mapContainerRef}
            className={styles.map}
            aria-label="Mapa de ocorrências de geada no Rio Grande do Sul"
          />
          <div className={styles.legend} aria-label="Legenda de intensidade da geada">
            <strong>Intensidade</strong>
            <span><i className={styles.strong} />Forte</span>
            <span><i className={styles.moderate} />Moderada</span>
            <span><i className={styles.weak} />Fraca</span>
            <span><i className={styles.possible} />Possível ocorrência</span>
            <span><i className={styles.undefined} />Indefinida</span>
          </div>
          <div
            className={`${styles.loading} ${isMapLoaded && !isRefreshing ? styles.hidden : ""}`}
            role="status"
          >
            <span aria-hidden="true" />
            <strong>
              {mapError
                ? "Mapa temporariamente indisponível"
                : isRefreshing
                  ? "Atualizando registros"
                  : "Carregando mapa de geadas"}
            </strong>
            <small>
              {mapError
                ? "A lista de ocorrências continua disponível abaixo."
                : "Os pontos serão agrupados conforme o nível de zoom."}
            </small>
          </div>
        </div>

        {data.message ? <p className={styles.message} role="status">{data.message}</p> : null}

        <div className={styles.summary} aria-label="Distribuição das ocorrências">
          <div><span>Forte</span><strong>{data.summary.strong}</strong></div>
          <div><span>Moderada</span><strong>{data.summary.moderate}</strong></div>
          <div><span>Fraca</span><strong>{data.summary.weak}</strong></div>
          <div><span>Possível</span><strong>{data.summary.possible}</strong></div>
        </div>
      </section>

      <section className={styles.listSection} aria-labelledby="frost-list-title">
        <header>
          <div>
            <span>Consulta acessível</span>
            <h2 id="frost-list-title">Registros mais recentes</h2>
          </div>
          <small>{formatDate(data.filters.startDate)} a {formatDate(data.filters.endDate)}</small>
        </header>

        {recentObservations.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Estação</th><th>Data</th><th>Temperatura mínima</th><th>Intensidade</th>
                </tr>
              </thead>
              <tbody>
                {recentObservations.map((observation) => (
                  <tr key={observation.id}>
                    <td>
                      <strong>{observation.stationName} / {observation.state}</strong>
                      <small>{observation.stationCode}</small>
                    </td>
                    <td>{formatDate(observation.date)}</td>
                    <td>{formatTemperature(observation.minimumTemperature)}</td>
                    <td>
                      <span className={`${styles.intensity} ${styles[observation.intensity]}`}>
                        {observation.intensityLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.empty}>Nenhuma ocorrência foi retornada para os filtros selecionados.</p>
        )}
      </section>

      <section className={styles.methodology}>
        <div>
          <span>Como interpretar</span>
          <h2>O mapa representa estações, não toda a área do município</h2>
          <p>
            A ausência de um ponto não comprova ausência de geada em locais sem estação. Microclimas
            rurais, baixadas e áreas de cultivo podem apresentar condições diferentes da estação mais próxima.
          </p>
        </div>
        <ul>
          <li>Convencionais: fraca a partir de 3 °C, moderada entre 1 °C e 3 °C e forte abaixo de 1 °C.</li>
          <li>Automáticas: o INMET apresenta o registro como possível ocorrência.</li>
          <li>Os dados são observacionais e não substituem previsão agrometeorológica ou orientação técnica.</li>
        </ul>
      </section>
    </main>
  );
}
