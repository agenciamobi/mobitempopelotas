import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { getForecastAccuracySummaryServer } from "./forecast-accuracy.server";

export const getForecastAccuracySummary = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "CDN-Cache-Control": "max-age=300, stale-while-revalidate=600",
    }),
  );

  return getForecastAccuracySummaryServer();
});
