import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { getEmbrapaHistory24hServer } from "./embrapa-history.server";

export const getEmbrapaHistory24h = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=45, stale-while-revalidate=15",
      "CDN-Cache-Control": "max-age=45, stale-while-revalidate=15",
    }),
  );

  return getEmbrapaHistory24hServer();
});
