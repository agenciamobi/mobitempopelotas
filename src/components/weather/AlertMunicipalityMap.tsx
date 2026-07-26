"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { InmetAlert } from "@/lib/weather/official-sources.types";

import styles from "./AlertMunicipalityMap.module.css";

const PELOTAS: [number, number] = [-52.3376, -31.7654];
const SOURCE_ID = "featured-alert-city";
const LAYER_ID = "featured-alert-city-layer";
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function AlertMunicipalityMap({ alert }: { alert: InmetAlert }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: PELOTAS,
          zoom: 7.2,
          minZoom: 5,
          maxZoom: 12,
          cooperativeGestures: true,
          attributionControl: true,
        });
        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        map.once("load", () => {
          if (cancelled) return;
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: { name: "Pelotas" },
                  geometry: { type: "Point", coordinates: PELOTAS },
                },
              ],
            },
          });
          map.addLayer({
            id: LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 12, 9, 22],
              "circle-color":
                alert.severity === "great-danger"
                  ? "#b91c1c"
                  : alert.severity === "danger"
                    ? "#f27035"
                    : "#eab308",
              "circle-opacity": 0.32,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 3,
            },
          });
          setLoaded(true);
        });
        map.on("error", () => setFailed(true));
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [alert.severity]);

  return (
    <div className={styles.shell}>
      <div ref={containerRef} className={styles.map} aria-label="Mapa com a localização de Pelotas no aviso" />
      <div className={`${styles.loading}${loaded || failed ? ` ${styles.hidden}` : ""}`}>
        <span aria-hidden="true" />
        <strong>Carregando mapa do aviso</strong>
      </div>
      {failed ? (
        <div className={styles.fallback}>
          <strong>Pelotas está incluída no aviso</strong>
          <span>O mapa não pôde ser carregado, mas os dados municipais continuam disponíveis.</span>
        </div>
      ) : null}
      <div className={styles.caption}>
        <strong>Pelotas incluída</strong>
        <span>
          {alert.areas[0] || alert.municipalities[0] || "Abrangência municipal informada pelo INMET"}
        </span>
      </div>
    </div>
  );
}
