export const WEATHER_SOURCE_REQUEST_TIMEOUT_MS = {
  embrapa: 12_000,
  inmet: 12_000,
  cppmet: 8_000,
} as const;

export const OFFICIAL_SOURCE_DEADLINE_MS = {
  embrapa: 13_000,
  inmet: 13_000,
  cppmet: 9_000,
} as const;
