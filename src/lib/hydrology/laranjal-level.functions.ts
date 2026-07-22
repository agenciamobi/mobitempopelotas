import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchLaranjalLevelData } from "./laranjal-level.server";

export const getLaranjalLevelData = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
      "CDN-Cache-Control": "max-age=60, stale-while-revalidate=240",
    }),
  );

  return fetchLaranjalLevelData();
});
