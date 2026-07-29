"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type { SaceGuaibaLayer, SaceGuaibaStation } from "@/lib/hydrology/sace-guaiba.server";

import styles from "./SaceGuaibaMap.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const STATIONS_SOURCE_ID = "sace-guaiba-stations";
const STATIONS_LAYER_ID = "sace-guaiba-stations-layer";
const DEFAULT_BOUNDS: [number, number, number, number] = [-54.8525, -31.5, -49, -27.759];

function stationCollection(stations: SaceGuaibaStation[]) {
  return {
    type: "FeatureCollection" as const,
    features: stations.map((station) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [station.longitude, station.latitude],
      },
      properties: {
        id: station.id,
        name: station.name,
        river: station.river,
        alertLabel: station.alertLabel,
        alertColor: station.alertColor,
        transmitting: station.transmitting,
      },
    })),
  };
}

function wmsTileUrl(layer: SaceGuaibaLayer) {
  const separator = layer.url.includes("?") ? "&" : "?";
  return `${layer.url}${separator}service=WMS&request=GetMap&version=${encodeURIComponent(layer.version)}&layers=${encodeURIComponent(layer.layerName)}&styles=&format=${encodeURIComponent(layer.format)}&transparent=${layer.transparent ? "true" : "false"}&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256`;
}

export function SaceGuaibaMap({
  stations,
  layers,
  bounds,
}: {
  stations: SaceGuaibaStation[];
  layers: SaceGuaibaLayer[];
  bounds: [number, number, number, number] | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const collection = useMemo(() => stationCollection(stations), [stations]);
  const initialCollectionRef = useRef(collection);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let styleLoaded = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;
        const viewBounds = bounds ?? DEFAULT_BOUNDS;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          bounds: [
            [viewBounds[0], viewBounds[1]],
            [viewBounds[2], viewBounds[3]],
          ],
          fitBoundsOptions: { padding: 34 },
          minZoom: 5,
          maxZoom: 13,
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

          layers.slice(0, 2).forEach((layer, index) => {
            const sourceId = `sace-wms-${index}`;
            const layerId = `${sourceId}-layer`;
            map.addSource(sourceId, {
              type: "raster",
              tiles: [wmsTileUrl(layer)],
              tileSize: 256,
              attribution: "Serviço Geológico do Brasil — SACE Guaíba",
            });
            map.addLayer({
              id: layerId,
              type: "raster",
              source: sourceId,
              paint: { "raster-opacity": index === 0 ? 0.22 : 0.5 },
            });
          });

          map.addSource(STATIONS_SOURCE_ID, {
            type: "geojson",
            data: initialCollectionRef.current,
          });
          map.addLayer({
            id: STATIONS_LAYER_ID,
            type: "circle",
            source: STATIONS_SOURCE_ID,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 9, 9, 13, 13],
              "circle-color": ["coalesce", ["get", "alertColor"], "#78909c"],
              "circle-opacity": 0.9,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });

          map.on("click", STATIONS_LAYER_ID, (event) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            const coordinates = feature.geometry.coordinates as [number, number];
            const properties = feature.properties as Record<string, unknown>;
            const name = typeof properties.name === "string" ? properties.name : "Estação SACE";
            const river = typeof properties.river === "string" ? properties.river : "Rio não informado";
            const alertLabel =
              typeof properties.alertLabel === "string" ? properties.alertLabel : "Situação não informada";
            new maplibregl.Popup({ closeButton: true, maxWidth: "290px" })
              .setLngLat(coordinates)
              .setText(`${name} · ${river} · ${alertLabel}`)
              .addTo(map);
          });
          map.on("mouseenter", STATIONS_LAYER_ID, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", STATIONS_LAYER_ID, () => {
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
  }, [bounds, layers]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const source = mapRef.current.getSource(STATIONS_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(collection);

    if (stations.length > 0) {
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
  }, [collection, loaded, stations]);

  return (
    <div className={styles.shell}>
      <div
        ref={containerRef}
        className={styles.map}
        aria-label="Mapa das estações públicas do SACE na bacia do Guaíba"
      />
      <div className={`${styles.loading}${loaded || failed ? ` ${styles.hidden}` : ""}`}>
        <span aria-hidden="true" />
        <strong>Carregando mapa da bacia do Guaíba</strong>
      </div>
      {failed ? (
        <div className={styles.fallback}>
          <strong>O mapa não pôde ser carregado</strong>
          <span>A lista e a situação oficial das estações continuam disponíveis abaixo.</span>
        </div>
      ) : null}
      <div className={styles.caption}>
        <strong>{stations.length} estações no filtro atual</strong>
        <span>Bacia, hidrografia e estações: SACE Guaíba / Serviço Geológico do Brasil.</span>
      </div>
    </div>
  );
}
