import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/minha-conta")({
  beforeLoad: () => {
    throw redirect({
      href: "/conta",
      statusCode: 301,
      replace: true,
    });
  },
});
