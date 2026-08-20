"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type { DefesaCivilHydroStation } from "@/lib/hydrology/defesa-civil-rs.server";

import styles from "./DefesaCivilHydroMap.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const SOURCE_ID = "defesa-civil-rs-stations";
const LAYER_ID = "defesa-civil-rs-stations-layer";
const DEFAULT_BOUNDS: [number, number, number, number] = [-55.5, -34.2, -49.8, -28.8];

function collection(stations: DefesaCivilHydroStation[]) {
  return {
    type: "FeatureCollection" as const,
    features: stations.map((station) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [station.longitude, station.latitude],
      },
      properties: {
        code: station.code,
        name: station.name,
        basin: station.basin ?? "Bacia não informada",
        riverName: station.river.name ?? "Rio não informado",
        freshness: station.freshness,
      },
    })),
  };
}

export function DefesaCivilHydroMap({ stations }: { stations: DefesaCivilHydroStation[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const stationCollection = useMemo(() => collection(stations), [stations]);
  const initialCollectionRef = useRef(stationCollection);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let styleLoaded = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          bounds: [
            [DEFAULT_BOUNDS[0], DEFAULT_BOUNDS[1]],
            [DEFAULT_BOUNDS[2], DEFAULT_BOUNDS[3]],
          ],
          fitBoundsOptions: { padding: 34 },
          minZoom: 5,
          maxZoom: 14,
          cooperativeGestures: true,
          attributionControl: {},
        });
        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

        map.once("load", () => {
          if (cancelled) return;
          styleLoaded = true;

          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: initialCollectionRef.current,
            attribution: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
          });
          map.addLayer({
            id: LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 9, 8, 13, 11],
              "circle-color": [
                "match",
                ["get", "freshness"],
                "recent",
                "#17bdcc",
                "delayed",
                "#f26f35",
                "old",
                "#94a3b8",
                "#64748b",
              ],
              "circle-opacity": 0.92,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });

          map.on("click", LAYER_ID, (event) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            const coordinates = feature.geometry.coordinates as [number, number];
            const properties = feature.properties as Record<string, unknown>;
            const name = typeof properties.name === "string" ? properties.name : "Estação";
            const code = typeof properties.code === "string" ? properties.code : "Código não informado";
            const basin = typeof properties.basin === "string" ? properties.basin : "Bacia não informada";

            new maplibregl.Popup({ closeButton: true, maxWidth: "310px" })
              .setLngLat(coordinates)
              .setText(`${name} · ${code} · ${basin}`)
              .addTo(map);
          });
          map.on("mouseenter", LAYER_ID, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", LAYER_ID, () => {
            map.getCanvas().style.cursor = "";
          });

          setLoaded(true);
        });
        map.on("error", () => {
          if (!styleLoaded) setFailed(true);
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const source = mapRef.current.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(stationCollection);

    if (stations.length === 1) {
      const station = stations[0];
      mapRef.current.easeTo({
        center: [station.longitude, station.latitude],
        zoom: 9,
        duration: 450,
      });
      return;
    }

    if (stations.length > 1) {
      const longitudes = stations.map((station) => station.longitude);
      const latitudes = stations.map((station) => station.latitude);
      mapRef.current.fitBounds(
        [
          [Math.min(...longitudes), Math.min(...latitudes)],
          [Math.max(...longitudes), Math.max(...latitudes)],
        ],
        { padding: 44, maxZoom: 9.5, duration: 450 },
      );
    }
  }, [loaded, stationCollection, stations]);

  return (
    <div className={styles.shell}>
      <div
        ref={containerRef}
        className={styles.map}
        aria-label="Mapa das estações da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS próximas à Zona Sul"
      />
      <div className={`${styles.loading}${loaded || failed ? ` ${styles.hidden}` : ""}`}>
        <span aria-hidden="true" />
        <strong>Carregando estações da Defesa Civil RS</strong>
      </div>
      {failed ? (
        <div className={styles.fallback}>
          <strong>O mapa não pôde ser carregado</strong>
          <span>As leituras e a identificação das estações continuam disponíveis na lista.</span>
        </div>
      ) : null}
      <div className={styles.caption}>
        <strong>{stations.length} estações no recorte regional</strong>
        <span>Pontos e medições: Defesa Civil do Estado do Rio Grande do Sul.</span>
      </div>
    </div>
  );
}
