import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/clima-em-pelotas")({
  beforeLoad: () => {
    throw redirect({
      to: "/historico-climatico-pelotas",
      statusCode: 301,
      replace: true,
    });
  },
});
