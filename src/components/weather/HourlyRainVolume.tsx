import { useEffect, useState } from "react";

type HourlyVolumeResponse = {
  status: "live" | "unavailable";
  source: string;
  hours: Array<{ time: string; precipitationMm: number | null }>;
};

let sharedRequest: Promise<HourlyVolumeResponse> | null = null;

function loadHourlyVolumes() {
  sharedRequest ??= fetch("/api/weather/hourly-precipitation", {
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Volume horário respondeu com status ${response.status}`);
      return response.json() as Promise<HourlyVolumeResponse>;
    })
    .catch(() => ({ status: "unavailable" as const, source: "Open-Meteo", hours: [] }));

  return sharedRequest;
}

function formatVolume(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value);
}

export function HourlyRainVolume({ index }: { index: number }) {
  const [volume, setVolume] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void loadHourlyVolumes().then((payload) => {
      if (active) setVolume(payload.hours[index]?.precipitationMm ?? null);
    });
    return () => {
      active = false;
    };
  }, [index]);

  if (volume === undefined) return <small>Volume em atualização</small>;
  if (volume === null) return <small>Volume indisponível</small>;

  return <small>{formatVolume(volume)} mm previstos</small>;
}
