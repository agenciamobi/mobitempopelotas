from pathlib import Path
import re


# Remover ícones de condição que ficaram sem uso no hero editorial alternativo.
hero = Path("src/components/weather/WeatherEditorialHero.tsx")
text = hero.read_text()
text, count = re.subn(
    r'import \{\n  AlertTriangle,\n  ArrowRight,\n  CheckCircle2,\n  Cloud,\n  CloudLightning,\n  CloudMoon,\n  CloudRain,\n  CloudSun,\n  Droplets,\n  Eye,\n  Gauge,\n  Info,\n  Moon,\n  Sun,\n  Wind,\n  type LucideIcon,\n\} from "lucide-react";',
    '''import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Gauge,
  Info,
  Wind,
  type LucideIcon,
} from "lucide-react";''',
    text,
    count=1,
)
if count != 1:
    raise RuntimeError("Importações antigas do WeatherEditorialHero não encontradas")
text = text.replace('import type { WeatherIconName } from "@/lib/weather/types";\n\n', "", 1)
text, count = re.subn(
    r"const iconMap: Record<WeatherIconName, LucideIcon> = \{.*?\};\n\n",
    "",
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("Mapa de ícones antigo não encontrado")
text, count = re.subn(
    r"function WeatherIcon\(\{ name, size = 64 \}: \{ name: WeatherIconName \| null; size\?: number \}\) \{.*?\n\}\n\n",
    "",
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("Componente WeatherIcon antigo não encontrado")
hero.write_text(text)


# Resumo de amanhã precisa preservar probabilidades e rajadas não informadas.
semantic = Path("src/production/components/home-editorial-dashboard-semantic.tsx")
text = semantic.read_text()
pattern = r"function buildTomorrowFallback\(weather: WeatherData\): ForecastNarrative \| null \{.*?\n\}\n\nfunction TomorrowForecastSummary"
replacement = '''function buildTomorrowFallback(weather: WeatherData): ForecastNarrative | null {
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
      ? `A fonte não informou a probabilidade de chuva; o volume previsto é de ${formatNumber(tomorrow.precipitation)} mm.`
      : tomorrow.rainChance >= 70
        ? `A chance de chuva é alta, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
        : tomorrow.rainChance >= 35
          ? `Há possibilidade de chuva, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
          : "A chance de chuva é baixa e não há volume relevante indicado.";
  const gustDescription =
    tomorrow.windGust === null
      ? "A fonte não informou rajada máxima."
      : `As rajadas podem chegar a ${tomorrow.windGust} km/h.`;

  return {
    headline,
    summary: `${rainDescription} A temperatura deve variar entre ${tomorrow.min}° e ${tomorrow.max}°. ${gustDescription}`,
  };
}

function TomorrowForecastSummary'''
text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count != 1:
    raise RuntimeError("buildTomorrowFallback não encontrado")
semantic.write_text(text)


# Detalhes da observação não devem sugerir que a estação mede rajada ou visibilidade instantânea.
forecast = Path("src/components/weather/ForecastPages.tsx")
text = forecast.read_text()
text = text.replace(
    '<section className="forecast-current-metrics" aria-label="Detalhes do tempo agora">',
    '<section className="forecast-current-metrics" aria-label="Detalhes da medição atual da Embrapa">',
    1,
)
text = text.replace(
    '<small>{displayNumber(current.windGust, " km/h de rajada")}</small>',
    '<small>Rajada instantânea não publicada</small>',
    1,
)
visibility = '''          <article>
            <Eye aria-hidden="true" />
            <span>Visibilidade</span>
            <strong>{displayNumber(current.visibilityKm, " km")}</strong>
          </article>
'''
if visibility not in text:
    raise RuntimeError("Bloco de visibilidade não encontrado")
text = text.replace(visibility, "", 1)
forecast.write_text(text)

print("Terceira etapa de integridade aplicada.")
