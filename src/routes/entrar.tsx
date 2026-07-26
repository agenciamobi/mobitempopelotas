import { createFileRoute, redirect } from "@tanstack/react-router";

function validateSearch(search: Record<string, unknown>) {
  return {
    erro: typeof search.erro === "string" ? search.erro : undefined,
  };
}

export const Route = createFileRoute("/entrar")({
  validateSearch,
  beforeLoad: ({ search }) => {
    const target = new URL("https://tempo-pelotas.invalid/conta");
    if (search.erro) target.searchParams.set("erro", search.erro);

    throw redirect({
      href: `${target.pathname}${target.search}`,
      statusCode: 301,
      replace: true,
    });
  },
});
