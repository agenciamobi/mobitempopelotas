import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CirclePlay,
  Clock3,
  CloudRain,
  ExternalLink,
  Eye,
  Gauge,
  Info,
  MapPin,
  Radio,
  Satellite,
  ShieldCheck,
  Thermometer,
  Video,
  VideoOff,
  Wind,
} from "lucide-react";

import type { WeatherCamera, WeatherCameraData } from "@/lib/cameras/cameras.types";
import { absoluteUrl } from "@/lib/site-config";
import type { WeatherSourceKey } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./CameraPageV2.css";

type CameraPageProps = {
  cameraData: WeatherCameraData;
  weather: WeatherIntelligenceData;
};

type CameraPresentationState = "live" | "replay" | "configured" | "preparing";

const stateCopy: Record<
  CameraPresentationState,
  { label: string; title: string; description: string }
> = {
  live: {
    label: "Ao vivo agora",
    title: "Transmissão ao vivo",
    description: "O serviço responsável informou que a transmissão está ao vivo nesta consulta.",
  },
  replay: {
    label: "Última transmissão",
    title: "Gravação anterior disponível",
    description: "O vídeo mostra a gravação pública mais recente encontrada no canal.",
  },
  configured: {
    label: "Vídeo disponível",
    title: "Horário da imagem não confirmado",
    description:
      "O vídeo pode ser aberto, mas não foi possível confirmar se a imagem é ao vivo ou gravada.",
  },
  preparing: {
    label: "Em preparação",
    title: "Imagem ainda não disponível",
    description: "O ponto está cadastrado, mas ainda não possui uma transmissão pública estável.",
  },
};

const sourceNames: Record<WeatherSourceKey, string> = {
  embrapa: "Embrapa",
  inmet: "INMET",
  cppmet: "CPPMet/UFPel",
  "open-meteo": "Open-Meteo",
  "met-norway": "MET Norway",
};

function cameraState(camera: WeatherCamera): CameraPresentationState {
  if (camera.status !== "online" || !camera.embedUrl) return "preparing";
  if (camera.broadcastStatus === "live") return "live";
  if (camera.broadcastStatus === "replay") return "replay";
  return "configured";
}

