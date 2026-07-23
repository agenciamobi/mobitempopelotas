import { Link } from "@tanstack/react-router";
import { ArrowRight, CloudLightning, Radar, Satellite } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  RedemetImageLayerResponse,
  RedemetOverview,
} from "@/lib/redemet/redemet.types";

import "./HomeRegionalObservation.css";

type ObservationMode = "radar" | "satellite";

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initialMode(data: RedemetOverview): ObservationMode {
  if (data.radar.available) return "radar";
  if (data.satellite.available) return "satellite";
  return "radar";
}

function layerStatus(layer: RedemetImageLayerResponse) {
  if (!layer.configured) return "Integração aguardando configuração";
  if (layer.available) return "Quadro mais recente disponível";
  return "Fonte temporariamente indisponível";
}

export function HomeRegionalObservation({ data }: { data: RedemetOverview }) {
  const [mode, setMode] = useState<ObservationMode>(() => initialMode(data));

  useEffect(() => {
    if (mode === "radar" && !data.radar.available && data.satellite.available) {
      setMode("satellite");
    }
  }, [data.radar.available, data.satellite.available, mode]);

  const layer = mode === "radar" ? data.radar : data.satellite;
  const frame = layer.frames[layer.currentIndex] ?? layer.frames.at(-1) ?? null;
  const latestStormFrame = data.storms.frames[data.storms.currentIndex] ?? data.storms.frames.at(-1);
  const stormCount = latestStormFrame?.points.length ?? null;
  const availableProducts = useMemo(
    () => [data.radar, data.satellite, data.storms].filter((source) => source.available).length,
    [data],
  );

  return (
    <section className="home-regional-observation" aria-labelledby="home-regional-title">
      <div className="home-regional-copy">
        <p>Radar e satélite</p>
        <h2 id="home-regional-title">Acompanhe a chuva e as nuvens na região</h2>
        <span>
          Quadros da REDEMET/DECEA ajudam a observar a evolução recente da precipitação,
          nebulosidade e trovoadas próximas de Pelotas.
        </span>

        <dl>
          <div>
            <dt>Produtos respondendo</dt>
            <dd>{availableProducts}/3</dd>
          </div>
          <div>
            <dt>Trovoadas no último quadro</dt>
            <dd>{data.storms.available && stormCount !== null ? stormCount : "—"}</dd>
          </div>
        </dl>

        <small>
          As imagens são observação complementar. Para segurança, consulte os alertas oficiais.
        </small>

        <Link to="/radar-e-satelite-pelotas">
          Ver radar, satélite e trovoadas
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className="home-regional-visualization">
        <div className="home-regional-toolbar">
          <div role="group" aria-label="Produto meteorológico exibido">
            <button
              type="button"
              className={mode === "radar" ? "is-active" : undefined}
              aria-pressed={mode === "radar"}
              onClick={() => setMode("radar")}
            >
              <Radar aria-hidden="true" />
              Radar
            </button>
            <button
              type="button"
              className={mode === "satellite" ? "is-active" : undefined}
              aria-pressed={mode === "satellite"}
              onClick={() => setMode("satellite")}
            >
              <Satellite aria-hidden="true" />
              Satélite
            </button>
          </div>

          <span className={layer.available ? "is-live" : "is-unavailable"}>
            <i aria-hidden="true" />
            {layerStatus(layer)}
          </span>
        </div>

        {layer.available && frame ? (
          <figure className="home-regional-frame">
            <img
              src={frame.imageUrl}
              alt={`${layer.product}, quadro observado em ${formatDateTime(frame.observedAt)}`}
              loading="lazy"
            />
            <figcaption>
              <div>
                <strong>{layer.product}</strong>
                <span>{layer.sourceLabel}</span>
              </div>
              <time dateTime={frame.observedAt ?? undefined}>{formatDateTime(frame.observedAt)}</time>
            </figcaption>
          </figure>
        ) : (
          <div className="home-regional-empty" role="status">
            {mode === "radar" ? <Radar aria-hidden="true" /> : <Satellite aria-hidden="true" />}
            <strong>
              {layer.configured
                ? "O produto não entregou um quadro utilizável nesta consulta."
                : "A estrutura está pronta e aguarda a configuração da REDEMET no servidor."}
            </strong>
            <span>{layer.error}</span>
          </div>
        )}

        <div className="home-regional-storm-note">
          <CloudLightning aria-hidden="true" />
          <div>
            <strong>STSC — trovoadas</strong>
            <span>
              {data.storms.available && latestStormFrame
                ? `${stormCount ?? 0} ocorrência${stormCount === 1 ? "" : "s"} no quadro de ${formatDateTime(latestStormFrame.observedAt)}.`
                : data.storms.error || "Monitoramento complementar indisponível."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
