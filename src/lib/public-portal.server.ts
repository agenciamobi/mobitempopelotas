import { fetchLaranjalLevelData } from "./hydrology/laranjal-level.server";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "./site-config";
import { fetchWeatherIntelligence } from "./weather/weather-intelligence.server";

const LOCATION = {
  city: "Pelotas",
  state: "RS",
  country: "BR",
  latitude: -31.7654,
  longitude: -52.3376,
  timezone: "America/Sao_Paulo",
} as const;

function formatMetric(value: number | null, unit: string) {
  return value === null ? "indisponível" : `${value}${unit}`;
}

function publicEmbrapaObservation(
  observation: Awaited<ReturnType<typeof fetchWeatherIntelligence>>["weather"]["observation"],
) {
  return {
    status: observation.status,
    current: observation.current,
    extremes: observation.extremes,
    accumulated: observation.accumulated,
    source: observation.source,
  };
}

function publicLaranjalLevel(level: Awaited<ReturnType<typeof fetchLaranjalLevelData>>) {
  return {
    status: level.status,
    current_level_m: level.currentLevel,
    updated_at: level.updatedAt,
    age_minutes: level.ageMinutes,
    trend_cm_per_hour: level.trendCmPerHour,
    change_1h_cm: level.change1hCm,
    change_6h_cm: level.change6hCm,
    change_24h_cm: level.change24hCm,
    period_average_m: level.periodAverage,
    period_minimum_m: level.periodMinimum,
    period_maximum_m: level.periodMaximum,
    series: level.series,
    source: level.source,
  };
}

export async function fetchPublicPortalSnapshot() {
  const [weatherIntelligence, laranjalLevel] = await Promise.all([
    fetchWeatherIntelligence(),
    fetchLaranjalLevelData(),
  ]);
  const { weather, brief, intelligence } = weatherIntelligence;

  return {
    schema_version: "2.0",
    generated_at: new Date().toISOString(),
    location: LOCATION,
    status: weather.status,
    summary: brief,
    weather: {
      current: weather.current,
      current_provenance: weather.currentProvenance,
      hourly: weather.hourly,
      daily: weather.daily,
      alerts: weather.alerts,
      official_forecast: weather.officialForecast,
      observed: {
        embrapa: publicEmbrapaObservation(weather.observation),
      },
      quality: weather.quality,
      sources: weather.sources,
      source: weather.source,
      message: weather.message,
      summary_generation: {
        origin: intelligence.origin,
        generated_at: intelligence.generatedAt,
      },
    },
    hydrology: {
      status: laranjalLevel.status === "unavailable" ? "unavailable" : "contextual-monitoring",
      local_level: {
        laranjal: publicLaranjalLevel(laranjalLevel),
        interpretation:
          "Medição local da Estação Laranjal. A leitura representa esse ponto específico e deve ser interpretada junto com chuva, vento e orientações oficiais.",
      },
      system_note:
        "O nível da Lagoa dos Patos em Pelotas depende de chuva, vento, contribuições das bacias, Canal São Gonçalo e escoamento pela Barra de Rio Grande.",
    },
    links: {
      home: absoluteUrl("/"),
      today: absoluteUrl("/tempo-hoje-pelotas"),
      forecast: absoluteUrl("/previsao-7-dias-pelotas"),
      alerts: absoluteUrl("/alertas"),
      embrapa_station: absoluteUrl("/estacao-embrapa-pelotas"),
      hydrology: absoluteUrl("/situacao-hidrologica-pelotas"),
      laranjal_level: absoluteUrl("/nivel-da-lagoa-dos-patos-laranjal"),
      methodology: absoluteUrl("/metodologia"),
      feed: absoluteUrl("/feed"),
      public_data: absoluteUrl("/pelotas.json"),
    },
    disclaimer:
      "Informação comunitária. Os dados não substituem alertas, boletins ou orientações da Defesa Civil e das autoridades competentes.",
  };
}

export type PublicPortalSnapshot = Awaited<ReturnType<typeof fetchPublicPortalSnapshot>>;

