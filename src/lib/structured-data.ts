import { absoluteUrl, WEBSITE_JSON_LD_ID } from "./site-config";

export type BreadcrumbJsonLdItem = {
  name: string;
  path: string;
};

export type EditorialPageJsonLdOptions = {
  name: string;
  description: string;
  path: string;
  breadcrumbs: readonly BreadcrumbJsonLdItem[];
  about?: string | readonly string[];
};

export type DatasetVariable = {
  name: string;
  unitText?: string;
  description?: string;
};

export type DatasetJsonLdOptions = {
  name: string;
  description: string;
  path: string;
  sourceUrl: string;
  dateModified: string;
  spatialCoverage: string | Record<string, unknown>;
  temporalCoverage?: string | null;
  creator?: {
    name: string;
    url?: string;
  };
  variables?: readonly DatasetVariable[];
};

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function breadcrumbItems(items: readonly BreadcrumbJsonLdItem[]) {
  return items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  }));
}

export function createBreadcrumbListJsonLd(items: readonly BreadcrumbJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems(items),
  };
}

export function createEditorialPageJsonLd(options: EditorialPageJsonLdOptions) {
  const pageUrl = absoluteUrl(options.path);
  const pageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const about = Array.isArray(options.about) ? options.about : options.about ? [options.about] : [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageId,
        name: options.name,
        description: options.description,
        url: pageUrl,
        isPartOf: { "@id": WEBSITE_JSON_LD_ID },
        inLanguage: "pt-BR",
        breadcrumb: { "@id": breadcrumbId },
        ...(about.length > 0
          ? {
              about: about.map((name) => ({
                "@type": "Thing",
                name,
              })),
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: breadcrumbItems(options.breadcrumbs),
      },
    ],
  };
}

export function createDatasetJsonLd(options: DatasetJsonLdOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    spatialCoverage: options.spatialCoverage,
    ...(options.temporalCoverage ? { temporalCoverage: options.temporalCoverage } : {}),
    dateModified: options.dateModified,
    isBasedOn: options.sourceUrl,
    sameAs: options.sourceUrl,
    isAccessibleForFree: true,
    inLanguage: "pt-BR",
    ...(options.creator
      ? {
          creator: {
            "@type": "Organization",
            name: options.creator.name,
            ...(options.creator.url ? { url: options.creator.url } : {}),
          },
        }
      : {}),
    ...(options.variables && options.variables.length > 0
      ? {
          variableMeasured: options.variables.map((variable) => ({
            "@type": "PropertyValue",
            name: variable.name,
            ...(variable.unitText ? { unitText: variable.unitText } : {}),
            ...(variable.description ? { description: variable.description } : {}),
          })),
        }
      : {}),
  };
}

export function createStructuredDataScripts(documents: readonly unknown[]) {
  return documents.map((document) => ({
    type: "application/ld+json",
    children: serializeJsonLd(document),
  }));
}
