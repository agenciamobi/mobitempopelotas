import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Cloud,
  Eye,
  Info,
  Radio,
  ShieldCheck,
  Thermometer,
  Video,
  Wind,
} from "lucide-react";

import { absoluteUrl } from "@/lib/site-config";
import type { WeatherCameraData } from "@/lib/cameras/cameras.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import { CameraExplorer } from "./CameraExplorer";
import "./CameraPage.css";

type CameraPageProps = {
  cameraData: WeatherCameraData;
  weather: WeatherIntelligenceData;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function CameraPage({ cameraData, weather }: CameraPageProps) {
  const onlineCameras = cameraData.cameras.filter((camera) => camera.status === "online");
  const liveCameras = onlineCameras.filter((camera) => camera.broadcastStatus === "live");
  const replayCameras = onlineCameras.filter((camera) => camera.broadcastStatus === "replay");
  const current = weather.weather.current;
  const gustValues = [
    current?.windGust,
    ...weather.weather.hourly.map((hour) => hour.windGust),
  ].filter((value): value is number => value !== null && value !== undefined);
  const strongestGust = gustValues.length > 0 ? Math.max(...gustValues) : null;
  const selectedVideo =
    liveCameras[0] ?? replayCameras[0] ?? onlineCameras.find((camera) => camera.embedUrl);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Câmeras e pontos de observação de Pelotas",
    numberOfItems: cameraData.cameras.length,
    itemListElement: cameraData.cameras.map((camera, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: camera.name,
      description: camera.description,
      url: absoluteUrl(`/cameras-ao-vivo-pelotas#${camera.id}`),
    })),
  };

  const videoSchema =
    selectedVideo?.embedUrl && selectedVideo.publicUrl
      ? {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: selectedVideo.streamTitle ?? selectedVideo.name,
          description: selectedVideo.description,
          thumbnailUrl: selectedVideo.thumbnailUrl ? [selectedVideo.thumbnailUrl] : undefined,
          uploadDate: selectedVideo.publishedAt ?? undefined,
          embedUrl: selectedVideo.embedUrl,
          contentUrl: selectedVideo.publicUrl,
          isLiveBroadcast: selectedVideo.broadcastStatus === "live",
        }
      : null;

  return (
    <div className="camera-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c"),
        }}
      />
      {videoSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema).replace(/</g, "\\u003c") }}
        />
      ) : null}

      <header className="camera-hero">
        <div className="camera-hero-copy">
          <Link className="camera-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Tempo agora
          </Link>
          <p className="camera-kicker">Observação visual de Pelotas</p>
          <h1>Câmeras do Laranjal e pontos previstos da cidade</h1>
          <p className="camera-lead">
            Observe o céu, a visibilidade e as condições aparentes da orla. Quando não existe uma
            live ativa, o portal identifica claramente a gravação pública mais recente do canal.
          </p>
          <div className="camera-hero-meta">
            <span>
              <Camera aria-hidden="true" /> {cameraData.cameras.length} pontos cadastrados
            </span>
            <span>
              <Radio aria-hidden="true" /> {liveCameras.length} ao vivo agora
            </span>
            <span>
              <Video aria-hidden="true" /> {replayCameras.length} replay disponível
            </span>
          </div>
        </div>

        <aside className={`camera-hero-status ${liveCameras.length ? "is-live" : "is-replay"}`}>
          {liveCameras.length ? <Radio aria-hidden="true" /> : <Camera aria-hidden="true" />}
          <span>{liveCameras.length ? "Transmissões ao vivo" : "Imagens disponíveis"}</span>
          <strong>{liveCameras.length || onlineCameras.length}</strong>
          <p>
            {liveCameras.length
              ? liveCameras.length === 1
                ? "Um ponto está transmitindo ao vivo."
                : `${liveCameras.length} pontos estão transmitindo ao vivo.`
              : onlineCameras.length
                ? "A imagem disponível é replay ou fonte configurada, não uma live atual."
                : "Nenhuma câmera pública está disponível neste momento."}
          </p>
          <small>Consulta em {formatDateTime(cameraData.source.fetchedAt)}</small>
        </aside>
      </header>

      {cameraData.warning ? (
        <div className="camera-warning" role="status">
          <Info aria-hidden="true" />
          <div>
            <strong>Disponibilidade limitada</strong>
            <span>{cameraData.warning}</span>
          </div>
        </div>
      ) : null}

      <section className="camera-overview" aria-label="Resumo das câmeras e do tempo">
        <article>
          <Camera aria-hidden="true" />
          <span>Pontos cadastrados</span>
          <strong>{cameraData.cameras.length}</strong>
          <small>Laranjal, Centro e Canal São Gonçalo</small>
        </article>
        <article>
          <Radio aria-hidden="true" />
          <span>Disponíveis agora</span>
          <strong>{onlineCameras.length}</strong>
          <small>
            {liveCameras.length
              ? `${liveCameras.length} ao vivo`
              : replayCameras.length
                ? `${replayCameras.length} replay recente`
                : "Nenhuma fonte com player"}
          </small>
        </article>
        <article>
          <Thermometer aria-hidden="true" />
          <span>Temperatura agora</span>
          <strong>
            {current?.temperature === null || !current ? "—" : `${current.temperature} °C`}
          </strong>
          <small>{current?.condition ?? "Condição em atualização"}</small>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Maior rajada prevista</span>
          <strong>{strongestGust === null ? "—" : `${strongestGust} km/h`}</strong>
          <small>Condição prevista para Pelotas</small>
        </article>
      </section>

      <CameraExplorer cameras={cameraData.cameras} />

      <section className="camera-guidance" aria-labelledby="camera-guidance-title">
        <div className="camera-guidance-heading">
          <div>
            <p className="camera-kicker">Interpretação responsável</p>
            <h2 id="camera-guidance-title">A imagem mostra o local, mas não mede o tempo</h2>
          </div>
          <p>
            Vídeo ajuda a perceber neblina, nuvens e chuva aparente, mas não substitui instrumentos,
            previsão meteorológica ou alertas oficiais.
          </p>
        </div>

        <div className="camera-guidance-grid">
          <article>
            <Eye aria-hidden="true" />
            <span>01</span>
            <h3>Observe a visibilidade</h3>
            <p>
              Neblina, chuva intensa e nuvens baixas podem esconder o horizonte e reduzir o
              contraste.
            </p>
          </article>
          <article>
            <Cloud aria-hidden="true" />
            <span>02</span>
            <h3>Compare com a previsão</h3>
            <p>
              A câmera cobre um único enquadramento. Consulte também chuva, vento e temperatura.
            </p>
          </article>
          <article>
            <Radio aria-hidden="true" />
            <span>03</span>
            <h3>Confira o estado</h3>
            <p>
              “Ao vivo” e “última transmissão” são situações diferentes e aparecem identificadas.
            </p>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" />
            <span>04</span>
            <h3>Use alertas oficiais</h3>
            <p>Em situação de risco, siga INMET, Defesa Civil e demais autoridades responsáveis.</p>
          </article>
        </div>

        <div className="camera-responsibility-note">
          <AlertTriangle aria-hidden="true" />
          <p>
            As imagens pertencem aos responsáveis indicados em cada câmera e podem ficar
            indisponíveis sem aviso. O Tempo Pelotas não controla a transmissão nem garante
            continuidade do serviço.
          </p>
        </div>
      </section>

      <section className="camera-actions" aria-label="Ações relacionadas às câmeras">
        <div>
          <p className="camera-kicker">Dados complementares</p>
          <h2>Compare a imagem com medições e alertas</h2>
        </div>
        <div>
          <Link className="camera-primary-action" to="/tempo-hoje-pelotas">
            Previsão de hoje <ArrowRight aria-hidden="true" />
          </Link>
          <Link className="camera-secondary-action" to="/chuva-em-pelotas">
            Chuva em Pelotas
          </Link>
          <Link className="camera-secondary-action" to="/alertas">
            Alertas oficiais
          </Link>
        </div>
      </section>
    </div>
  );
}
