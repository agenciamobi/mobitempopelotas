export type FrostStationType = "CONVENCIONAL" | "AUTOMATICA";

export type FrostIntensity = "strong" | "moderate" | "weak" | "possible" | "undefined";

export type FrostObservation = {
  id: string;
  state: string;
  date: string;
  stationCode: string;
  stationName: string;
  latitude: number;
  longitude: number;
  minimumTemperature: number | null;
  intensity: FrostIntensity;
  intensityLabel: string;
};

export type FrostStation = {
  stationCode: string;
  stationName: string;
  state: string;
  latitude: number;
  longitude: number;
  latest: FrostObservation;
  observations: FrostObservation[];
};

export type FrostMapData = {
  status: "live" | "unavailable";
  filters: {
    startDate: string;
    endDate: string;
    days: number;
    stationType: FrostStationType;
    state: string;
  };
  summary: {
    stations: number;
    observations: number;
    lowestTemperature: number | null;
    strong: number;
    moderate: number;
    weak: number;
    possible: number;
    undefined: number;
  };
  stations: FrostStation[];
  source: {
    name: "INMET";
    endpoint: string;
    portalUrl: string;
    fetchedAt: string;
  };
  message: string | null;
};
