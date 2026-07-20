import type { DailyForecast, WeatherData } from "@/lib/weather-data";

export type AdvisoryLevel = "normal" | "attention" | "warning";

export type WeatherAdvisory = {
  level: AdvisoryLevel;
  eyebrow: string;
  title: string;
  description: string;
  reasons: string[];
};

function maxBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce<T | undefined>((selected, item) => {
    if (!selected || selector(item) > selector(selected)) return item;
    return selected;
  }, undefined);
}

function minBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce<T | undefined>((selected, item) => {
    if (!selected || selector(item) < selector(selected)) return item;
    return selected;
  }, undefined);
}

export function formatMillimeters(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getWeatherAdvisory(weather: WeatherData): WeatherAdvisory {
  const today = weather.daily[0];
  const maxHourlyGust = Math.max(
    weather.current.windGust,
    ...weather.hourly.map((hour) => hour.windGust),
  );
  const maxHourlyRainChance = Math.max(
    today?.rainChance ?? 0,
    ...weather.hourly.map((hour) => hour.precipitation),
  );
  const hasStormSignal =
    weather.current.icon === "storm" ||
    weather.hourly.some((hour) => hour.icon === "storm") ||
    today?.icon === "storm";
  const precipitation = today?.precipitation ?? 0;
  const reasons: string[] = [];

  if (hasStormSignal) reasons.push("a previsão mostra possibilidade de temporal");
  if (maxHourlyGust >= 50) reasons.push(`as rajadas podem chegar a ${maxHourlyGust} km/h`);
  if (maxHourlyRainChance >= 70) reasons.push(`a chance de chuva chega a ${maxHourlyRainChance}%`);
  if (precipitation >= 25) reasons.push(`o volume de chuva previsto para hoje é de ${formatMillimeters(precipitation)} mm`);

  if (hasStormSignal || maxHourlyGust >= 75 || precipitation >= 50) {
    return {
      level: "warning",
      eyebrow: "Atenção redobrada",
      title: "A previsão mostra condições que merecem cuidado",
      description:
        "Há possibilidade de temporal, chuva volumosa ou vento forte. Consulte também os avisos da Defesa Civil e do INMET.",
      reasons,
    };
  }

  if (maxHourlyGust >= 50 || maxHourlyRainChance >= 70 || precipitation >= 25) {
    return {
      level: "attention",
      eyebrow: "Atenção nas próximas horas",
      title: "Acompanhe a chuva e o vento",
      description:
        "A previsão mostra chuva ou rajadas que merecem acompanhamento. Esta informação não substitui os avisos oficiais.",
      reasons,
    };
  }

  return {
    level: "normal",
    eyebrow: "Sem sinal importante no momento",
    title: "A previsão não mostra chuva ou vento fortes",
    description:
      "As condições podem mudar. Continue acompanhando e consulte os canais oficiais quando o tempo estiver instável.",
    reasons: [],
  };
}

export function getWeekHighlights(days: DailyForecast[]) {
  const hottest = maxBy(days, (day) => day.max);
  const coldest = minBy(days, (day) => day.min);
  const wettest = maxBy(days, (day) => day.precipitation);
  const windiest = maxBy(days, (day) => day.windGust);

  return { hottest, coldest, wettest, windiest };
}
