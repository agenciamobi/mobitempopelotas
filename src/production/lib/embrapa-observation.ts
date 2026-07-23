export type TimedObservation = { value: number | null; time: string | null };

export type EmbrapaObservationData = {
  status: "live" | "partial" | "unavailable";
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
    dewPointMin: TimedObservation;
    dewPointMax: TimedObservation;
    windSpeedMax: TimedObservation;
  };
  accumulated: {
    rainDaily: number | null;
    rainMonthly: number | null;
    rainAnnual: number | null;
    evapotranspirationDaily: number | null;
    evapotranspirationMonthly: number | null;
    evapotranspirationAnnual: number | null;
  };
  source: {
    name: string;
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
