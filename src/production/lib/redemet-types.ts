export type RedemetBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type RedemetImageFrame = {
  id: string;
  label: string;
  observedAt: string | null;
  imageUrl: string;
  bounds: RedemetBounds;
};

export type RedemetImageLayerResponse = {
  configured: boolean;
  available: boolean;
  provider: "REDEMET / DECEA";
  product: string;
  sourceLabel: string;
  frames: RedemetImageFrame[];
  currentIndex: number;
  updatedAt: string;
  error: string | null;
};

export type RedemetStormPoint = {
  latitude: number;
  longitude: number;
};

export type RedemetStormFrame = {
  id: string;
  label: string;
  observedAt: string | null;
  points: RedemetStormPoint[];
};

export type RedemetStormLayerResponse = {
  configured: boolean;
  available: boolean;
  provider: "REDEMET / DECEA";
  product: "STSC — ocorrências de trovoada";
  sourceLabel: string;
  frames: RedemetStormFrame[];
  currentIndex: number;
  updatedAt: string;
  error: string | null;
};

export type RedemetSatelliteType = "realcada" | "ir" | "vis";
