export type PublicRouteEntry = {
  path: string;
  changeFrequency: "hourly" | "daily" | "weekly" | "monthly";
  priority: number;
};

export const PUBLIC_ROUTES: PublicRouteEntry[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/tempo-hoje-pelotas", changeFrequency: "hourly", priority: 0.9 },
  { path: "/tempo-amanha-pelotas", changeFrequency: "hourly", priority: 0.9 },
  { path: "/previsao-7-dias-pelotas", changeFrequency: "daily", priority: 0.9 },
  { path: "/chuva-em-pelotas", changeFrequency: "hourly", priority: 0.8 },
  { path: "/vento-em-pelotas", changeFrequency: "hourly", priority: 0.8 },
  { path: "/alertas", changeFrequency: "hourly", priority: 0.9 },
  { path: "/radar-e-satelite-pelotas", changeFrequency: "hourly", priority: 0.8 },
  { path: "/situacao-hidrologica-pelotas", changeFrequency: "hourly", priority: 0.8 },
  { path: "/nivel-da-lagoa-dos-patos-laranjal", changeFrequency: "hourly", priority: 0.8 },
  { path: "/estacao-embrapa-pelotas", changeFrequency: "hourly", priority: 0.7 },
  { path: "/historico-climatico-pelotas", changeFrequency: "daily", priority: 0.7 },
  { path: "/cameras-ao-vivo-pelotas", changeFrequency: "hourly", priority: 0.7 },
  { path: "/metodologia", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacidade-e-dados", changeFrequency: "monthly", priority: 0.5 },
];
