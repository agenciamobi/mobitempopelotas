"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { AstronomyData } from "@/production/lib/weather-data";

type AstronomyIconName = "sunrise" | "sunset" | "moon" | "season";

function AstronomyIcon({ name }: { name: AstronomyIconName }) {
  if (name === "moon") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.4 15.4A7.6 7.6 0 0 1 8.6 5.6 7.7 7.7 0 1 0 18.4 15.4Z" />
      </svg>
    );
  }

  if (name === "season") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.5 4.5C12.8 4.7 7.2 7.2 5.2 12.2c-1.1 2.8.1 5.7 2.8 6.7 2.5.9 5.2-.2 6.5-2.6 1.7-3.1 2.5-7.1 5-11.8Z" />
        <path d="M6.5 18.5c2.5-3.5 5.4-6.1 9-8" />
      </svg>
    );
  }

  const isSunrise = name === "sunrise";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18h16" />
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M12 4v3M5.6 7.6l2.1 2.1M18.4 7.6l-2.1 2.1" />
      {isSunrise ? <path d="m9.5 13 2.5-2.5 2.5 2.5" /> : <path d="m9.5 11 2.5 2.5 2.5-2.5" />}
    </svg>
  );
}

function AstronomyItem({
  icon,
  label,
  value,
}: {
  icon: AstronomyIconName;
  label: string;
  value: string;
}) {
  return (
    <div className="weather-hero-astronomy-item">
      <AstronomyIcon name={icon} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function HeroAstronomyPortal({ astronomy }: { astronomy?: AstronomyData }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>(".weather-hero-now"));
  }, []);

  const items = useMemo(
    () =>
      [
        astronomy?.sunrise
          ? { icon: "sunrise" as const, label: "Nascer do sol", value: astronomy.sunrise }
          : null,
        astronomy?.sunset
          ? { icon: "sunset" as const, label: "Pôr do sol", value: astronomy.sunset }
          : null,
        astronomy?.moonPhase
          ? { icon: "moon" as const, label: "Lua", value: astronomy.moonPhase }
          : null,
        astronomy?.season
          ? { icon: "season" as const, label: "Estação", value: astronomy.season }
          : null,
      ].filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [astronomy],
  );

  if (!target || items.length === 0) return null;

  const solarLabel = astronomy?.solarSource
    ? `Horários solares${astronomy.season ? " e estação" : ""}: ${astronomy.solarSource}`
    : null;
  const lunarLabel = astronomy?.lunarSource ? `Lua: ${astronomy.lunarSource}` : null;

  return createPortal(
    <section className="weather-hero-astronomy" aria-label="Informações astronômicas de Pelotas">
      <div className="weather-hero-astronomy-grid" data-items={items.length}>
        {items.map((item) => (
          <AstronomyItem key={item.label} {...item} />
        ))}
      </div>
      {solarLabel || lunarLabel ? (
        <small className="weather-hero-astronomy-source">
          {[solarLabel, lunarLabel].filter(Boolean).join(" · ")}
        </small>
      ) : null}
    </section>,
    target,
  );
}
