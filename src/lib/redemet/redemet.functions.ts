import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { withRedemetLastGood } from "./redemet-last-good.server";
import {
  fetchRedemetRadar,
  fetchRedemetSatellite,
  fetchRedemetStorms,
} from "./redemet.server";
import type { RedemetOverview } from "./redemet.types";

export const getRedemetOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<RedemetOverview> => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "CDN-Cache-Control": "max-age=120, stale-while-revalidate=600",
      }),
    );

    const [radar, satellite, storms] = await Promise.all([
      withRedemetLastGood("radar:10", () => fetchRedemetRadar(10)),
      withRedemetLastGood("satellite:realcada:10", () => fetchRedemetSatellite("realcada", 10)),
      withRedemetLastGood("storms:20", () => fetchRedemetStorms(20)),
    ]);

    return { radar, satellite, storms };
  },
);
