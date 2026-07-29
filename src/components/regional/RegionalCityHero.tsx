import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CloudRain } from "lucide-react";

import { WeatherSplitHero, type WeatherSplitHeroTone } from "@/components/weather/WeatherSplitHero";
import { selectPriorityRegionalAlert } from "@/lib/weather/regional-alert-priority";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import { WeatherIcon } from "@/production/components/weather-icon";

import { formatRegionalDateTime, formatRegionalHour } from "./regional-time-format";
import { regionalWeatherIcon } from "./regional-weather-presentation";

const regionalNumberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

function metric(value: number | null, suffix = "") {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${regionalNumberFormat.format(value)}${suffix}`;
}

function maximum(values: Array<number | null>) {
  const usable = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return usable.length > 0 ? Math.max(...usable) : null;
}

function heroTone(data: RegionalCityWeatherData): WeatherSplitHeroTone {
  const alert = selectPriorityRegionalAlert(data.alerts.items);
  const rain = maximum(data.hourly.slice(0, 24).map((hour) => hour.rainChance));
  const gust = maximum(data.hourly.slice(0, 24).map((hour) => hour.windGust));

  if (alert?.severity === "great-danger" || alert?.severity === "danger") return "strong";
  if (alert?.severity === "potential") return "elevated";
  if ((rain ?? 0) >= 80 || (gust ?? 0) >= 70) return "strong";
  if ((rain ?? 0) >= 50 || (gust ?? 0) >= 50) return "elevated";
  if (!data.current && data.daily.length === 0) return "unknown";
  return "moderate";
}

export function RegionalCityHero({ data }: { data: RegionalCityWeatherData }) {
  const city = data.city;
  const current = data.current;
  const today = data.daily[0] ?? null;
  const priorityAlert = selectPriorityRegionalAlert(data.alerts.items);
  const condition = current?.condition ?? "Condição em atualização";
  const peakRain = data.hourly.slice(0, 24).reduce<(typeof data.hourly)[number] | null>(
    (selected, hour) => {
      if (hour.rainChance === null) return selected;
      if (!selected || (hour.rainChance ?? -1) > (selected.rainChance ?? -1)) return hour;
      return selected;
    },
    null,
  );
  const strongestGust = maximum(data.hourly.slice(0, 24).map((hour) => hour.windGust));
  const currentIcon = regionalWeatherIcon(condition, current?.observedAt ?? null);
  const peakRainDetail = peakRain
    ? `por volta de ${formatRegionalHour(peakRain.time)}${
        peakRain.precipitationMm === null
          ? ""
          : ` · ${metric(peakRain.precipitationMm, " mm")}`
      }`
    : "Horário de maior chance ainda não informado";

  return (
    <WeatherSplitHero
      className="regional-city-split-hero"
      titleId="regional-city-hero-title"
      back={
        <Link className="weather-split-hero__back" to="/tempo-na-regiao-sul-rs">
          <ArrowLeft aria-hidden="true" /> Central regional
        </Link>
      }
      eyebrow={`Previsão local · ${city.group}`}
      title={`Como o tempo deve mudar em ${city.name}.`}
      description={`Compare a condição estimada agora com temperatura, chuva e vento previstos para as próximas horas e veja a tendência dos próximos dias no município.`}
      actions={
        <>
          <a href="#previsao-hoje">
            Ver as próximas horas <ArrowRight aria-hidden="true" />
          </a>
          <a href="#avisos-municipais">Avisos oficiais</a>
        </>
      }
      tone={heroTone(data)}
      badgeIcon={<WeatherIcon name={currentIcon} title={`Condição estimada: ${condition}`} />}
      badgeLabel={priorityAlert ? `Aviso oficial para ${city.name}` : condition}
      updatedLabel={formatRegionalDateTime(data.source.fetchedAt)}
      currentLabel="Temperatura agora"
      currentValue={metric(current?.temperature ?? null, "°")}
      currentDetail={`${condition} · sensação de ${metric(current?.feelsLike ?? null, "°")}`}
      highlightIcon={<CloudRain aria-hidden="true" />}
      highlightLabel="Maior chance de chuva nas próximas 24h"
      highlightValue={metric(peakRain?.rainChance ?? null, "%")}
      highlightDetail={peakRainDetail}
      facts={[
        {
          label: "Faixa prevista hoje",
          value: today ? `${metric(today.minimum, "°")} / ${metric(today.maximum, "°")}` : "Não informada",
        },
        {
          label: "Rajada mais forte",
          value: metric(strongestGust, " km/h"),
        },
      ]}
      footer="Estimativa do modelo para as coordenadas centrais do município. Avisos oficiais têm prioridade."
    />
  );
}