export function createPublicJsonFeed(snapshot: PublicPortalSnapshot) {
  const current = snapshot.weather.current;
  const today = snapshot.weather.daily[0];
  const embrapa = snapshot.weather.observed.embrapa;
  const laranjal = snapshot.hydrology.local_level.laranjal;
  const activeAlerts = snapshot.weather.alerts.filter((alert) => alert.period === "active");

  const currentTitle =
    current?.temperature === null || current?.temperature === undefined
      ? snapshot.summary.headline
      : `Tempo em Pelotas: ${current.temperature} °C${current.condition ? ` e ${current.condition.toLowerCase()}` : ""}`;
  const forecastDetails = today
    ? ` Hoje, mínima de ${today.min} °C, máxima de ${today.max} °C e ${today.rainChance === null ? `${today.precipitationMm} mm de precipitação previstos` : `${today.rainChance}% de chance de chuva`}.`
    : "";
  const embrapaText =
    embrapa.status === "unavailable"
      ? "A observação da Embrapa está temporariamente indisponível para consulta pelo portal."
      : `A estação da Embrapa informou ${formatMetric(embrapa.current.temperature, " °C")}, umidade de ${formatMetric(embrapa.current.humidity, "%")}, vento de ${formatMetric(embrapa.current.windSpeed, " km/h")} e ${formatMetric(embrapa.accumulated.rainDaily, " mm")} de chuva no dia.`;
  const alertText =
    activeAlerts.length === 0
      ? "Nenhum alerta oficial ativo para Pelotas ou contexto regional foi identificado na consulta atual."
      : `${activeAlerts.length} alerta${activeAlerts.length === 1 ? " oficial ativo" : "s oficiais ativos"}: ${activeAlerts.map((alert) => alert.event).join("; ")}.`;
  const laranjalText =
    laranjal.status === "unavailable"
      ? "A leitura da Estação Laranjal está temporariamente indisponível."
      : `A última leitura conhecida da Estação Laranjal é de ${formatMetric(laranjal.current_level_m, " m")}${laranjal.age_minutes === null ? "" : `, com idade de ${laranjal.age_minutes} minutos`}.`;

  return {
    version: "https://jsonfeed.org/version/1.1",
    title: SITE_NAME,
    home_page_url: absoluteUrl("/"),
    feed_url: absoluteUrl("/feed"),
    description: SITE_DESCRIPTION,
    language: "pt-BR",
    items: [
      {
        id: absoluteUrl("/tempo-hoje-pelotas"),
        url: absoluteUrl("/tempo-hoje-pelotas"),
        title: currentTitle,
        content_text: `${snapshot.summary.summary}${forecastDetails}`,
        date_modified: snapshot.generated_at,
        tags: ["tempo", "Pelotas", "previsão", "chuva", "vento"],
      },
      {
        id: absoluteUrl("/alertas"),
        url: absoluteUrl("/alertas"),
        title:
          activeAlerts.length > 0
            ? "Alertas meteorológicos ativos"
            : "Monitoramento de alertas oficiais",
        content_text: alertText,
        date_modified: snapshot.generated_at,
        tags: ["INMET", "alertas", "Pelotas", "Defesa Civil"],
      },
      {
        id: absoluteUrl("/estacao-embrapa-pelotas"),
        url: absoluteUrl("/estacao-embrapa-pelotas"),
        title: "Observação meteorológica da Embrapa em Pelotas",
        content_text: embrapaText,
        date_modified: embrapa.source.fetchedAt,
        tags: ["Embrapa", "observação", "Pelotas", "chuva medida"],
      },
      {
        id: absoluteUrl("/nivel-da-lagoa-dos-patos-laranjal"),
        url: absoluteUrl("/nivel-da-lagoa-dos-patos-laranjal"),
        title: "Nível da Lagoa dos Patos na Estação Laranjal",
        content_text: `${laranjalText} Acompanhe a tendência local junto com o contexto meteorológico e as orientações oficiais.`,
        date_modified: laranjal.updated_at ?? laranjal.source.fetchedAt,
        tags: ["hidrologia", "Lagoa dos Patos", "Laranjal", "Pelotas"],
      },
      {
        id: absoluteUrl("/metodologia"),
        url: absoluteUrl("/metodologia"),
        title: "Metodologia e fontes do Tempo Pelotas",
        content_text:
          "Consulte as fontes, regras de validação, contingências, limitações e critérios de confiança utilizados pelo portal.",
        date_modified: snapshot.generated_at,
        tags: ["metodologia", "dados abertos", "fontes", "transparência"],
      },
    ],
  };
}
