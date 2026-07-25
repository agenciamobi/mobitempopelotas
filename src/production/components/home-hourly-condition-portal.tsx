import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import type { WeatherData } from "@/production/lib/weather-data";

type HourlyForecast = WeatherData["hourly"][number];

function accessibleHourLabel(hour: HourlyForecast, condition: string) {
  const rain =
    hour.precipitation === null
      ? "probabilidade de chuva não informada"
      : `${hour.precipitation}% de chance de chuva`;
  const gust =
    hour.windGust === null
      ? "rajada não informada"
      : `rajadas de até ${hour.windGust} quilômetros por hora`;

  return `${hour.time}: ${condition.toLocaleLowerCase("pt-BR")}, ${hour.temperature} graus, ${rain} e ${gust}.`;
}

export function HomeHourlyConditionPortal({ hours }: { hours: WeatherData["hourly"] }) {
  const displayedHours = useMemo(() => hours.slice(0, 7), [hours]);
  const [targets, setTargets] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const nextTargets = Array.from(
      document.querySelectorAll<HTMLElement>(".home-hourly-story__topline"),
    ).slice(0, displayedHours.length);
    const originalLabels = nextTargets.map((target) => {
      const article = target.closest<HTMLElement>("article");
      return { article, label: article?.getAttribute("aria-label") ?? null };
    });

    nextTargets.forEach((target, index) => {
      const hour = displayedHours[index];
      const article = target.closest<HTMLElement>("article");
      if (!hour || !article) return;

      article.setAttribute(
        "aria-label",
        accessibleHourLabel(hour, weatherConditionLabels[hour.icon]),
      );
    });
    setTargets(nextTargets);

    return () => {
      originalLabels.forEach(({ article, label }) => {
        if (!article) return;
        if (label === null) article.removeAttribute("aria-label");
        else article.setAttribute("aria-label", label);
      });
    };
  }, [displayedHours]);

  if (targets.length === 0) return null;

  return (
    <>
      {targets.map((target, index) => {
        const hour = displayedHours[index];
        if (!hour) return null;

        const condition = weatherConditionLabels[hour.icon];
        return createPortal(
          <span className="home-hourly-story__condition">{condition}</span>,
          target,
          `${hour.time}-${hour.icon}-${index}`,
        );
      })}
    </>
  );
}
