const RADAR_STEP_SECONDS = 10 * 60;
const RADAR_PROCESSING_DELAY_SECONDS = 5 * 60;
const HISTORY_STEPS = 6;
const FORECAST_STEPS = 12;
const TIMEZONE = "America/Sao_Paulo";

export type RadarFrameKind = "observed" | "forecast";

export type RadarFrame = {
  timestamp: number;
  label: string;
  kind: RadarFrameKind;
};

export type RadarStatus = {
  configured: boolean;
  available: boolean;
  provider: "OpenWeather";
  product: "Global Precipitation Map Forecast";
  frames: RadarFrame[];
  currentIndex: number;
  updatedAt: string;
  error: string | null;
};

export const RADAR_MIN_ZOOM = 3;
export const RADAR_MAX_ZOOM = 7;
export const SATELLITE_TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const SATELLITE_ATTRIBUTION =
  'Powered by <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> | Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
export const RADAR_ATTRIBUTION =
  '<a href="https://openweathermap.org" target="_blank" rel="noreferrer">OpenWeather</a>';

export function roundToRadarStep(timestampSeconds: number) {
  return Math.floor(timestampSeconds / RADAR_STEP_SECONDS) * RADAR_STEP_SECONDS;
}

function getLatestCompleteRadarTimestamp(now = Date.now()) {
  const delayedTimestamp = Math.floor(now / 1000) - RADAR_PROCESSING_DELAY_SECONDS;
  return roundToRadarStep(delayedTimestamp);
}

function formatFrameTime(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

export function buildRadarFrames(now = Date.now()) {
  const currentTimestamp = getLatestCompleteRadarTimestamp(now);
  const frames: RadarFrame[] = [];

  for (let offset = -HISTORY_STEPS; offset <= FORECAST_STEPS; offset += 1) {
    const timestamp = currentTimestamp + offset * RADAR_STEP_SECONDS;

    frames.push({
      timestamp,
      label: formatFrameTime(timestamp),
      kind: offset <= 0 ? "observed" : "forecast",
    });
  }

  return {
    frames,
    currentIndex: HISTORY_STEPS,
    currentTimestamp,
  };
}

export function isAllowedRadarTileRequest(
  timestamp: number,
  zoom: number,
  x: number,
  y: number,
  now = Date.now(),
) {
  if (!Number.isInteger(timestamp) || timestamp % RADAR_STEP_SECONDS !== 0) return false;
  if (!Number.isInteger(zoom) || zoom < RADAR_MIN_ZOOM || zoom > RADAR_MAX_ZOOM) return false;

  const maxCoordinate = 2 ** zoom;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (x < 0 || y < 0 || x >= maxCoordinate || y >= maxCoordinate) return false;

  const currentTimestamp = getLatestCompleteRadarTimestamp(now);
  const minimumTimestamp = currentTimestamp - HISTORY_STEPS * RADAR_STEP_SECONDS;
  const maximumTimestamp = currentTimestamp + FORECAST_STEPS * RADAR_STEP_SECONDS;

  return timestamp >= minimumTimestamp && timestamp <= maximumTimestamp;
}

export function buildOpenWeatherRadarUrl(
  apiKey: string,
  timestamp: number,
  zoom: number,
  x: number,
  y: number,
) {
  const params = new URLSearchParams({
    appid: apiKey,
    tm: String(timestamp),
  });

  return `https://maps.openweathermap.org/maps/2.0/radar/forecast/${zoom}/${x}/${y}?${params}`;
}
