import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchLaranjalLevel } from "./laranjal.server";

export const getLaranjalLevel = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      "CDN-Cache-Control": "max-age=30, stale-while-revalidate=120",
    }),
  );

  return fetchLaranjalLevel();
});