function sourceLabel(camera: WeatherCamera) {
  if (camera.source === "api") return "Serviço responsável pela transmissão";
  if (camera.source === "public-page") return "Página pública do canal";
  if (camera.source === "rss") return "Feed público do canal";
  if (camera.source === "manual") return "Vídeo adicionado pela equipe do portal";
  if (camera.source === "configured") return "Vídeo configurado no Tempo Pelotas";
  return "Origem ainda não informada";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function relativePublication(value: string | null, referenceTime: string) {
  if (!value) return "Data de publicação não informada";
  const date = new Date(value);
  const reference = new Date(referenceTime);
  if (Number.isNaN(date.getTime()) || Number.isNaN(reference.getTime())) {
    return "Data de publicação não informada";
  }
  const minutes = Math.max(0, Math.round((reference.getTime() - date.getTime()) / 60_000));
  if (minutes < 60) return `Publicado há cerca de ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Publicado há cerca de ${hours} h`;
  return `Publicado há cerca de ${Math.floor(hours / 24)} dias`;
}

function formatNumber(value: number | null | undefined, suffix: string, digits = 0) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value)}${suffix}`;
}

function cameraCounts(cameras: WeatherCamera[]) {
  return cameras.reduce(
    (counts, camera) => {
      counts[cameraState(camera)] += 1;
      return counts;
    },
    { live: 0, replay: 0, configured: 0, preparing: 0 } as Record<CameraPresentationState, number>,
  );
}

function liveSummary(count: number) {
  if (count === 0) return "Nenhuma transmissão ao vivo confirmada";
  if (count === 1) return "1 transmissão ao vivo";
  return `${count} transmissões ao vivo`;
}

function stateIcon(state: CameraPresentationState) {
  if (state === "live") return Radio;
  if (state === "replay") return Clock3;
  if (state === "configured") return Video;
  return VideoOff;
}

function launchLabel(camera: WeatherCamera) {
  const state = cameraState(camera);
  if (state === "live") return "Abrir transmissão ao vivo";
  if (state === "replay") return "Assistir à última transmissão";
  if (state === "configured") return "Abrir vídeo";
  return "Vídeo indisponível";
}

function selectedInitialCamera(cameras: WeatherCamera[]) {
  return (
    cameras.find((camera) => cameraState(camera) === "live") ??
    cameras.find((camera) => cameraState(camera) === "replay") ??
    cameras.find((camera) => cameraState(camera) === "configured") ??
    cameras[0]
  );
}

export function CameraPageHero({ cameraData }: Pick<CameraPageProps, "cameraData">) {
  const counts = cameraCounts(cameraData.cameras);
  const featured = selectedInitialCamera(cameraData.cameras);
  const featuredState = featured ? cameraState(featured) : "preparing";
  const FeaturedIcon = stateIcon(featuredState);

  return (
    <section className="camera-v2-hero" aria-labelledby="camera-v2-hero-title">
      <div className="camera-v2-hero__content">
        <span className="camera-v2-eyebrow">Imagens do Laranjal e de Pelotas</span>
        <h1 id="camera-v2-hero-title">Câmeras do Laranjal e de Pelotas.</h1>
        <p>
          Veja o céu, a visibilidade e a superfície da Lagoa em pontos específicos. Cada câmera
          informa se a imagem está ao vivo, é uma gravação anterior ou ainda não tem horário confirmado.
        </p>
        <div className="camera-v2-hero__actions">
          <a href="#explorador-de-cameras">
            Escolher uma câmera <ArrowRight aria-hidden="true" />
          </a>
          <Link to="/radar-e-satelite-pelotas">Comparar com radar</Link>
        </div>
      </div>
      <aside className={`camera-v2-featured is-${featuredState}`} aria-label="Câmera em destaque">
        <header>
          <span>
            <FeaturedIcon aria-hidden="true" />
            {stateCopy[featuredState].label}
          </span>
          <small>Atualizado em {formatDateTime(cameraData.source.fetchedAt)}</small>
        </header>
        <div>
          <span>Câmera em destaque</span>
          <strong>{featured?.shortName ?? "Nenhum ponto"}</strong>
          <p>
            {featured ? stateCopy[featuredState].description : "Nenhuma câmera foi cadastrada."}
          </p>
        </div>
        <dl>
          <div>
            <dt>Ao vivo</dt>
            <dd>{counts.live}</dd>
          </div>
          <div>
            <dt>Gravações</dt>
            <dd>{counts.replay}</dd>
          </div>
          <div><dt>Sem horário confirmado</dt><dd>{counts.configured}</dd></div>
        </dl>
        <footer>{featured?.provider ?? cameraData.source.name}</footer>
      </aside>
    </section>
  );
}

function CameraExplorerV2({ cameras, referenceTime }: { cameras: WeatherCamera[]; referenceTime: string }) {
  const initial = useMemo(() => selectedInitialCamera(cameras), [cameras]);
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [playerOpen, setPlayerOpen] = useState(false);
  const selected = cameras.find((camera) => camera.id === selectedId) ?? initial;

  if (!selected) {
    return (
      <section className="camera-v2-empty" id="explorador-de-cameras" aria-labelledby="camera-v2-empty-title">
        <VideoOff aria-hidden="true" />
        <div>
          <span className="camera-v2-eyebrow">Nenhuma câmera cadastrada</span>
          <h2 id="camera-v2-empty-title">Não há imagens para exibir</h2>
          <p>O portal não usa imagens demonstrativas quando não existe uma transmissão real.</p>
        </div>
      </section>
    );
  }

  const selectedState = cameraState(selected);
  const SelectedIcon = stateIcon(selectedState);
  const canPlay = selected.status === "online" && Boolean(selected.embedUrl);
  const selectCamera = (camera: WeatherCamera) => {
    setSelectedId(camera.id);
    setPlayerOpen(false);
  };

  return (
    <section className="camera-v2-explorer" id="explorador-de-cameras" aria-labelledby="camera-v2-explorer-title">
      <header className="camera-v2-section-heading">
        <div>
          <span className="camera-v2-eyebrow">Câmeras disponíveis</span>
          <h2 id="camera-v2-explorer-title">Escolha o local e confira a data da imagem</h2>
        </div>
        <p>O vídeo só é carregado depois do clique. Ao trocar de câmera, o vídeo anterior é fechado.</p>
      </header>
      <div className="camera-v2-selector" aria-label="Escolha uma câmera">
        {cameras.map((camera) => {
          const state = cameraState(camera);
          const Icon = stateIcon(state);
          const active = camera.id === selected.id;
          return (
            <article className={`is-${state}${active ? " is-active" : ""}`} id={camera.id} key={camera.id}>
              <button type="button" aria-pressed={active} onClick={() => selectCamera(camera)}>
                <span className="camera-v2-selector__icon"><Icon aria-hidden="true" /></span>
                <span><strong>{camera.shortName}</strong><small>{camera.area}</small></span>
                <em>{stateCopy[state].label}</em>
              </button>
            </article>
          );
        })}
      </div>
      <div className="camera-v2-stage">
        <div className={`camera-v2-frame is-${selectedState}`}>
          {canPlay ? playerOpen ? (
            <iframe
              src={selected.embedUrl ?? undefined}
              title={selected.streamTitle ?? selected.name}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              className="camera-v2-launch"
              type="button"
              onClick={() => setPlayerOpen(true)}
              aria-label={`${launchLabel(selected)}: ${selected.name}`}
            >
              {selected.thumbnailUrl ? (
                <img src={selected.thumbnailUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              ) : null}
              <span className="camera-v2-launch__shade" aria-hidden="true" />
              <span className="camera-v2-launch__icon"><CirclePlay aria-hidden="true" /></span>
              <strong>{launchLabel(selected)}</strong>
              <small>{stateCopy[selectedState].description}</small>
            </button>
          ) : (
            <div className="camera-v2-placeholder" role="status">
              <VideoOff aria-hidden="true" />
              <strong>Imagem ainda não disponível</strong>
              <p>O ponto continua cadastrado, sem usar vídeo ou imagem simulada.</p>
            </div>
          )}
          <div className="camera-v2-frame__status">
            <span><SelectedIcon aria-hidden="true" />{stateCopy[selectedState].label}</span>
            <small>{selected.provider ?? "Responsável não informado"}</small>
          </div>
        </div>
        <aside className="camera-v2-details" aria-label="Detalhes da câmera selecionada" aria-live="polite">
          <span className="camera-v2-eyebrow">Câmera selecionada</span>
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>
          <div className={`camera-v2-details__state is-${selectedState}`}>
            <SelectedIcon aria-hidden="true" />
            <span><strong>{stateCopy[selectedState].title}</strong><small>{stateCopy[selectedState].description}</small></span>
          </div>
          <dl>
            <div><dt>Local</dt><dd><MapPin aria-hidden="true" />{selected.area}</dd></div>
            <div><dt>O que a câmera mostra</dt><dd><Eye aria-hidden="true" />{selected.observation}</dd></div>
            <div><dt>Origem do vídeo</dt><dd><Satellite aria-hidden="true" />{sourceLabel(selected)}</dd></div>
            <div><dt>Localização aproximada</dt><dd>{selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</dd></div>
            {selected.publishedAt ? (
              <div>
                <dt>Data da gravação</dt>
                <dd><Clock3 aria-hidden="true" />{formatDateTime(selected.publishedAt)} · {relativePublication(selected.publishedAt, referenceTime)}</dd>
              </div>
            ) : null}
          </dl>
          {selected.streamTitle ? (
            <div className="camera-v2-details__title"><span>Título do vídeo</span><strong>{selected.streamTitle}</strong></div>
          ) : null}
          {selected.publicUrl ? (
            <a
              href={selected.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${selected.name} na página original, em nova aba`}
            >
              Abrir página original <ExternalLink aria-hidden="true" />
            </a>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

