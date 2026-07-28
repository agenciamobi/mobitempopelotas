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

const stateCopy: Record<CameraPresentationState, { label: string; title: string; description: string }> = {
  live: { label: "Ao vivo agora", title: "Transmissão ao vivo reconhecida", description: "O provedor informou que a transmissão está ao vivo nesta consulta." },
  replay: { label: "Última transmissão", title: "Replay público disponível", description: "O player mostra a gravação pública mais recente encontrada no canal." },
  configured: { label: "Player configurado", title: "Imagem disponível, estado não verificado", description: "Existe um player configurado, mas a integração não confirmou live ou replay." },
  preparing: { label: "Em preparação", title: "Sem fonte pública estável", description: "O ponto está cadastrado, mas ainda não possui player público disponível." },
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
  if (camera.source === "api") return "API do provedor";
  if (camera.source === "public-page") return "Página pública do canal";
  if (camera.source === "rss") return "Feed público do canal";
  if (camera.source === "manual") return "Vídeo configurado manualmente";
  if (camera.source === "configured") return "Player configurado no portal";
  return "Fonte ainda não configurada";
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
  if (count === 0) return "Nenhuma live confirmada agora";
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
  if (state === "configured") return "Abrir player configurado";
  return "Player indisponível";
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
        <span className="camera-v2-eyebrow">Observação visual de Pelotas</span>
        <h1 id="camera-v2-hero-title">Câmeras do Laranjal e pontos de observação.</h1>
        <p>Veja céu, visibilidade, superfície da Lagoa e condições aparentes em locais específicos. Cada player informa se é live, replay, fonte configurada ou ponto ainda em preparação.</p>
        <div className="camera-v2-hero__actions">
          <a href="#explorador-de-cameras">Escolher uma câmera <ArrowRight aria-hidden="true" /></a>
          <Link to="/radar-e-satelite-pelotas">Comparar com radar</Link>
        </div>
      </div>
      <aside className={`camera-v2-featured is-${featuredState}`} aria-label="Estado visual em destaque">
        <header><span><FeaturedIcon aria-hidden="true" />{stateCopy[featuredState].label}</span><small>Consulta em {formatDateTime(cameraData.source.fetchedAt)}</small></header>
        <div><span>Ponto em destaque</span><strong>{featured?.shortName ?? "Nenhum ponto"}</strong><p>{featured ? stateCopy[featuredState].description : "Nenhuma câmera foi cadastrada."}</p></div>
        <dl><div><dt>Ao vivo</dt><dd>{counts.live}</dd></div><div><dt>Replay</dt><dd>{counts.replay}</dd></div><div><dt>Configuradas</dt><dd>{counts.configured}</dd></div></dl>
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
    return <section className="camera-v2-empty" id="explorador-de-cameras" aria-labelledby="camera-v2-empty-title"><VideoOff aria-hidden="true" /><div><span className="camera-v2-eyebrow">Nenhum ponto cadastrado</span><h2 id="camera-v2-empty-title">Não há câmeras para exibir</h2><p>O portal não cria imagens demonstrativas quando não existe uma fonte real cadastrada.</p></div></section>;
  }

  const selectedState = cameraState(selected);
  const SelectedIcon = stateIcon(selectedState);
  const canPlay = selected.status === "online" && Boolean(selected.embedUrl);
  const selectCamera = (camera: WeatherCamera) => { setSelectedId(camera.id); setPlayerOpen(false); };

  return (
    <section className="camera-v2-explorer" id="explorador-de-cameras" aria-labelledby="camera-v2-explorer-title">
      <header className="camera-v2-section-heading"><div><span className="camera-v2-eyebrow">Pontos cadastrados</span><h2 id="camera-v2-explorer-title">Escolha o local e confira o estado do player</h2></div><p>A reprodução externa só é carregada após o clique. Trocar de câmera fecha o player anterior e preserva a identificação do estado e da procedência.</p></header>
      <div className="camera-v2-selector" aria-label="Escolha uma câmera">
        {cameras.map((camera) => {
          const state = cameraState(camera);
          const Icon = stateIcon(state);
          const active = camera.id === selected.id;
          return <article className={`is-${state}${active ? " is-active" : ""}`} id={camera.id} key={camera.id}><button type="button" aria-pressed={active} onClick={() => selectCamera(camera)}><span className="camera-v2-selector__icon"><Icon aria-hidden="true" /></span><span><strong>{camera.shortName}</strong><small>{camera.area}</small></span><em>{stateCopy[state].label}</em></button></article>;
        })}
      </div>
      <div className="camera-v2-stage">
        <div className={`camera-v2-frame is-${selectedState}`}>
          {canPlay ? playerOpen ? (
            <iframe src={selected.embedUrl ?? undefined} title={selected.streamTitle ?? selected.name} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          ) : (
            <button className="camera-v2-launch" type="button" onClick={() => setPlayerOpen(true)} aria-label={`${launchLabel(selected)}: ${selected.name}`}>
              {selected.thumbnailUrl ? <img src={selected.thumbnailUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : null}
              <span className="camera-v2-launch__shade" aria-hidden="true" /><span className="camera-v2-launch__icon"><CirclePlay aria-hidden="true" /></span><strong>{launchLabel(selected)}</strong><small>{stateCopy[selectedState].description}</small>
            </button>
          ) : <div className="camera-v2-placeholder" role="status"><VideoOff aria-hidden="true" /><strong>Player ainda não disponível</strong><p>O ponto permanece cadastrado sem simular imagem ou transmissão.</p></div>}
          <div className="camera-v2-frame__status"><span><SelectedIcon aria-hidden="true" />{stateCopy[selectedState].label}</span><small>{selected.provider ?? "Provedor não informado"}</small></div>
        </div>
        <aside className="camera-v2-details" aria-label="Detalhes do ponto selecionado" aria-live="polite">
          <span className="camera-v2-eyebrow">Ponto selecionado</span><h3>{selected.name}</h3><p>{selected.description}</p>
          <div className={`camera-v2-details__state is-${selectedState}`}><SelectedIcon aria-hidden="true" /><span><strong>{stateCopy[selectedState].title}</strong><small>{stateCopy[selectedState].description}</small></span></div>
          <dl>
            <div><dt>Área observada</dt><dd><MapPin aria-hidden="true" />{selected.area}</dd></div>
            <div><dt>Enquadramento</dt><dd><Eye aria-hidden="true" />{selected.observation}</dd></div>
            <div><dt>Procedência</dt><dd><Satellite aria-hidden="true" />{sourceLabel(selected)}</dd></div>
            <div><dt>Coordenada aproximada</dt><dd>{selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</dd></div>
            {selected.publishedAt ? <div><dt>Publicação encontrada</dt><dd><Clock3 aria-hidden="true" />{formatDateTime(selected.publishedAt)} · {relativePublication(selected.publishedAt, referenceTime)}</dd></div> : null}
          </dl>
          {selected.streamTitle ? <div className="camera-v2-details__title"><span>Título do provedor</span><strong>{selected.streamTitle}</strong></div> : null}
          {selected.publicUrl ? <a href={selected.publicUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${selected.name} no provedor externo, em nova aba`}>Abrir no provedor <ExternalLink aria-hidden="true" /></a> : null}
        </aside>
      </div>
    </section>
  );
}

export function CameraPageV2({ cameraData, weather }: CameraPageProps) {
  const counts = cameraCounts(cameraData.cameras);
  const verifiedVideo = cameraData.cameras.find((camera) => (camera.broadcastStatus === "live" || camera.broadcastStatus === "replay") && camera.embedUrl && camera.publicUrl);
  const current = weather.weather.current;
  const maxRainChance = weather.weather.hourly.slice(0, 12).map((hour) => hour.precipitationProbability).filter((value): value is number => value !== null).reduce<number | null>((maximum, value) => maximum === null ? value : Math.max(maximum, value), null);
  const maxGust = weather.weather.hourly.slice(0, 24).map((hour) => hour.windGust).filter((value): value is number => value !== null).reduce<number | null>((maximum, value) => maximum === null ? value : Math.max(maximum, value), null);
  const temperatureSource = weather.weather.currentProvenance.temperature;
  const itemListSchema = { "@context": "https://schema.org", "@type": "ItemList", name: "Câmeras e pontos de observação visual de Pelotas", numberOfItems: cameraData.cameras.length, itemListElement: cameraData.cameras.map((camera, index) => ({ "@type": "ListItem", position: index + 1, name: camera.name, description: camera.description, url: absoluteUrl(`/cameras-ao-vivo-pelotas#${camera.id}`) })) };
  const videoSchema = verifiedVideo ? { "@context": "https://schema.org", "@type": "VideoObject", name: verifiedVideo.streamTitle ?? verifiedVideo.name, description: verifiedVideo.description, thumbnailUrl: verifiedVideo.thumbnailUrl ? [verifiedVideo.thumbnailUrl] : undefined, uploadDate: verifiedVideo.publishedAt ?? undefined, embedUrl: verifiedVideo.embedUrl, contentUrl: verifiedVideo.publicUrl, isLiveBroadcast: verifiedVideo.broadcastStatus === "live" } : null;

  return (
    <div className="camera-v2-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c") }} />
      {videoSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema).replace(/</g, "\\u003c") }} /> : null}
      <nav className="camera-v2-chapters" aria-label="Capítulos das câmeras de Pelotas"><a href="#estado-das-cameras"><span>01</span><strong>Estado</strong><small>Live, replay ou configuração</small></a><a href="#explorador-de-cameras"><span>02</span><strong>Câmeras</strong><small>Escolha o ponto</small></a><a href="#contexto-meteorologico"><span>03</span><strong>Contexto</strong><small>Medição e previsão</small></a><a href="#como-interpretar-imagens"><span>04</span><strong>Interpretação</strong><small>O que a imagem mostra</small></a><a href="#responsabilidade-das-fontes"><span>05</span><strong>Limites</strong><small>Continuidade e segurança</small></a></nav>
      <section className="camera-v2-status" id="estado-das-cameras" aria-labelledby="camera-v2-status-title"><div><span className="camera-v2-eyebrow">Estado na última consulta</span><h2 id="camera-v2-status-title">{liveSummary(counts.live)}</h2><p>{cameraData.warning ?? "A integração respondeu sem aviso de indisponibilidade para o ponto principal."}</p></div><dl><div><dt>Ao vivo</dt><dd>{counts.live}</dd></div><div><dt>Replay</dt><dd>{counts.replay}</dd></div><div><dt>Player sem estado verificado</dt><dd>{counts.configured}</dd></div><div><dt>Em preparação</dt><dd>{counts.preparing}</dd></div></dl><footer><Info aria-hidden="true" />Consulta em {formatDateTime(cameraData.source.fetchedAt)} · {cameraData.source.name}</footer></section>
      <CameraExplorerV2 cameras={cameraData.cameras} referenceTime={cameraData.source.fetchedAt} />
      <section className="camera-v2-weather" id="contexto-meteorologico" aria-labelledby="camera-v2-weather-title"><header className="camera-v2-section-heading"><div><span className="camera-v2-eyebrow">Dados complementares</span><h2 id="camera-v2-weather-title">A imagem e os dados respondem perguntas diferentes</h2></div><p>A câmera ajuda a observar o enquadramento. Temperatura atual vem da condição consolidada; chuva e rajada futuras são previsões e não podem ser inferidas diretamente do vídeo.</p></header><div className="camera-v2-weather__grid"><article><Thermometer aria-hidden="true" /><span>Temperatura consolidada</span><strong>{formatNumber(current?.temperature, " °C", 1)}</strong><small>{temperatureSource ? `Fonte do campo: ${sourceNames[temperatureSource]}` : "Fonte do campo não informada"}</small></article><article><CloudRain aria-hidden="true" /><span>Maior chance de chuva</span><strong>{formatNumber(maxRainChance, "%")}</strong><small>Previsão nas próximas 12 horas</small></article><article><Wind aria-hidden="true" /><span>Maior rajada prevista</span><strong>{formatNumber(maxGust, " km/h")}</strong><small>Previsão nas próximas 24 horas</small></article><article><Gauge aria-hidden="true" /><span>Condição consolidada</span><strong>{current?.condition ?? "Em atualização"}</strong><small>Não é uma leitura produzida pela câmera</small></article></div></section>
      <section className="camera-v2-guidance" id="como-interpretar-imagens" aria-labelledby="camera-v2-guidance-title"><header className="camera-v2-section-heading"><div><span className="camera-v2-eyebrow">Interpretação responsável</span><h2 id="camera-v2-guidance-title">O que observar antes de concluir algo pela imagem</h2></div><p>Lente molhada, reflexos, horário, iluminação e enquadramento podem alterar a percepção. Uma imagem não mede temperatura, vento, volume de chuva ou nível da água.</p></header><div className="camera-v2-guidance__grid"><article><Eye aria-hidden="true" /><span>01</span><h3>Visibilidade</h3><p>Horizonte oculto pode indicar neblina, nuvem baixa ou precipitação, mas também pode resultar de posição e qualidade da lente.</p></article><article><CloudRain aria-hidden="true" /><span>02</span><h3>Chuva aparente</h3><p>Gotas e superfície molhada ajudam na percepção local, mas não informam intensidade nem abrangência no município.</p></article><article><Wind aria-hidden="true" /><span>03</span><h3>Vento aparente</h3><p>Movimento de árvores ou da Lagoa oferece contexto visual, porém não substitui anemômetro nem previsão de rajadas.</p></article><article><Clock3 aria-hidden="true" /><span>04</span><h3>Atualidade</h3><p>Confirme se o estado é live, replay ou player sem verificação antes de interpretar a cena como condição presente.</p></article></div></section>
      <section className="camera-v2-responsibility" id="responsabilidade-das-fontes" aria-labelledby="camera-v2-responsibility-title"><AlertTriangle aria-hidden="true" /><div><span className="camera-v2-eyebrow">Limites operacionais</span><h2 id="camera-v2-responsibility-title">O portal não controla a continuidade das transmissões</h2><p>Players, imagens e títulos pertencem aos responsáveis indicados em cada ponto. Uma fonte externa pode sair do ar, mudar de endereço, bloquear incorporação ou publicar replay sem aviso. Em situação de risco, prevalecem alertas oficiais e orientações das autoridades.</p></div><ShieldCheck aria-hidden="true" /></section>
      <section className="camera-v2-actions" aria-label="Ações relacionadas às câmeras"><div><span className="camera-v2-eyebrow">Compare as fontes</span><h2>Complete a observação visual com radar, medição e alertas</h2></div><div><Link to="/radar-e-satelite-pelotas">Radar e satélite <ArrowRight aria-hidden="true" /></Link><Link to="/estacao-embrapa-pelotas">Estação Embrapa</Link><Link to="/chuva-em-pelotas">Chuva em Pelotas</Link><Link to="/alertas">Alertas oficiais</Link></div></section>
    </div>
  );
}
