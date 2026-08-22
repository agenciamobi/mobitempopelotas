import type { RedemetImageFrame } from "./redemet.types";

const PELOTAS_COORDINATES = { latitude: -31.7654, longitude: -52.3376 } as const;
const MINIMUM_USEFUL_SOLAR_ELEVATION_DEGREES = -3;
const NEXT_WINDOW_STEP_MINUTES = 5;
const NEXT_WINDOW_HORIZON_HOURS = 36;

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

export function solarElevationDegrees(
  date: Date,
  latitude = PELOTAS_COORDINATES.latitude,
  longitude = PELOTAS_COORDINATES.longitude,
) {
  const julianDay = date.getTime() / 86_400_000 + 2_440_587.5;
  const daysSinceJ2000 = julianDay - 2_451_545;
  const meanLongitude = normalizeDegrees(280.46 + 0.9856474 * daysSinceJ2000);
  const meanAnomaly = toRadians(normalizeDegrees(357.528 + 0.9856003 * daysSinceJ2000));
  const eclipticLongitude = toRadians(
    normalizeDegrees(
      meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly),
    ),
  );
  const obliquity = toRadians(23.439 - 0.0000004 * daysSinceJ2000);
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const greenwichSiderealHours =
    ((18.697374558 + 24.06570982441908 * daysSinceJ2000) % 24 + 24) % 24;
  const localSiderealAngle = toRadians(normalizeDegrees(greenwichSiderealHours * 15 + longitude));
  const hourAngle = localSiderealAngle - rightAscension;
  const latitudeRadians = toRadians(latitude);
  const elevation = Math.asin(
    Math.sin(latitudeRadians) * Math.sin(declination) +
      Math.cos(latitudeRadians) * Math.cos(declination) * Math.cos(hourAngle),
  );

  return toDegrees(elevation);
}

export function isUsefulVisibleSatelliteTimestamp(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return solarElevationDegrees(date) >= MINIMUM_USEFUL_SOLAR_ELEVATION_DEGREES;
}

export function nextUsefulVisibleSatelliteTimestamp(from = new Date()) {
  if (Number.isNaN(from.getTime())) return null;

  const start = from.getTime();
  const stepMs = NEXT_WINDOW_STEP_MINUTES * 60_000;
  const horizonMs = NEXT_WINDOW_HORIZON_HOURS * 60 * 60_000;
  const currentlyUseful =
    solarElevationDegrees(from) >= MINIMUM_USEFUL_SOLAR_ELEVATION_DEGREES;

  if (currentlyUseful) return from.toISOString();

  for (let offset = stepMs; offset <= horizonMs; offset += stepMs) {
    const candidate = new Date(start + offset);
    if (solarElevationDegrees(candidate) >= MINIMUM_USEFUL_SOLAR_ELEVATION_DEGREES) {
      return candidate.toISOString();
    }
  }

  return null;
}

export function keepUsefulVisibleSatelliteFrames(
  frames: RedemetImageFrame[],
  requestedFrames: number,
) {
  return frames
    .filter((frame) => isUsefulVisibleSatelliteTimestamp(frame.observedAt))
    .slice(-Math.max(1, requestedFrames));
}
