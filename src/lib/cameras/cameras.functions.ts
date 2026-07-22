import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchWeatherCameras } from "./cameras.server";

export const getWeatherCameras = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=180, stale-while-revalidate=300",
      "CDN-Cache-Control": "max-age=180, stale-while-revalidate=300",
    }),
  );

  return fetchWeatherCameras();
});
