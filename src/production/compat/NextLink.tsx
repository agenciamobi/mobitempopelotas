import type { AnchorHTMLAttributes, ReactNode } from "react";

type LegacyHref = string | { pathname?: string; query?: Record<string, unknown>; hash?: string };

type LegacyLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: LegacyHref;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

function resolveHref(href: LegacyHref) {
  if (typeof href === "string") return href;
  const pathname = href.pathname ?? "/";
  const search = href.query
    ? `?${new URLSearchParams(Object.entries(href.query).map(([key, value]) => [key, String(value)])).toString()}`
    : "";
  const hash = href.hash ? `#${href.hash.replace(/^#/, "")}` : "";
  return `${pathname}${search}${hash}`;
}

export default function NextLink({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  ...props
}: LegacyLinkProps) {
  return <a href={resolveHref(href)} {...props} />;
}
