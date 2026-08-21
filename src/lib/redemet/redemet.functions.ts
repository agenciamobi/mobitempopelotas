import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchInmetSatellite } from "@/lib/weather/inmet-satellite.server";
import { withRedemetLastGood } from "./redemet-last-good.server";
import { fetchRedemetRadarResilient } from "./redemet-radar.server";
import { fetchRedemetSatellite } from "./redemet.server";
import { fetchRedemetStorms } from "./redemet-stsc.server";
import type { RedemetOverview } from "./redemet.types";

const IMAGE_FRAME_WINDOW = 8;
const STORM_FRAME_WINDOW = 12;

export const getRedemetOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<RedemetOverview> => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "CDN-Cache-Control": "max-age=120, stale-while-revalidate=600",
      }),
    );

    const [radar, satellite, inmetSatellite, storms] = await Promise.all([
      withRedemetLastGood(`radar:${IMAGE_FRAME_WINDOW}`, () =>
        fetchRedemetRadarResilient(IMAGE_FRAME_WINDOW),
      ),
      withRedemetLastGood(`satellite:realcada:${IMAGE_FRAME_WINDOW}`, () =>
        fetchRedemetSatellite("realcada", IMAGE_FRAME_WINDOW),
      ),
      withRedemetLastGood(`satellite:inmet:goes:s:iv:${IMAGE_FRAME_WINDOW}`, () =>
        fetchInmetSatellite(IMAGE_FRAME_WINDOW),
      ),
      withRedemetLastGood(`storms:${STORM_FRAME_WINDOW}`, () =>
        fetchRedemetStorms(STORM_FRAME_WINDOW),
      ),
    ]);

    return { radar, satellite, inmetSatellite, storms };
  },
);
