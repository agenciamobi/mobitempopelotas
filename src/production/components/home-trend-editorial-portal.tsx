import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { ForecastNarrative } from "@/production/lib/weather-ai-summary";
import type {
  DailyForecast,
  WeatherData,
  WeatherIconName,
} from "@/production/lib/weather-data";

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

const conditionHeadlines: Record<WeatherIconName, string> = {
  sun: "Tempo firme com períodos de sol",
  moon: "Noite com céu aberto",
  "partly-cloudy": "Sol aparece entre nuvens",
  "partly-cloudy-night": "Noite com variação de nuvens",
  cloud: "Predomínio de nuvens ao longo do dia",
  rain: "Períodos de chuva são esperados",
  storm: "Trovoadas podem ocorrer",
  wind: "Vento ganha destaque",
};

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

function buildDaySummary(day: DailyForecast): ForecastNarrative {
  const rain =
    day.rainChance === null
      ? `${formatNumber(day.precipitation)} mm previstos.`
      : `${day.rainChance}% de chance de chuva e ${formatNumber(day.precipitation)} mm previstos.`;
  const wind = day.windGust === null ? "" : ` Rajadas de até ${day.windGust} km/h.`;

  return {
    headline: conditionHeadlines[day.icon],
    summary: `${rain}${wind}`,
  };
}

export function HomeTrendEditorialPortal({
  weather,
  narrative,
}: {
  weather: WeatherData;
  narrative: ForecastNarrative | null;
}) {
  const summaries = useMemo(() => {
    const visibleDays = weather.daily.slice(1, 5);

    return visibleDays.map((day, index) =>
      index === 0 ? narrative ?? buildTomorrowFallback(weather) ?? buildDaySummary(day) : buildDaySummary(day),
    );
  }, [narrative, weather]);
  const [cards, setCards] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>(".home-next-days__heading > strong");
    const visibleCards = Array.from(
      document.querySelectorAll<HTMLElement>(".home-next-days__list article"),
    ).slice(0, summaries.length);
    const originalHeading = heading?.textContent ?? null;

    if (heading) heading.textContent = "Como o tempo deve evoluir na semana";
    setCards(visibleCards);

    return () => {
      if (heading && originalHeading !== null) heading.textContent = originalHeading;
    };
  }, [summaries.length]);

  if (cards.length === 0) return null;

  return (
    <>
      {cards.map((card, index) => {
        const summary = summaries[index];
        if (!summary) return null;

        return createPortal(
          <div
            className={`home-next-days__day-summary${index === 0 ? " is-tomorrow" : ""}`}
          >
            <strong>{summary.headline}</strong>
            <p>{summary.summary}</p>
          </div>,
          card,
          `weekly-summary-${index}`,
        );
      })}
    </>
  );
}
