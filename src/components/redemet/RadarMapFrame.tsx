"use client";

import { useEffect, useRef, useState } from "react";
import type { ImageSource, Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";

import type { RedemetBounds, RedemetImageFrame } from "@/lib/redemet/redemet.types";

import styles from "./RadarMapFrame.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const RADAR_SOURCE_ID = "redemet-radar-image";
const RADAR_LAYER_ID = "redemet-radar-image-layer";
const PELOTAS_COORDINATES: [number, number] = [-52.3376, -31.7654];

type ImageCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

function imageCoordinates(bounds: RedemetBounds): ImageCoordinates {
  return [
    [bounds.west, bounds.north],
    [bounds.east, bounds.north],
    [bounds.east, bounds.south],
    [bounds.west, bounds.south],
  ];
}

function boundsKey(bounds: RedemetBounds) {
  return [bounds.west, bounds.south, bounds.east, bounds.north].join(":");
}

export function RadarMapFrame({
  frame,
  alt,
}: {
  frame: RedemetImageFrame;
  alt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const frameRef = useRef(frame);
  const boundsKeyRef = useRef(boundsKey(frame.bounds));
  const [mapLoaded, setMapLoaded] = useState(false);
  const [overlayLoaded, setOverlayLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  frameRef.current = frame;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let styleLoaded = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;

        const initialFrame = frameRef.current;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          bounds: [
            [initialFrame.bounds.west, initialFrame.bounds.south],
            [initialFrame.bounds.east, initialFrame.bounds.north],
          ],
          fitBoundsOptions: { padding: 28, maxZoom: 7.5 },
          minZoom: 3,
          maxZoom: 10,
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

          const currentFrame = frameRef.current;
          map.addSource(RADAR_SOURCE_ID, {
            type: "image",
            url: currentFrame.imageUrl,
            coordinates: imageCoordinates(currentFrame.bounds),
          });

          const firstSymbolLayer = map.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
          map.addLayer(
            {
              id: RADAR_LAYER_ID,
              type: "raster",
              source: RADAR_SOURCE_ID,
              paint: {
                "raster-opacity": 0.58,
                "raster-fade-duration": 0,
                "raster-contrast": 0.08,
              },
            },
            firstSymbolLayer,
          );

          const markerElement = document.createElement("div");
          markerElement.className = styles.pelotasMarker;
          const markerDot = document.createElement("i");
          markerDot.setAttribute("aria-hidden", "true");
          const markerLabel = document.createElement("span");
          markerLabel.textContent = "Pelotas";
          markerElement.append(markerDot, markerLabel);
          markerRef.current = new maplibregl.Marker({ element: markerElement, anchor: "left" })
            .setLngLat(PELOTAS_COORDINATES)
            .addTo(map);

          setMapLoaded(true);
          map.once("idle", () => {
            if (!cancelled) setOverlayLoaded(true);
          });
        });

        map.on("sourcedata", (event) => {
          if (event.sourceId === RADAR_SOURCE_ID && event.isSourceLoaded) {
            setOverlayLoaded(true);
          }
        });

        map.on("error", (event) => {
          const sourceId = (event as { sourceId?: string }).sourceId;
          if (!styleLoaded || sourceId === RADAR_SOURCE_ID) setFailed(true);
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || failed) return;

    const map = mapRef.current;
    const source = map.getSource(RADAR_SOURCE_ID) as ImageSource | undefined;
    if (!source) return;

    setOverlayLoaded(false);
    source.updateImage({
      url: frame.imageUrl,
      coordinates: imageCoordinates(frame.bounds),
    });
    map.once("idle", () => setOverlayLoaded(true));

    const nextBoundsKey = boundsKey(frame.bounds);
    if (nextBoundsKey !== boundsKeyRef.current) {
      boundsKeyRef.current = nextBoundsKey;
      map.fitBounds(
        [
          [frame.bounds.west, frame.bounds.south],
          [frame.bounds.east, frame.bounds.north],
        ],
        { padding: 28, maxZoom: 7.5, duration: 0 },
      );
    }
  }, [failed, frame, mapLoaded]);

  return (
    <div className={styles.shell} data-map-ready={mapLoaded && !failed}>
      {failed ? (
        <img className={styles.rawFallback} src={frame.imageUrl} alt={alt} decoding="async" />
      ) : null}
      <div
        ref={containerRef}
        className={`${styles.map}${failed ? ` ${styles.hidden}` : ""}`}
        role="img"
        aria-label={`${alt}. Radar georreferenciado sobre mapa regional, com Pelotas marcada.`}
      />

      {!failed && (!mapLoaded || !overlayLoaded) ? (
        <div className={styles.loading} aria-live="polite">
          <span aria-hidden="true" />
          <strong>Carregando radar sobre o mapa</strong>
        </div>
      ) : null}

      {failed ? (
        <div className={styles.fallbackNote} role="status">
          <strong>Base cartográfica indisponível</strong>
          <span>A imagem oficial do radar continua disponível.</span>
        </div>
      ) : (
        <div className={styles.caption}>
          <strong>Radar REDEMET sobre base cartográfica</strong>
          <span>Pelotas marcada para referência regional.</span>
        </div>
      )}
    </div>
  );
}
