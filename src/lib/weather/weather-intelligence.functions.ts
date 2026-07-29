import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchWeatherIntelligence } from "./weather-intelligence.server";

export const getWeatherIntelligence = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=45, stale-while-revalidate=15",
      "CDN-Cache-Control": "max-age=45, stale-while-revalidate=15",
    }),
  );

  return fetchWeatherIntelligence();
});
