import type { WeatherData, WeatherIconName } from "@/production/lib/weather-data";

export type HeroPhotoKind = "rain" | "fog" | "clear" | "cloudy";

export type HeroPhotoPresentation = {
  kind: HeroPhotoKind;
  src: string;
  position: string;
  credit: string;
};

const heroPhotos = {
  rain: {
    kind: "rain",
    src: "/weather/hero/pelotas-laranjal-chuva.webp",
    position: "center 48%",
    credit: "Acervo Tempo Pelotas",
  },
  fog: {
    kind: "fog",
    src: "/weather/hero/pelotas-nevoeiro-centro.webp",
    position: "center 48%",
    credit: "Acervo Tempo Pelotas",
  },
  clear: {
    kind: "clear",
    src: "/weather/hero/pelotas-ceu-limpo.webp",
    position: "center 42%",
    credit: "Acervo Tempo Pelotas",
  },
  cloudy: {
    kind: "cloudy",
    src: "/weather/hero/pelotas-parcialmente-nublado.avif",
    position: "center 50%",
    credit: "Acervo Tempo Pelotas",
  },
} satisfies Record<HeroPhotoKind, HeroPhotoPresentation>;

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function resolveHeroPhoto({
  weather,
  icon,
  officialSummary,
}: {
  weather: WeatherData;
  icon: WeatherIconName;
  officialSummary?: string | null;
}): HeroPhotoPresentation {
  const conditionText = normalizeText(
    [weather.current.condition, officialSummary].filter(Boolean).join(" "),
  );

  if (/nevoeiro|neblina|nevoa|cerração|cerracao/.test(conditionText)) {
    return heroPhotos.fog;
  }

  if (/tempest|trovo|chuva|garoa|pancada/.test(conditionText) || icon === "rain" || icon === "storm") {
    return heroPhotos.rain;
  }

  if (icon === "sun") {
    return heroPhotos.clear;
  }

  return heroPhotos.cloudy;
}
