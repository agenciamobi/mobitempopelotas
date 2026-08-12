import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchSaceGuaibaData } from "./sace-guaiba.server";

const HEALTHY_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
  "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
};

const UNAVAILABLE_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=20, must-revalidate",
  "CDN-Cache-Control": "max-age=20, must-revalidate",
};

export const getSaceGuaibaData = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchSaceGuaibaData();

  setResponseHeaders(
    new Headers(data.status === "unavailable" ? UNAVAILABLE_CACHE_HEADERS : HEALTHY_CACHE_HEADERS),
  );

  return data;
});
