import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchSaceGuaibaData } from "./sace-guaiba.server";

export const getSaceGuaibaData = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
    }),
  );

  return fetchSaceGuaibaData();
});
