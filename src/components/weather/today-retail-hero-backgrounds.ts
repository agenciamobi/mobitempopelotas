import type { WeatherIconName } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

export type TodayRetailHeroPhoto = {
  src: string;
  alt: string;
  credit: string;
  sourceHref: string;
  position: string;
};

const photos = {
  clear: {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Amanhecer_na_Praia_do_Laranjal.jpg/1920px-Amanhecer_na_Praia_do_Laranjal.jpg",
    alt: "Amanhecer na Praia do Laranjal, em Pelotas",
    credit: "Sebastian2112 · CC BY-SA 4.0",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Amanhecer_na_Praia_do_Laranjal.jpg",
    position: "center 55%",
  },
  calm: {
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunset_over_Calm_Lake.jpg?width=1920",
    alt: "Céu com nuvens sobre um lago ao entardecer",
    credit: "Kane Morley · CC BY 2.0",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Sunset_over_Calm_Lake.jpg",
    position: "center 46%",
  },
  rain: {
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Heavy_Rain.jpg?width=1920",
    alt: "Chuva intensa em uma área arborizada",
    credit: "Pridatko Oleksandr · domínio público",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Heavy_Rain.jpg",
    position: "center 52%",
  },
} satisfies Record<string, TodayRetailHeroPhoto>;

export function getTodayRetailHeroPhoto(
  icon: WeatherIconName,
  advisoryLevel: AdvisoryLevel,
): TodayRetailHeroPhoto {
  if (advisoryLevel === "warning" || icon === "storm" || icon === "rain") {
    return photos.rain;
  }

  if (icon === "sun" || icon === "partly-cloudy") {
    return photos.clear;
  }

  return photos.calm;
}
