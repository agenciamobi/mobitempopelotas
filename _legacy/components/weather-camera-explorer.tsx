"use client";

import { useMemo, useState } from "react";
import type { WeatherCamera } from "@/lib/weather-cameras";

type WeatherCameraExplorerProps = {
  cameras: WeatherCamera[];
};

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6" width="14" height="12" rx="3" />
      <path d="m17 10 4-2v8l-4-2M7.5 4.5h5" />
      <circle cx="10" cy="12" r="2.7" />
    </svg>
  );
}

export function WeatherCameraExplorer({ cameras }: WeatherCameraExplorerProps) {
  const initialCamera = useMemo(
    () => cameras.find((camera) => camera.status === "online") ?? cameras[0],
    [cameras],
  );
  const hasOnlineCamera = cameras.some((camera) => camera.status === "online");
  const [selectedId, setSelectedId] = useState(initialCamera?.id ?? "");
  const [playerOpen, setPlayerOpen] = useState(false);
  const selectedCamera =
    cameras.find((camera) => camera.id === selectedId) ?? initialCamera;

  if (!selectedCamera) return null;

  const selectCamera = (camera: WeatherCamera) => {
    setSelectedId(camera.id);
    setPlayerOpen(false);
  };

  return (
    <section className="camera-explorer" aria-labelledby="camera-explorer-title">
      <div className="camera-explorer-heading">
        <div>
          <span className="eyebrow">Veja diferentes pontos da cidade</span>
          <h2 id="camera-explorer-title">
            {hasOnlineCamera ? "Acompanhe Pelotas pelas câmeras" : "Câmeras de Pelotas"}
          </h2>
          <p>
            {hasOnlineCamera
              ? "Escolha um local para observar o céu, a visibilidade e a presença de chuva. A câmera será aberta quando você tocar no botão."
              : "As câmeras ainda não estão disponíveis. Os locais previstos são Laranjal, Centro e Canal São Gonçalo."}
          </p>
        </div>
        <div className="camera-live-summary" aria-live="polite">
          <span
            className={`camera-status camera-status--${selectedCamera.status}`}
          >
            <i aria-hidden="true" />
            {selectedCamera.status === "online" ? "Disponível" : "Ainda não disponível"}
          </span>
          <strong>{selectedCamera.shortName}</strong>
          <small>{selectedCamera.observation}</small>
        </div>
      </div>

      <div className="camera-selector" role="tablist" aria-label="Escolha uma câmera">
        {cameras.map((camera) => {
          const isSelected = camera.id === selectedCamera.id;

          return (
            <button
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={isSelected ? "is-active" : undefined}
              key={camera.id}
              onClick={() => selectCamera(camera)}
            >
              <span>{camera.shortName}</span>
              <small>{camera.status === "online" ? "Ao vivo" : "Em breve"}</small>
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
                title={selectedCamera.name}
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
                aria-label={`Abrir transmissão da ${selectedCamera.name}`}
              >
                <span className="camera-launch-icon">
                  <CameraIcon />
                </span>
                <strong>Abrir câmera</strong>
                <small>Toque para começar a assistir</small>
              </button>
            )
          ) : (
            <div className="camera-placeholder" role="status">
              <span className="camera-placeholder-icon">
                <CameraIcon />
              </span>
              <strong>Câmera ainda não disponível</strong>
              <p>
                Este local será exibido quando houver uma câmera pública com imagem estável.
              </p>
            </div>
          )}
          <div className="camera-frame-label">
            <span>{selectedCamera.area}</span>
            <small>{selectedCamera.provider ?? "TEMPO Pelotas"}</small>
          </div>
        </div>

        <aside className="camera-details" aria-label="Informações da câmera escolhida">
          <span className="eyebrow">Local escolhido</span>
          <h3>{selectedCamera.name}</h3>
          <p>{selectedCamera.description}</p>
          <dl>
            <div>
              <dt>Local</dt>
              <dd>{selectedCamera.area}</dd>
            </div>
            <div>
              <dt>Posição</dt>
              <dd>
                {selectedCamera.latitude.toFixed(4)}, {selectedCamera.longitude.toFixed(4)}
              </dd>
            </div>
            <div>
              <dt>Disponibilidade</dt>
              <dd>{selectedCamera.status === "online" ? "Câmera disponível" : "Câmera em breve"}</dd>
            </div>
          </dl>
          {selectedCamera.publicUrl ? (
            <a
              className="camera-external-link"
              href={selectedCamera.publicUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir página da câmera
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </aside>
      </div>

      <div className="camera-list" aria-label="Outras câmeras">
        {cameras.map((camera) => {
          const statusLabel =
            camera.status === "online" ? "Disponível" : "Em breve";

          return (
            <button
              id={camera.id}
              type="button"
              aria-label={`${camera.name}. ${statusLabel}. Selecionar ponto.`}
              className={camera.id === selectedCamera.id ? "is-active" : undefined}
              key={camera.id}
              onClick={() => selectCamera(camera)}
            >
              <span className="camera-list-icon">
                <CameraIcon />
              </span>
              <span>
                <strong>{camera.shortName}</strong>
                <small>{camera.area}</small>
              </span>
              <i
                className={`camera-list-state camera-list-state--${camera.status}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
