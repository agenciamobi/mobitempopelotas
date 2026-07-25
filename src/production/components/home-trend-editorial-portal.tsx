import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { ForecastNarrative } from "@/production/lib/weather-ai-summary";
import type { WeatherData } from "@/production/lib/weather-data";

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function buildTomorrowFallback(weather: WeatherData): ForecastNarrative | null {
  const tomorrow = weather.daily[1];
  if (!tomorrow) return null;

  const hasStrongWind = (tomorrow.windGust ?? -1) >= 50;
  const headline =
    tomorrow.icon === "storm" || hasStrongWind
      ? "Amanhã exige atenção ao tempo"
      : tomorrow.rainChance !== null && tomorrow.rainChance >= 70
        ? "Chuva deve marcar o dia de amanhã"
        : tomorrow.rainChance !== null && tomorrow.rainChance >= 35
          ? "Amanhã pode ter períodos de chuva"
          : tomorrow.icon === "sun"
            ? "Amanhã terá períodos de sol"
            : "Amanhã terá variação de nuvens";

  const rainDescription =
    tomorrow.rainChance === null
      ? `Probabilidade de chuva não informada; volume previsto de ${formatNumber(tomorrow.precipitation)} mm.`
      : tomorrow.rainChance >= 70
        ? `Chance alta de chuva, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
        : tomorrow.rainChance >= 35
          ? `Possibilidade de chuva, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
          : "Chance baixa de chuva, sem volume relevante indicado.";
  const gustDescription =
    tomorrow.windGust === null
      ? "Rajada máxima não informada."
      : `Rajadas de até ${tomorrow.windGust} km/h.`;

  return {
    headline,
    summary: `${rainDescription} Temperaturas entre ${tomorrow.min}° e ${tomorrow.max}°. ${gustDescription}`,
  };
}

export function HomeTrendEditorialPortal({
  weather,
  narrative,
}: {
  weather: WeatherData;
  narrative: ForecastNarrative | null;
}) {
  const resolvedNarrative = useMemo(
    () => narrative ?? buildTomorrowFallback(weather),
    [narrative, weather],
  );
  const [tomorrowCard, setTomorrowCard] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>(".home-next-days__heading > strong");
    const card = document.querySelector<HTMLElement>(".home-next-days__list article:first-child");
    const originalHeading = heading?.textContent ?? null;

    if (heading) heading.textContent = "Como o tempo deve evoluir na semana";
    setTomorrowCard(card);

    return () => {
      if (heading && originalHeading !== null) heading.textContent = originalHeading;
    };
  }, []);

  if (!tomorrowCard || !resolvedNarrative) return null;

  return createPortal(
    <div className="home-next-days__tomorrow-inline">
      <strong>{resolvedNarrative.headline}</strong>
      <p>{resolvedNarrative.summary}</p>
    </div>,
    tomorrowCard,
  );
}
