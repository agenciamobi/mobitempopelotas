import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import {
  InternalForecastStory,
  InternalNextStep,
  InternalObservationWidget,
  InternalPageChapters,
  InternalPracticalSummary,
} from "@/components/weather/InternalWeatherWidgets";
import { TodayAtmosphericSignals } from "@/components/weather/TodayAtmosphericSignals";
import { TodayWeatherResources } from "@/components/weather/TodayWeatherResources";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./TodayAtmosphericSignalsLink.css";
import "./TodayForecastPageV5.css";
import "./TodayTypographyRefinement.css";
import "./TodayForecastMobileRefinement.css";

const chapters = [
  { href: "#previsao-hoje", label: "Próximas horas", detail: "Temperatura, chuva e vento" },
  { href: "#recursos-hoje", label: "Melhor período", detail: "Janelas para sair" },
  { href: "#medicao-atual", label: "Condição atual", detail: "Leitura da estação" },
  { href: "#atmosfera-hoje", label: "Neblina e nuvens", detail: "Orvalho e visibilidade" },
  { href: "#leitura-do-dia", label: "Para sua rotina", detail: "O que merece atenção" },
  { href: "#como-interpretar-hoje", label: "Entenda os dados", detail: "Medição, previsão e FAQ" },
];

function strongestWind(data: WeatherIntelligenceData) {
  return data.weather.hourly
    .slice(1, 12)
    .reduce((value, hour) => Math.max(value, hour.windGust ?? hour.windSpeed), 0);
}

function highestRainChance(data: WeatherIntelligenceData) {
  return data.weather.hourly.slice(1, 12).reduce<number | null>((value, hour) => {
    if (hour.precipitationProbability === null) return value;
    return value === null
      ? hour.precipitationProbability
      : Math.max(value, hour.precipitationProbability);
  }, null);
}

function buildReadingTitle(data: WeatherIntelligenceData) {
  const today = data.weather.daily[0];
  const rainChance = highestRainChance(data) ?? today?.rainChance ?? null;
  const wind = strongestWind(data);
  const hasActiveAlert = data.weather.alerts.some(
    (alert) =>
      alert.period === "active" &&
      alert.relevance === "pelotas" &&
      alert.severity !== "unknown",
  );

  if (hasActiveAlert) return "Aviso oficial pede atenção durante o restante do dia";
  if ((rainChance ?? 0) >= 60) return "A chuva deve ser o principal ponto de atenção";
  if (wind >= 40) return "Rajadas podem interferir nas atividades ao ar livre";
  if (today && today.max <= 18) return "Temperaturas baixas devem persistir ao longo do dia";
  if ((rainChance ?? 100) <= 20) return "O restante do dia tende a ter pouca chuva";
  return "Temperatura, chuva e vento devem variar sem um único fator dominante";
}

function ForecastUnavailable() {
  return (
    <section className="today-v5-unavailable" aria-labelledby="today-v5-unavailable-title">
      <span>Tempo Pelotas</span>
      <h2 id="today-v5-unavailable-title">A previsão de hoje está em atualização</h2>
      <p>
        As fontes não forneceram dados suficientes para montar a leitura do dia. Nenhum valor
        demonstrativo foi inserido.
      </p>
      <Link to="/">
        <ArrowLeft aria-hidden="true" /> Voltar à visão geral
      </Link>
    </section>
  );
}

export function TodayForecastPageV5({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const hasWeather = Boolean(
    recoveredData.weather.current ||
      recoveredData.weather.hourly.length > 0 ||
      recoveredData.weather.daily.length > 0,
  );

  if (!hasWeather) return <ForecastUnavailable />;

  return (
    <div className="today-v5-page">
      <InternalPageChapters items={chapters} label="Navegação da previsão de hoje" />
      <InternalForecastStory data={recoveredData} />
      <TodayWeatherResources data={recoveredData} />
      <InternalObservationWidget data={recoveredData} />
      <TodayAtmosphericSignals data={recoveredData} />
      <InternalPracticalSummary
        data={recoveredData}
        title={buildReadingTitle(recoveredData)}
        footer={<InternalNextStep />}
      />
    </div>
  );
}
