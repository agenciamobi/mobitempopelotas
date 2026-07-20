export function createPageHead(title: string, description: string) {
  const fullTitle = `${title} | Tempo Pelotas`;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  };
}
