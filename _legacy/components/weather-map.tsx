"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  RasterTileSource,
} from "maplibre-gl";
import type {
  RegionalWeather,
  WeatherIconName,
} from "@/lib/weather-data";
import {
  RADAR_ATTRIBUTION,
  RADAR_MAX_ZOOM,
  RADAR_MIN_ZOOM,
  SATELLITE_ATTRIBUTION,
  SATELLITE_TILE_URL,
  type RadarStatus,
} from "@/lib/weather-radar";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const PELOTAS_CENTER: [number, number] = [-52.3376, -31.7654];
const SATELLITE_SOURCE_ID = "regional-satellite-source";
const SATELLITE_LAYER_ID = "regional-satellite-layer";
const RADAR_SOURCE_ID = "regional-radar-source";
const RADAR_LAYER_ID = "regional-radar-layer";

type MapMode = "map" | "satellite" | "radar";

const conditionLabels: Record<WeatherIconName, string> = {
  sun: "Céu limpo",
  moon: "Noite de céu limpo",
  "partly-cloudy": "Sol entre nuvens",
  "partly-cloudy-night": "Noite parcialmente nublada",
  cloud: "Céu nublado",
  rain: "Chuva",
  storm: "Temporal",
  wind: "Vento",
};

type WeatherMapProps = {
  regionalWeather: RegionalWeather[];
};

function createMarkerElement(item: RegionalWeather) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "regional-map-marker";
  element.dataset.condition = item.condition;
  element.setAttribute(
    "aria-label",
    `${item.city}: ${item.temperature} graus, ${conditionLabels[item.condition]}`,
  );

  if (item.city === "Pelotas") {
    element.classList.add("is-active");
  }

  const temperature = document.createElement("strong");
  temperature.textContent = `${item.temperature}°`;

  const city = document.createElement("span");
  city.textContent = item.city;

  element.append(temperature, city);
  return element;
}

function createPopupContent(item: RegionalWeather) {
  const content = document.createElement("div");
  content.className = "regional-map-popup";

  const city = document.createElement("strong");
  city.textContent = item.city;

  const condition = document.createElement("span");
  condition.textContent = `${item.temperature}° · ${conditionLabels[item.condition]}`;

  content.append(city, condition);
  return content;
}

function radarTileTemplate(timestamp: number) {
  return `/api/weather/radar/tiles/${timestamp}/{z}/{x}/{y}`;
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6v12M16 6v12" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  );
}

