import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchCppmetNews } from "./cppmet-news.server";

export const getCppmetNews = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
      "CDN-Cache-Control": "max-age=600, stale-while-revalidate=1800",
    }),
  );

  return fetchCppmetNews();
});
