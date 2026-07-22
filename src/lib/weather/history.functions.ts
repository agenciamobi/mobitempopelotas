import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchPelotasWeatherHistory } from "./history.server";

export const getPelotasWeatherHistory = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=21600, stale-while-revalidate=21600",
      "CDN-Cache-Control": "max-age=21600, stale-while-revalidate=21600",
    }),
  );

  return fetchPelotasWeatherHistory();
});
