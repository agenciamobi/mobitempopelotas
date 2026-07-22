import { unstable_cache } from "next/cache";
import type {
  DailyForecast,
  WeatherData,
  WeatherIconName,
} from "@/lib/weather-data";

export type ForecastNarrative = {
  headline: string;
  summary: string;
};

export type WeatherAiSummaries = {
  status: "generated" | "unavailable";
  today: ForecastNarrative | null;
  tomorrow: ForecastNarrative | null;
  generatedAt: string | null;
  model: string | null;
};

type SummaryPayload = {
  city: string;
  current: {
    condition: string;
    temperatureC: number;
    feelsLikeC: number;
    humidityPercent: number;
    windSpeedKmh: number;
    windGustKmh: number;
    windDirection: string;
  };
  today: ForecastDayPayload;
  tomorrow: ForecastDayPayload;
  nextHours: Array<{
    time: string;
    temperatureC: number;
    rainChancePercent: number;
    windSpeedKmh: number;
    windGustKmh: number;
    condition: string;
  }>;
};

type ForecastDayPayload = {
  label: string;
  date: string;
  condition: string;
  minimumC: number;
  maximumC: number;
  rainChancePercent: number;
  rainVolumeMm: number;
  maximumWindGustKmh: number;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        thought?: boolean;
      }>;
    };
  }>;
};

type GeminiKeySource = "GOOGLE_API_KEY" | "GEMINI_API_KEY";
type WeatherAiFailureReason =
  | "missing_api_key"
  | "invalid_weather_payload"
  | "api_error"
  | "empty_response"
  | "invalid_response"
  | "timeout"
  | "unexpected_error";

class WeatherAiGenerationError extends Error {
  constructor(
    readonly reason: WeatherAiFailureReason,
    readonly detail?: string,
  ) {
    super(reason);
    this.name = "WeatherAiGenerationError";
  }
}

const conditionLabels: Record<WeatherIconName, string> = {
  sun: "predomínio de sol",
  moon: "céu limpo durante a noite",
  "partly-cloudy": "sol entre nuvens",
  "partly-cloudy-night": "noite parcialmente nublada",
  cloud: "céu nublado",
  rain: "chuva",
  storm: "risco de temporal",
  wind: "vento forte",
};

const blockedClaims = [
  /vai inundar/i,
  /sem risco/i,
  /não há risco/i,
  /está seguro/i,
  /sem perigo/i,
  /previsão oficial/i,
  /garantid[oa]/i,
  /com certeza/i,
  /evacue/i,
  /abandone sua casa/i,
];

const narrativeJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    today: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: {
          type: "string",
          description: "Título editorial curto, sem números e sem markdown.",
        },
        summary: {
          type: "string",
          description:
            "Resumo meteorológico em português do Brasil, sem números, markdown ou recomendações de emergência.",
        },
      },
      required: ["headline", "summary"],
    },
    tomorrow: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: {
          type: "string",
          description: "Título editorial curto, sem números e sem markdown.",
        },
        summary: {
          type: "string",
          description:
            "Resumo meteorológico em português do Brasil, sem números, markdown ou recomendações de emergência.",
        },
      },
      required: ["headline", "summary"],
    },
  },
  required: ["today", "tomorrow"],
} as const;

function unavailableSummaries(): WeatherAiSummaries {
  return {
    status: "unavailable",
    today: null,
    tomorrow: null,
    generatedAt: null,
    model: null,
  };
}

function resolveGeminiApiKey(): {
  apiKey: string;
  source: GeminiKeySource;
} | null {
  const googleApiKey = process.env.GOOGLE_API_KEY?.trim();
  if (googleApiKey) {
    return { apiKey: googleApiKey, source: "GOOGLE_API_KEY" };
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiApiKey) {
    return { apiKey: geminiApiKey, source: "GEMINI_API_KEY" };
  }

  return null;
}

function logUnavailable(
  reason: WeatherAiFailureReason,
  detail?: string,
  model?: string,
  keySource?: GeminiKeySource,
) {
  console.warn("[weather-ai-summary] unavailable", {
    reason,
    detail: detail || undefined,
    model: model || undefined,
    keySource: keySource || undefined,
  });
}

function dayPayload(day: DailyForecast): ForecastDayPayload {
  return {
    label: day.weekday,
    date: day.date,
    condition: conditionLabels[day.icon],
    minimumC: day.min,
    maximumC: day.max,
    rainChancePercent: day.rainChance,
    rainVolumeMm: day.precipitation,
    maximumWindGustKmh: day.windGust,
  };
}

function buildPayload(weather: WeatherData): SummaryPayload | null {
  const today = weather.daily[0];
  const tomorrow = weather.daily[1];

  if (!today || !tomorrow || weather.source.isFallback) return null;

  return {
    city: `${weather.current.city}, ${weather.current.state}`,
    current: {
      condition: weather.current.condition,
      temperatureC: weather.current.temperature,
      feelsLikeC: weather.current.feelsLike,
      humidityPercent: weather.current.humidity,
      windSpeedKmh: weather.current.windSpeed,
      windGustKmh: weather.current.windGust,
      windDirection: weather.current.windDirection,
    },
    today: dayPayload(today),
    tomorrow: dayPayload(tomorrow),
    nextHours: weather.hourly.slice(0, 12).map((hour) => ({
      time: hour.time,
      temperatureC: hour.temperature,
      rainChancePercent: hour.precipitation,
      windSpeedKmh: hour.windSpeed,
      windGustKmh: hour.windGust,
      condition: conditionLabels[hour.icon],
    })),
  };
}

