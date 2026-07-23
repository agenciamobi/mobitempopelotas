export type LaranjalLevelStatus = "live" | "stale" | "unavailable";

export type LaranjalLevelPoint = {
  timestamp: string;
  level: number;
};

export type LaranjalLevelData = {
  status: LaranjalLevelStatus;
  currentLevel: number | null;
  updatedAt: string | null;
  trendCmPerHour: number | null;
  change1hCm: number | null;
  change6hCm: number | null;
  change24hCm: number | null;
  periodAverage: number | null;
  periodMinimum: number | null;
  periodMaximum: number | null;
  series: LaranjalLevelPoint[];
  source: {
    name: string;
    station: string;
    location: string;
    url: string;
    fetchedAt: string;
  };
  error: string | null;
};
