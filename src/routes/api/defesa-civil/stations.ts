import { createFileRoute } from "@tanstack/react-router";

import { fetchDefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.server";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
  "CDN-Cache-Control": "max-age=120, stale-while-revalidate=300",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export const Route = createFileRoute("/api/defesa-civil/stations")({
  server: {
    handlers: {
      GET: async () => {
        const data = await fetchDefesaCivilHydroData();
        const payload = {
          status: data.status,
          fetchedAt: data.source.fetchedAt,
          statewideStationCount: data.statewideStationCount,
          regionalStationCount: data.regionalStationCount,
          recentStationCount: data.recentStationCount,
          latestObservationAt: data.latestObservationAt,
          inventory: data.inventory,
          source: {
            name: data.source.name,
            mapUrl: data.source.mapUrl,
            documentationUrl: data.source.documentationUrl,
          },
          stations: data.stations.map((station) => ({
            code: station.code,
            name: station.name,
            basin: station.basin,
            region: station.region,
            latitude: station.latitude,
            longitude: station.longitude,
            distanceFromPelotasKm: station.distanceFromPelotasKm,
            observedAt: station.observedAt,
            freshness: station.freshness,
            classification: station.classification,
            capabilities: station.capabilities,
            river: {
              name: station.river.name,
              levelM: station.river.levelM,
              trend: station.river.trend,
            },
            rain: {
              h1Mm: station.rain.h1Mm,
              h3Mm: station.rain.h3Mm,
              h6Mm: station.rain.h6Mm,
              h12Mm: station.rain.h12Mm,
              h24Mm: station.rain.h24Mm,
              h48Mm: station.rain.h48Mm,
              h72Mm: station.rain.h72Mm,
              h96Mm: station.rain.h96Mm,
              h120Mm: station.rain.h120Mm,
              h144Mm: station.rain.h144Mm,
              h168Mm: station.rain.h168Mm,
            },
            weather: station.weather,
          })),
          error: data.error,
        };

        return new Response(JSON.stringify(payload), { headers: RESPONSE_HEADERS });
      },
    },
  },
});
