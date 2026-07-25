"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { DailyForecast } from "@/production/lib/weather-data";

export function HeroDailyRangePortal({ day }: { day: DailyForecast | null }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.querySelector<HTMLElement>(
      ".weather-hero-daily-facts > div:first-child",
    );
    if (!element) return;

    element.classList.add("has-canonical-daily-range");
    setTarget(element);

    return () => {
      element.classList.remove("has-canonical-daily-range");
    };
  }, []);

  if (!day || !target) return null;

  return createPortal(
    <>
      <dt className="weather-hero-canonical-range-label">Mín. e máx. previstas</dt>
      <dd className="weather-hero-canonical-range-value">
        {day.min}° <small>/ {day.max}°</small>
      </dd>
    </>,
    target,
  );
}
