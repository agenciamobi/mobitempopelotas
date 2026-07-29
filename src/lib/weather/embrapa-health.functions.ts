import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { getEmbrapaHealthSnapshotServer } from "./embrapa-health.server";

export const getEmbrapaHealthSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=15, stale-while-revalidate=45",
      "CDN-Cache-Control": "max-age=15, stale-while-revalidate=45",
    }),
  );

  return getEmbrapaHealthSnapshotServer();
});
