import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchInmetFrostMap } from "./frost.server";
import type { FrostMapData } from "./frost.types";

export const getInmetFrostOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<FrostMapData> => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
        "CDN-Cache-Control": "max-age=1800, stale-while-revalidate=7200",
      }),
    );

    return fetchInmetFrostMap({ days: 30, stationType: "CONVENCIONAL", state: "RS" });
  },
);
