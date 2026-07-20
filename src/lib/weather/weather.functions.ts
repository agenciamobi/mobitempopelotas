import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchPelotasWeather } from "./open-meteo.server";

export const getPelotasWeather = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders({
    "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
  });

  return fetchPelotasWeather();
});
