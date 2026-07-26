import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { fetchRegionalCityWeather } from "./regional-city-weather.server";

export const getRegionalCityWeather = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
        "CDN-Cache-Control": "max-age=600, stale-while-revalidate=1800",
      }),
    );
    return fetchRegionalCityWeather(data.slug);
  });
