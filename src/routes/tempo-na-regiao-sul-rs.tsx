import { createFileRoute } from "@tanstack/react-router";

import { RegionalCitiesDirectory } from "@/components/regional/RegionalCitiesDirectory";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Previsão do tempo por cidade na Zona Sul do RS";
const PAGE_DESCRIPTION =
  "Central de consulta meteorológica para Pelotas, Costa Doce, Fronteira Sul e Campanha, com páginas locais de previsão e avisos do INMET.";
const PAGE_PATH = "/tempo-na-regiao-sul-rs";
const SOUTHERN_RS_LOCATION = {
  "@type": "Place",
  name: "Zona Sul do Rio Grande do Sul, Brasil",
  containedInPlace: {
    "@type": "AdministrativeArea",
    name: "Rio Grande do Sul, Brasil",
  },
};

export const Route = createFileRoute("/tempo-na-regiao-sul-rs")({
  head: () =>
    createPageHead(
      PAGE_TITLE,
      PAGE_DESCRIPTION,
      PAGE_PATH,
      [
        createEditorialPageJsonLd({
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          path: PAGE_PATH,
          breadcrumbs: [
            { name: "Início", path: "/" },
            { name: "Tempo na região", path: PAGE_PATH },
          ],
          about: ["Previsão do tempo na Zona Sul do Rio Grande do Sul", "Meteorologia regional"],
          location: SOUTHERN_RS_LOCATION,
        }),
      ],
      { geo: null },
    ),
  component: RegionalCitiesDirectory,
});
