import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const PELOTAS = { latitude: -31.7654, longitude: -52.3376 } as const;

const responseSchema = z.object({
  current: z.object({ time: z.string().min(1) }),
  hourly: z.object({
    time: z.array(z.string().min(1)).min(1),
    precipitation: z.array(z.number().finite().nullable()).min(1),
  }),
});

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
  "CDN-Cache-Control": "max-age=600, stale-while-revalidate=1800",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function forecastUrl() {
  const params = new URLSearchParams({
    latitude: String(PELOTAS.latitude),
    longitude: String(PELOTAS.longitude),
    timezone: "America/Sao_Paulo",
    forecast_days: "2",
    precipitation_unit: "mm",
    current: "temperature_2m",
    hourly: "precipitation",
  });
  return `${ENDPOINT}?${params.toString()}`;
}

function hourLabel(value: string, index: number) {
  if (index === 0) return "Agora";
  const time = value.split("T")[1];
  return time ? `${time.slice(0, 2)}h` : value;
}

async function fetchHourlyPrecipitation() {
  const response = await fetch(forecastUrl(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Open-Meteo respondeu com status ${response.status}`);

  const parsed = responseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Open-Meteo retornou uma série horária inválida");

  const foundIndex = parsed.data.hourly.time.findIndex(
    (time) => time >= parsed.data.current.time,
  );
  const startIndex = foundIndex === -1 ? 0 : foundIndex;
  const hours = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const index = startIndex + offset;
    const time = parsed.data.hourly.time[index];
    const precipitation = parsed.data.hourly.precipitation[index];
    if (!time || precipitation === undefined) continue;

    hours.push({
      time: hourLabel(time, offset),
      precipitationMm: precipitation === null ? null : Number(precipitation.toFixed(1)),
    });
  }

  return {
    status: "live" as const,
    source: "Open-Meteo",
    updatedAt: new Date().toISOString(),
    hours,
  };
}

export const Route = createFileRoute("/api/weather/hourly-precipitation")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const payload = await fetchHourlyPrecipitation();
          return new Response(JSON.stringify(payload), { headers: RESPONSE_HEADERS });
        } catch (error) {
          console.error("[weather/hourly-precipitation] Falha ao consultar volume horário", {
            message: error instanceof Error ? error.message : String(error),
          });
          return new Response(
            JSON.stringify({
              status: "unavailable",
              source: "Open-Meteo",
              updatedAt: new Date().toISOString(),
              hours: [],
            }),
            { headers: RESPONSE_HEADERS },
          );
        }
      },
    },
  },
});