function cleanText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") return null;

  const text = value
    .replace(/```(?:json)?/gi, "")
    .replace(/[*_#`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.length > maximumLength) return null;
  if (/\d/.test(text)) return null;
  if (blockedClaims.some((claim) => claim.test(text))) return null;

  return text;
}

function parseNarrative(value: unknown): ForecastNarrative | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const headline = cleanText(candidate.headline, 90);
  const summary = cleanText(candidate.summary, 430);

  if (!headline || !summary) return null;
  if (summary.split(/\s+/).length < 18) return null;

  return { headline, summary };
}

function extractResponseText(response: GeminiGenerateContentResponse) {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const answerParts = parts.filter((part) => part.thought !== true);
  const answer = answerParts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (answer) return answer;

  return [...parts]
    .reverse()
    .map((part) => part.text ?? "")
    .find((text) => text.trim())
    ?.trim();
}

function extractJsonCandidate(text: string) {
  const withoutFences = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace <= firstBrace) return withoutFences;
  return withoutFences.slice(firstBrace, lastBrace + 1);
}

function parseJsonObject(text: string) {
  const candidate = extractJsonCandidate(text);
  const attempts = [candidate, candidate.replace(/,\s*([}\]])/g, "$1")];

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Tenta a próxima normalização antes de declarar a resposta inválida.
    }
  }

  throw new WeatherAiGenerationError("invalid_response", "invalid_json");
}

function parseModelResponse(text: string) {
  const parsed = parseJsonObject(text);
  const today = parseNarrative(parsed.today);
  const tomorrow = parseNarrative(parsed.tomorrow);

  if (!today || !tomorrow) return null;
  return { today, tomorrow };
}

function buildPrompt(payload: SummaryPayload) {
  return [
    "Você é o editor meteorológico automático do portal TEMPO Pelotas.",
    "Produza dois resumos curtos em português do Brasil: um para hoje e outro para amanhã.",
    "Use exclusivamente os fatos contidos no JSON fornecido.",
    "O resumo de hoje pode considerar a condição atual, o consolidado diário e os próximos horários.",
    "O resumo de amanhã deve considerar somente o consolidado do próximo dia.",
    "Não mencione hidrologia, Lagoa dos Patos, cotas, enchentes ou níveis de rios.",
    "Não dê ordens, garantias, recomendações de emergência ou afirmações de segurança.",
    "Não escreva algarismos, unidades ou medições no texto; os números serão exibidos separadamente na interface.",
    "Destaque apenas tendência de chuva, variação térmica, condição predominante e vento quando forem relevantes.",
    "Cada headline deve ter entre três e nove palavras.",
    "Cada summary deve ter entre trinta e sessenta palavras, sem markdown.",
    "Responda somente com o objeto JSON solicitado.",
    "Dados:",
    JSON.stringify(payload),
  ].join("\n");
}

async function requestGemini(
  payload: SummaryPayload,
  model: string,
  apiKey: string,
  signal: AbortSignal,
  structured: boolean,
) {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens: 650,
    responseMimeType: "application/json",
  };

  if (structured) {
    generationConfig.responseJsonSchema = narrativeJsonSchema;
  }

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(payload) }],
          },
        ],
        generationConfig,
      }),
      cache: "no-store",
      signal,
    },
  );
}

async function generateGeminiResponse(
  payload: SummaryPayload,
  model: string,
  apiKey: string,
  signal: AbortSignal,
) {
  let response = await requestGemini(payload, model, apiKey, signal, true);

  if (response.status === 400) {
    response = await requestGemini(payload, model, apiKey, signal, false);
  }

  if (!response.ok) {
    throw new WeatherAiGenerationError(
      "api_error",
      `${response.status} ${response.statusText}`.trim(),
    );
  }

  return (await response.json()) as GeminiGenerateContentResponse;
}

const generateCachedSummaries = unstable_cache(
  async (payloadJson: string, model: string): Promise<WeatherAiSummaries> => {
    const key = resolveGeminiApiKey();
    if (!key) {
      throw new WeatherAiGenerationError("missing_api_key");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const payload = JSON.parse(payloadJson) as SummaryPayload;
      const body = await generateGeminiResponse(
        payload,
        model,
        key.apiKey,
        controller.signal,
      );
      const text = extractResponseText(body);

      if (!text) {
        throw new WeatherAiGenerationError("empty_response");
      }

      const parsed = parseModelResponse(text);
      if (!parsed) {
        throw new WeatherAiGenerationError(
          "invalid_response",
          "content_rejected",
        );
      }

      return {
        status: "generated",
        today: parsed.today,
        tomorrow: parsed.tomorrow,
        generatedAt: new Date().toISOString(),
        model,
      };
    } catch (error) {
      if (error instanceof WeatherAiGenerationError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new WeatherAiGenerationError("timeout");
      }
      throw new WeatherAiGenerationError(
        "unexpected_error",
        error instanceof Error ? error.name : "unknown",
      );
    } finally {
      clearTimeout(timeout);
    }
  },
  ["weather-ai-summaries-v3"],
  { revalidate: 1_800 },
);

export async function getWeatherAiSummaries(
  weather: WeatherData,
): Promise<WeatherAiSummaries> {
  const payload = buildPayload(weather);
  if (!payload) {
    logUnavailable("invalid_weather_payload");
    return unavailableSummaries();
  }

  const key = resolveGeminiApiKey();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

  try {
    return await generateCachedSummaries(JSON.stringify(payload), model);
  } catch (error) {
    if (error instanceof WeatherAiGenerationError) {
      logUnavailable(error.reason, error.detail, model, key?.source);
    } else {
      logUnavailable("unexpected_error", "unknown", model, key?.source);
    }
    return unavailableSummaries();
  }
}
