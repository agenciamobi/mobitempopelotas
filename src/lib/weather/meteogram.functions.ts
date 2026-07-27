import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchPelotasMeteogram } from "./meteogram.server";

export const getPelotasMeteogram = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
    }),
  );

  return fetchPelotasMeteogram();
});
