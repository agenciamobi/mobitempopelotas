import { createFileRoute } from "@tanstack/react-router";

import { CppmetNewsPage } from "@/components/blog/CppmetNewsPage";
import { getCppmetNews } from "@/lib/content/cppmet-news.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Notícias meteorológicas de Pelotas — CPPMet / UFPel";
const PAGE_DESCRIPTION =
  "Acompanhe no Tempo Pelotas as publicações meteorológicas do CPPMet/UFPel, com atualização via feed RSS e links para o conteúdo original da universidade.";
const PAGE_PATH = "/blog";
const CPPMET_RSS_URL = "https://wp.ufpel.edu.br/cppmet/feed/";

export const Route = createFileRoute("/blog")({
  head: () => {
    const head = createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Notícias meteorológicas", path: PAGE_PATH },
        ],
        about: [
          "CPPMet / UFPel",
          "Centro de Pesquisas e Previsões Meteorológicas",
          "Notícias meteorológicas de Pelotas",
          "Meteorologia no sul do Rio Grande do Sul",
          "Universidade Federal de Pelotas",
        ],
      }),
    ]);

    return {
      ...head,
      links: [
        ...head.links,
        {
          rel: "alternate",
          type: "application/rss+xml",
          href: CPPMET_RSS_URL,
          title: "CPPMet / UFPel — RSS",
        },
      ],
    };
  },
  loader: async () => getCppmetNews(),
  staleTime: 10 * 60 * 1_000,
  component: BlogPage,
});

function BlogPage() {
  const feed = Route.useLoaderData();
  return <CppmetNewsPage feed={feed} />;
}
