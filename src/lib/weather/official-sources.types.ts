export type OfficialSourceStatus = "live" | "partial" | "unavailable";

export type TimedObservation = {
  value: number | null;
  time: string | null;
};

export type EmbrapaObservation = {
  status: OfficialSourceStatus;
  current: {
    temperature: number | null;
    humidity: number | null;
    feelsLike: number | null;
    dewPoint: number | null;
    pressure: number | null;
    pressureTrend: string | null;
    windDirection: string | null;
    windSpeed: number | null;
    sunrise: string | null;
    sunset: string | null;
  };
  extremes: {
    temperatureMin: TimedObservation;
    temperatureMax: TimedObservation;
    humidityMin: TimedObservation;
    humidityMax: TimedObservation;
    windSpeedMax: TimedObservation;
  };
  accumulated: {
    rainDaily: number | null;
    rainMonthly: number | null;
    rainAnnual: number | null;
  };
  source: {
    name: "Embrapa Clima Temperado";
    station: string;
    url: string;
    latitude: number;
    longitude: number;
    altitude: number;
    fetchedAt: string;
    observationTime: string | null;
  };
  error: string | null;
};

export type InmetAlertSeverity = "potential" | "danger" | "great-danger" | "unknown";
export type InmetAlertRelevance = "pelotas" | "regional" | "state";
export type InmetAlertPeriod = "active" | "upcoming";

export type InmetAlert = {
  id: string;
  event: string;
  headline: string;
  description: string;
  instruction: string;
  severity: InmetAlertSeverity;
  severityLabel: string;
  relevance: InmetAlertRelevance;
  period: InmetAlertPeriod;
  startsAt: string | null;
  expiresAt: string | null;
  sentAt: string | null;
  areas: string[];
  municipalities: string[];
  municipalityCodes: string[];
  officialUrl: string;
};

export type InmetAlerts = {
  status: "live" | "unavailable";
  alerts: InmetAlert[];
  counts: {
    total: number;
    pelotas: number;
    regional: number;
    state: number;
  };
  source: {
    name: "INMET";
    feedUrl: string;
    portalUrl: string;
    fetchedAt: string;
  };
  error: string | null;
};

export type CppmetForecastItem = {
  day: string;
  summary: string;
  minimum: number | null;
  maximum: number | null;
  text: string;
};

export type CppmetForecast = {
  status: "live" | "unavailable";
  items: CppmetForecastItem[];
  fingerprint: string | null;
  source: {
    name: "CPPMet / UFPel";
    url: string;
    fetchedAt: string;
    lastModified: string | null;
  };
  error: string | null;
};

export type OfficialWeatherSources = {
  embrapa: EmbrapaObservation;
  inmet: InmetAlerts;
  cppmet: CppmetForecast;
  fetchedAt: string;
  degradedSources: Array<"embrapa" | "inmet" | "cppmet">;
};
