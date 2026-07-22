import { useMemo, useState } from "react";
import { Camera, CirclePlay, Clock3, ExternalLink, MapPin, Radio, VideoOff } from "lucide-react";

import type { WeatherCamera } from "@/lib/cameras/cameras.types";

type CameraExplorerProps = {
  cameras: WeatherCamera[];
};

function statusLabel(camera: WeatherCamera) {
  if (camera.status !== "online") return "Ainda não disponível";
  if (camera.broadcastStatus === "live") return "Ao vivo agora";
  if (camera.broadcastStatus === "replay") return "Última transmissão";
  return "Imagem disponível";
}

function formatPublishedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function CameraExplorer({ cameras }: CameraExplorerProps) {
  const initialCamera = useMemo(
    () => cameras.find((camera) => camera.status === "online") ?? cameras[0],
    [cameras],
  );
  const [selectedId, setSelectedId] = useState(initialCamera?.id ?? "");
  const [playerOpen, setPlayerOpen] = useState(false);
  const selectedCamera = cameras.find((camera) => camera.id === selectedId) ?? initialCamera;

  if (!selectedCamera) return null;

  const selectCamera = (camera: WeatherCamera) => {
    setSelectedId(camera.id);
    setPlayerOpen(false);
  };
  const publishedAt = formatPublishedAt(selectedCamera.publishedAt);
  const launchLabel =
    selectedCamera.broadcastStatus === "live"
      ? "Abrir transmissão ao vivo"
      : selectedCamera.broadcastStatus === "replay"
        ? "Assistir última transmissão"
        : "Abrir câmera";

  return (
    <section className="camera-explorer" aria-labelledby="camera-explorer-title">
      <div className="camera-explorer-heading">
        <div>
          <p className="camera-kicker">Pontos de observação</p>
          <h2 id="camera-explorer-title">Escolha um local para acompanhar</h2>
          <p>
            O estado informa se a imagem está ao vivo, corresponde ao replay mais recente ou ainda
            não possui uma fonte pública configurada.
          </p>
        </div>
        <div className="camera-current-selection" aria-live="polite">
          <span className={`camera-state camera-state-${selectedCamera.status}`}>
            {selectedCamera.broadcastStatus === "live" ? (
              <Radio aria-hidden="true" />
            ) : selectedCamera.status === "online" ? (
              <Clock3 aria-hidden="true" />
            ) : (
              <VideoOff aria-hidden="true" />
            )}
            {statusLabel(selectedCamera)}
          </span>
          <strong>{selectedCamera.shortName}</strong>
          <small>{selectedCamera.streamTitle ?? selectedCamera.observation}</small>
        </div>
      </div>

      <div className="camera-selector" role="group" aria-label="Escolha uma câmera">
        {cameras.map((camera) => {
          const selected = camera.id === selectedCamera.id;
          return (
            <button
              type="button"
              aria-pressed={selected}
              className={selected ? "is-active" : undefined}
              key={camera.id}
              onClick={() => selectCamera(camera)}
            >
              <span>{camera.shortName}</span>
              <small>{statusLabel(camera)}</small>
            </button>
          );
        })}
      </div>

      <div className="camera-stage">
        <div className="camera-frame">
          {selectedCamera.status === "online" && selectedCamera.embedUrl ? (
            playerOpen ? (
              <iframe
                src={selectedCamera.embedUrl}
                title={selectedCamera.streamTitle ?? selectedCamera.name}
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <button
                className="camera-launch"
                type="button"
                onClick={() => setPlayerOpen(true)}
                aria-label={`${launchLabel}: ${selectedCamera.name}`}
              >
                {selectedCamera.thumbnailUrl ? (
                  <img
                    src={selectedCamera.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <span className="camera-launch-overlay" aria-hidden="true" />
                <span className="camera-launch-icon">
                  <CirclePlay aria-hidden="true" />
                </span>
                <strong>{launchLabel}</strong>
                <small>
                  {selectedCamera.broadcastStatus === "live"
                    ? "Transmissão ao vivo no YouTube"
                    : selectedCamera.broadcastStatus === "replay"
                      ? "Gravação pública mais recente do canal"
                      : "A reprodução começa somente após o clique"}
                </small>
              </button>
            )
          ) : (
            <div className="camera-placeholder" role="status">
              <span className="camera-placeholder-icon">
                <Camera aria-hidden="true" />
              </span>
              <strong>Câmera ainda não disponível</strong>
              <p>Este ponto será exibido quando houver uma fonte pública com imagem estável.</p>
            </div>
          )}

          <div className="camera-frame-label">
            <span>{selectedCamera.area}</span>
            <small>{selectedCamera.provider ?? "Tempo Pelotas"}</small>
          </div>
        </div>

        <aside className="camera-details" aria-label="Informações da câmera selecionada">
          <p className="camera-kicker">Local escolhido</p>
          <h3>{selectedCamera.name}</h3>
          <p>{selectedCamera.description}</p>

          {selectedCamera.streamTitle ? (
            <div className="camera-stream-title">
              <span>Transmissão selecionada</span>
              <strong>{selectedCamera.streamTitle}</strong>
            </div>
          ) : null}

          <dl>
            <div>
              <dt>Local</dt>
              <dd>
                <MapPin aria-hidden="true" /> {selectedCamera.area}
              </dd>
            </div>
            <div>
              <dt>Posição aproximada</dt>
              <dd>
                {selectedCamera.latitude.toFixed(4)}, {selectedCamera.longitude.toFixed(4)}
              </dd>
            </div>
            <div>
              <dt>Disponibilidade</dt>
              <dd>{statusLabel(selectedCamera)}</dd>
            </div>
            {publishedAt ? (
              <div>
                <dt>Publicada em</dt>
                <dd>{publishedAt}</dd>
              </div>
            ) : null}
          </dl>

          {selectedCamera.publicUrl ? (
            <a href={selectedCamera.publicUrl} target="_blank" rel="noreferrer">
              Abrir no provedor <ExternalLink aria-hidden="true" />
            </a>
          ) : null}
        </aside>
      </div>

      <div className="camera-location-list" aria-label="Todos os pontos de observação">
        {cameras.map((camera) => (
          <button
            id={camera.id}
            type="button"
            aria-pressed={camera.id === selectedCamera.id}
            aria-label={`${camera.name}. ${statusLabel(camera)}. Selecionar ponto.`}
            className={camera.id === selectedCamera.id ? "is-active" : undefined}
            key={camera.id}
            onClick={() => selectCamera(camera)}
          >
            <span className="camera-location-icon">
              <Camera aria-hidden="true" />
            </span>
            <span>
              <strong>{camera.shortName}</strong>
              <small>{camera.area}</small>
            </span>
            <i
              className={`camera-location-state camera-location-state-${camera.status}`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
