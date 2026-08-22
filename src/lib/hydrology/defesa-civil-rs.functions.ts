import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchDefesaCivilHydroData } from "./defesa-civil-rs.server";

const HEALTHY_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
  "CDN-Cache-Control": "max-age=120, stale-while-revalidate=300",
};

const SHORT_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=20, must-revalidate",
  "CDN-Cache-Control": "max-age=20, must-revalidate",
};

const DISABLED_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, must-revalidate",
  "CDN-Cache-Control": "max-age=300, must-revalidate",
};

function isPublicDefesaCivilHydroEnabled() {
  return process.env.DEFESA_CIVIL_HYDRO_ENABLED?.trim().toLowerCase() !== "false";
}

export const getDefesaCivilHydroData = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchDefesaCivilHydroData({ enabled: isPublicDefesaCivilHydroEnabled() });

  const headers =
    data.status === "disabled"
      ? DISABLED_CACHE_HEADERS
      : data.status === "unavailable"
        ? SHORT_CACHE_HEADERS
        : HEALTHY_CACHE_HEADERS;

  setResponseHeaders(new Headers(headers));
  return data;
});