export function WeatherMap({ regionalWeather }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const initializingRef = useRef(false);
  const baseLayerVisibilityRef = useRef<Record<string, "visible" | "none">>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [mode, setMode] = useState<MapMode>("map");
  const [radarStatus, setRadarStatus] = useState<RadarStatus | null>(null);
  const [radarStatusLoading, setRadarStatusLoading] = useState(false);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [radarPlaying, setRadarPlaying] = useState(false);
  const [radarOpacity, setRadarOpacity] = useState(76);

  const temperatureRange = useMemo(() => {
    const temperatures = regionalWeather.map((item) => item.temperature);

    return {
      min: temperatures.length ? Math.min(...temperatures) : 0,
      max: temperatures.length ? Math.max(...temperatures) : 0,
    };
  }, [regionalWeather]);

  const selectedRadarFrame = radarStatus?.frames[selectedFrameIndex];

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const initializeMap = async () => {
      if (mapRef.current || initializingRef.current || cancelled) return;
      initializingRef.current = true;

      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !mapContainerRef.current) return;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: PELOTAS_CENTER,
          zoom: 7.4,
          minZoom: 6,
          maxZoom: 13,
          cooperativeGestures: true,
        });

        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(
          new maplibregl.NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "bottom-right",
        );

        const bounds = new maplibregl.LngLatBounds();

        markersRef.current = regionalWeather.map((item) => {
          bounds.extend([item.longitude, item.latitude]);

          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 18,
          }).setDOMContent(createPopupContent(item));

          return new maplibregl.Marker({
            element: createMarkerElement(item),
            anchor: "bottom",
          })
            .setLngLat([item.longitude, item.latitude])
            .setPopup(popup)
            .addTo(map);
        });

        map.once("load", () => {
          if (cancelled) return;

          const styleLayers = map.getStyle().layers ?? [];
          baseLayerVisibilityRef.current = Object.fromEntries(
            styleLayers.map((layer) => [
              layer.id,
              map.getLayoutProperty(layer.id, "visibility") === "none"
                ? "none"
                : "visible",
            ]),
          );

          map.addSource(SATELLITE_SOURCE_ID, {
            type: "raster",
            tiles: [SATELLITE_TILE_URL],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 19,
            attribution: SATELLITE_ATTRIBUTION,
          });
          map.addLayer(
            {
              id: SATELLITE_LAYER_ID,
              type: "raster",
              source: SATELLITE_SOURCE_ID,
              layout: { visibility: "none" },
              paint: {
                "raster-opacity": 1,
                "raster-fade-duration": 120,
              },
            },
            styleLayers[0]?.id,
          );

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: { top: 125, right: 70, bottom: 100, left: 70 },
              maxZoom: 8.8,
              duration: 0,
            });
          }

          setIsLoaded(true);
        });
      } catch (error) {
        console.error("Falha ao inicializar o mapa regional:", error);
        if (!cancelled) setHasError(true);
      } finally {
        initializingRef.current = false;
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
        { rootMargin: "280px" },
      );
      observer.observe(container);
    } else {
      void initializeMap();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [regionalWeather]);

  useEffect(() => {
    if (!isLoaded || radarStatus || radarStatusLoading) return;

    let cancelled = false;
    setRadarStatusLoading(true);

    fetch("/api/weather/radar/status", {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Radar respondeu com status ${response.status}`);
        return (await response.json()) as RadarStatus;
      })
      .then((status) => {
        if (cancelled) return;
        setRadarStatus(status);
        setSelectedFrameIndex(status.currentIndex);
      })
      .catch((error) => {
        console.error("Falha ao consultar disponibilidade do radar:", error);
        if (!cancelled) {
          setRadarStatus({
            configured: false,
            available: false,
            provider: "OpenWeather",
            product: "Global Precipitation Map Forecast",
            frames: [],
            currentIndex: 0,
            updatedAt: new Date().toISOString(),
            error: "Não foi possível consultar o radar neste momento.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setRadarStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, radarStatus, radarStatusLoading]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const showSatellite = mode === "satellite";

    for (const [layerId, originalVisibility] of Object.entries(
      baseLayerVisibilityRef.current,
    )) {
      if (!map.getLayer(layerId)) continue;
      map.setLayoutProperty(
        layerId,
        "visibility",
        showSatellite ? "none" : originalVisibility,
      );
    }

    if (map.getLayer(SATELLITE_LAYER_ID)) {
      map.setLayoutProperty(
        SATELLITE_LAYER_ID,
        "visibility",
        showSatellite ? "visible" : "none",
      );
    }

    const shouldShowRadar =
      mode === "radar" &&
      Boolean(radarStatus?.available) &&
      Boolean(selectedRadarFrame);

    if (shouldShowRadar && selectedRadarFrame) {
      if (!map.getSource(RADAR_SOURCE_ID)) {
        map.addSource(RADAR_SOURCE_ID, {
          type: "raster",
          tiles: [radarTileTemplate(selectedRadarFrame.timestamp)],
          tileSize: 256,
          minzoom: RADAR_MIN_ZOOM,
          maxzoom: RADAR_MAX_ZOOM,
          attribution: RADAR_ATTRIBUTION,
        });
      }

      if (!map.getLayer(RADAR_LAYER_ID)) {
        const labelLayerId = (map.getStyle().layers ?? []).find(
          (layer) =>
            layer.type === "symbol" &&
            Object.prototype.hasOwnProperty.call(
              baseLayerVisibilityRef.current,
              layer.id,
            ),
        )?.id;

        map.addLayer(
          {
            id: RADAR_LAYER_ID,
            type: "raster",
            source: RADAR_SOURCE_ID,
            paint: {
              "raster-opacity": radarOpacity / 100,
              "raster-fade-duration": 0,
            },
          },
          labelLayerId,
        );
      }

      const radarSource = map.getSource(RADAR_SOURCE_ID) as
        | RasterTileSource
        | undefined;
      radarSource?.setTiles([radarTileTemplate(selectedRadarFrame.timestamp)]);
      map.setLayoutProperty(RADAR_LAYER_ID, "visibility", "visible");
      map.setPaintProperty(RADAR_LAYER_ID, "raster-opacity", radarOpacity / 100);
    } else if (map.getLayer(RADAR_LAYER_ID)) {
      map.setLayoutProperty(RADAR_LAYER_ID, "visibility", "none");
    }
  }, [isLoaded, mode, radarOpacity, radarStatus, selectedRadarFrame]);

  useEffect(() => {
    if (
      !radarPlaying ||
      mode !== "radar" ||
      !radarStatus?.available ||
      radarStatus.frames.length < 2
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setSelectedFrameIndex((current) =>
        current >= radarStatus.frames.length - 1 ? 0 : current + 1,
      );
    }, 900);

    return () => window.clearInterval(interval);
  }, [mode, radarPlaying, radarStatus]);

  const centerOnPelotas = () => {
    mapRef.current?.easeTo({
      center: PELOTAS_CENTER,
      zoom: 9.3,
      duration: 700,
    });
  };

  const selectMode = (nextMode: MapMode) => {
    if (nextMode === "radar" && !radarStatus?.available) return;
    setMode(nextMode);

    if (nextMode !== "radar") {
      setRadarPlaying(false);
    } else if (radarStatus) {
      setSelectedFrameIndex(radarStatus.currentIndex);
    }
  };

  const radarButtonTitle = radarStatusLoading
    ? "Verificando se o radar está disponível"
    : radarStatus?.error ?? "Mostrar a chuva no mapa";

  return (
    <section className="map-panel" id="regiao" aria-labelledby="map-title">
      <div className="map-panel-heading">
        <div>
          <span className="eyebrow">Pelotas e Zona Sul</span>
          <h2 id="map-title">Tempo na região</h2>
        </div>
        <button
          className="map-control"
          type="button"
          aria-label="Voltar o mapa para Pelotas"
          onClick={centerOnPelotas}
          disabled={!isLoaded}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 3h-2.07A7 7 0 0 0 13 5.07V3h-2v2.07A7 7 0 0 0 5.07 11H3v2h2.07A7 7 0 0 0 11 18.93V21h2v-2.07A7 7 0 0 0 18.93 13H21v-2Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div
        className={`map-canvas map-canvas--interactive map-canvas--${mode}`}
        aria-label="Mapa com o tempo em Pelotas e cidades da Zona Sul"
      >
        <div ref={mapContainerRef} className="regional-map-engine" />

        <div className="map-layer-switcher" aria-label="Escolha como deseja ver o mapa">
          <button
            type="button"
            className={mode === "map" ? "is-active" : undefined}
            aria-pressed={mode === "map"}
            onClick={() => selectMode("map")}
            disabled={!isLoaded}
          >
            Mapa
          </button>
          <button
            type="button"
            className={mode === "satellite" ? "is-active" : undefined}
            aria-pressed={mode === "satellite"}
            onClick={() => selectMode("satellite")}
            disabled={!isLoaded}
          >
            Satélite
          </button>
          <button
            type="button"
            className={mode === "radar" ? "is-active" : undefined}
            aria-pressed={mode === "radar"}
            onClick={() => selectMode("radar")}
            disabled={!isLoaded || radarStatusLoading || !radarStatus?.available}
            title={radarButtonTitle}
          >
            Chuva
          </button>
        </div>

        {isLoaded && radarStatus && !radarStatus.available ? (
          <div className="map-radar-unavailable" role="status">
            <strong>Mapa de chuva indisponível</strong>
            <span>{radarStatus.error}</span>
          </div>
        ) : null}

        <div
          className={`map-loading ${isLoaded ? "is-hidden" : ""} ${hasError ? "has-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />
          <strong>{hasError ? "Mapa temporariamente indisponível" : "Carregando mapa da região"}</strong>
          <small>
            {hasError
              ? "As temperaturas continuam disponíveis ao lado."
              : "O mapa aparecerá em alguns instantes."}
          </small>
        </div>

        {mode === "radar" && radarStatus?.available && selectedRadarFrame ? (
          <div className="radar-player" aria-label="Movimento da chuva no mapa">
            <div className="radar-player-topline">
              <button
                className="radar-play-button"
                type="button"
                onClick={() => setRadarPlaying((playing) => !playing)}
                aria-label={radarPlaying ? "Pausar movimento da chuva" : "Mostrar movimento da chuva"}
              >
                <PlayIcon playing={radarPlaying} />
              </button>
              <div className="radar-frame-status" aria-live="polite">
                <span>{selectedRadarFrame.kind === "forecast" ? "Previsão" : "Registrado"}</span>
                <strong>{selectedRadarFrame.label}</strong>
              </div>
              <label className="radar-opacity-control">
                <span>Deixar a chuva mais clara</span>
                <input
                  type="range"
                  min="35"
                  max="100"
                  step="5"
                  value={radarOpacity}
                  onChange={(event) => setRadarOpacity(Number(event.target.value))}
                />
              </label>
            </div>

            <input
              className="radar-timeline"
              type="range"
              min="0"
              max={radarStatus.frames.length - 1}
              step="1"
              value={selectedFrameIndex}
              aria-label="Escolher o horário da chuva no mapa"
              onChange={(event) => {
                setRadarPlaying(false);
                setSelectedFrameIndex(Number(event.target.value));
              }}
            />

            <div className="radar-time-range" aria-hidden="true">
              <span>{radarStatus.frames[0]?.label}</span>
              <span>Agora</span>
              <span>{radarStatus.frames.at(-1)?.label}</span>
            </div>

            <div className="radar-intensity-legend">
              <span>Chuva fraca</span>
              <i aria-hidden="true" />
              <span>Chuva forte</span>
            </div>
            <small className="radar-provider-note">
              Chuva mostrada pelo OpenWeather · última hora e próximas 2 horas
            </small>
          </div>
        ) : (
          <div className="map-legend" aria-label="Temperaturas mostradas no mapa">
            <span>{temperatureRange.min}°</span>
            <i aria-hidden="true" />
            <span>{temperatureRange.max}°</span>
          </div>
        )}
      </div>

      <ul className="regional-weather-accessible">
        {regionalWeather.map((item) => (
          <li key={item.city}>
            {item.city}: {item.temperature} graus, {conditionLabels[item.condition]}.
          </li>
        ))}
      </ul>
    </section>
  );
}