export function CameraPageV2({ cameraData, weather }: CameraPageProps) {
  const counts = cameraCounts(cameraData.cameras);
  const verifiedVideo = cameraData.cameras.find(
    (camera) =>
      (camera.broadcastStatus === "live" || camera.broadcastStatus === "replay") &&
      camera.embedUrl &&
      camera.publicUrl,
  );
  const current = weather.weather.current;
  const maxRainChance = weather.weather.hourly
    .slice(0, 12)
    .map((hour) => hour.precipitationProbability)
    .filter((value): value is number => value !== null)
    .reduce<number | null>((maximum, value) => maximum === null ? value : Math.max(maximum, value), null);
  const maxGust = weather.weather.hourly
    .slice(0, 24)
    .map((hour) => hour.windGust)
    .filter((value): value is number => value !== null)
    .reduce<number | null>((maximum, value) => maximum === null ? value : Math.max(maximum, value), null);
  const temperatureSource = weather.weather.currentProvenance.temperature;
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Câmeras e pontos de observação visual de Pelotas",
    numberOfItems: cameraData.cameras.length,
    itemListElement: cameraData.cameras.map((camera, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: camera.name,
      description: camera.description,
      url: absoluteUrl(`/cameras-ao-vivo-pelotas#${camera.id}`),
    })),
  };
  const videoSchema = verifiedVideo ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: verifiedVideo.streamTitle ?? verifiedVideo.name,
    description: verifiedVideo.description,
    thumbnailUrl: verifiedVideo.thumbnailUrl ? [verifiedVideo.thumbnailUrl] : undefined,
    uploadDate: verifiedVideo.publishedAt ?? undefined,
    embedUrl: verifiedVideo.embedUrl,
    contentUrl: verifiedVideo.publicUrl,
    isLiveBroadcast: verifiedVideo.broadcastStatus === "live",
  } : null;

  return (
    <div className="camera-v2-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c") }} />
      {videoSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema).replace(/</g, "\\u003c") }} />
      ) : null}

      <nav className="camera-v2-chapters" aria-label="Seções das câmeras de Pelotas">
        <a href="#estado-das-cameras"><span>01</span><strong>Situação</strong><small>Ao vivo ou gravação</small></a>
        <a href="#explorador-de-cameras"><span>02</span><strong>Câmeras</strong><small>Escolha o local</small></a>
        <a href="#contexto-meteorologico"><span>03</span><strong>Tempo</strong><small>Medição e previsão</small></a>
        <a href="#como-interpretar-imagens"><span>04</span><strong>Como interpretar</strong><small>Limites da imagem</small></a>
        <a href="#responsabilidade-das-fontes"><span>05</span><strong>Responsabilidade</strong><small>Serviços externos</small></a>
      </nav>

      <section className="camera-v2-status" id="estado-das-cameras" aria-labelledby="camera-v2-status-title">
        <div>
          <span className="camera-v2-eyebrow">Situação na última atualização</span>
          <h2 id="camera-v2-status-title">{liveSummary(counts.live)}</h2>
          <p>{cameraData.warning ?? "A consulta foi concluída sem aviso para a câmera principal."}</p>
        </div>
        <dl>
          <div><dt>Ao vivo</dt><dd>{counts.live}</dd></div>
          <div><dt>Gravações</dt><dd>{counts.replay}</dd></div>
          <div><dt>Sem horário confirmado</dt><dd>{counts.configured}</dd></div>
          <div><dt>Em preparação</dt><dd>{counts.preparing}</dd></div>
        </dl>
        <footer><Info aria-hidden="true" />Atualizado em {formatDateTime(cameraData.source.fetchedAt)} · {cameraData.source.name}</footer>
      </section>

      <CameraExplorerV2 cameras={cameraData.cameras} referenceTime={cameraData.source.fetchedAt} />

      <section className="camera-v2-weather" id="contexto-meteorologico" aria-labelledby="camera-v2-weather-title">
        <header className="camera-v2-section-heading">
          <div>
            <span className="camera-v2-eyebrow">Informações do tempo</span>
            <h2 id="camera-v2-weather-title">A câmera e a previsão mostram coisas diferentes</h2>
          </div>
          <p>A câmera mostra somente o local enquadrado. Temperatura, chance de chuva e rajadas vêm das fontes meteorológicas indicadas pelo portal.</p>
        </header>
        <div className="camera-v2-weather__grid">
          <article>
            <Thermometer aria-hidden="true" />
            <span>Temperatura agora</span>
            <strong>{formatNumber(current?.temperature, " °C", 1)}</strong>
            <small>{temperatureSource ? `Origem: ${sourceNames[temperatureSource]}` : "Origem não informada"}</small>
          </article>
          <article>
            <CloudRain aria-hidden="true" />
            <span>Maior chance de chuva</span>
            <strong>{formatNumber(maxRainChance, "%")}</strong>
            <small>Nas próximas 12 horas</small>
          </article>
          <article>
            <Wind aria-hidden="true" />
            <span>Maior rajada prevista</span>
            <strong>{formatNumber(maxGust, " km/h")}</strong>
            <small>Nas próximas 24 horas</small>
          </article>
          <article>
            <Gauge aria-hidden="true" />
            <span>Condição agora</span>
            <strong>{current?.condition ?? "Em atualização"}</strong>
            <small>Informação meteorológica, não produzida pela câmera</small>
          </article>
        </div>
      </section>

      <section className="camera-v2-guidance" id="como-interpretar-imagens" aria-labelledby="camera-v2-guidance-title">
        <header className="camera-v2-section-heading">
          <div>
            <span className="camera-v2-eyebrow">Antes de interpretar a imagem</span>
            <h2 id="camera-v2-guidance-title">O que observar e quais cuidados tomar</h2>
          </div>
          <p>Lente molhada, reflexos, horário, iluminação e enquadramento podem alterar a aparência. Uma imagem não mede temperatura, vento, volume de chuva ou nível da água.</p>
        </header>
        <div className="camera-v2-guidance__grid">
          <article><Eye aria-hidden="true" /><span>01</span><h3>Visibilidade</h3><p>Horizonte oculto pode indicar neblina, nuvem baixa ou chuva, mas também pode resultar da posição e da qualidade da lente.</p></article>
          <article><CloudRain aria-hidden="true" /><span>02</span><h3>Chuva aparente</h3><p>Gotas e superfície molhada ajudam a observar o local, mas não informam intensidade nem abrangência no município.</p></article>
          <article><Wind aria-hidden="true" /><span>03</span><h3>Vento aparente</h3><p>Movimento de árvores ou da Lagoa oferece uma referência visual, mas não substitui a medição do vento nem a previsão de rajadas.</p></article>
          <article><Clock3 aria-hidden="true" /><span>04</span><h3>Data da imagem</h3><p>Confirme se a indicação é Ao vivo, Última transmissão ou Horário não confirmado antes de interpretar a cena como atual.</p></article>
        </div>
      </section>

      <section className="camera-v2-responsibility" id="responsabilidade-das-fontes" aria-labelledby="camera-v2-responsibility-title">
        <AlertTriangle aria-hidden="true" />
        <div>
          <span className="camera-v2-eyebrow">Transmissões de terceiros</span>
          <h2 id="camera-v2-responsibility-title">O Tempo Pelotas não controla a continuidade dos vídeos</h2>
          <p>Os vídeos e títulos pertencem aos responsáveis indicados em cada ponto. Uma transmissão pode sair do ar, mudar de endereço ou impedir a exibição no portal. Em situação de risco, siga os alertas oficiais e as orientações das autoridades.</p>
        </div>
        <ShieldCheck aria-hidden="true" />
      </section>

      <section className="camera-v2-actions" aria-label="Outras páginas relacionadas às câmeras">
        <div>
          <span className="camera-v2-eyebrow">Veja junto com outras informações</span>
          <h2>Compare a imagem com radar, medições e alertas</h2>
        </div>
        <div>
          <Link to="/radar-e-satelite-pelotas">Radar e satélite <ArrowRight aria-hidden="true" /></Link>
          <Link to="/estacao-embrapa-pelotas">Estação Embrapa</Link>
          <Link to="/chuva-em-pelotas">Chuva em Pelotas</Link>
          <Link to="/alertas">Alertas oficiais</Link>
        </div>
      </section>
    </div>
  );
}
