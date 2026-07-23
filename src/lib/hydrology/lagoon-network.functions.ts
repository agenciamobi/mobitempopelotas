import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchLagoonMonitoringNetwork } from "./lagoon-network.server";

export const getLagoonMonitoringNetwork = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
      "CDN-Cache-Control": "max-age=120, stale-while-revalidate=300",
    }),
  );

  return fetchLagoonMonitoringNetwork();
});
