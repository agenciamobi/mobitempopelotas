import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  CloudLightning,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers3,
  Maximize2,
  Pause,
  Play,
  Radar,
  RotateCcw,
  Satellite,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type {
  RedemetImageLayerResponse,
  RedemetOverview as RedemetOverviewData,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";

import "./RedemetOverview.css";
import "./RedemetOverview.sources.css";
import "./RedemetRetail.css";
import "./RedemetRetailRefinement.css";

const REDEMET_URL = "https://redemet.decea.mil.br/";
const FRAME_INTERVAL_MS = 1_600;

const chapters = [
  { href: "#visao-geral-radar", label: "Visão geral", detail: "Atualização e fontes" },
  { href: "#radar-regional", label: "Radar", detail: "Chuva na região" },
  { href: "#satelites-regionais", label: "Satélites", detail: "Cobertura de nuvens" },
  { href: "#trovoadas-regionais", label: "Trovoadas", detail: "Atividade elétrica" },
  { href: "#como-ler-as-imagens", label: "Como interpretar", detail: "Limites e segurança" },
];

type ObservedFrame = {
  observedAt: string | null;
};

type SourceLayer = RedemetImageLayerResponse | RedemetStormLayerResponse;
type FreshnessTone = "recent" | "attention" | "stale" | "unknown";

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

function latestFrameTime(frames: readonly ObservedFrame[]) {
  const values = frames
    .map((frame) => frame.observedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return values[0]?.toISOString() ?? null;
}

function latestObservedAt(data: RedemetOverviewData) {
  return latestFrameTime([
    ...data.radar.frames,
    ...data.satellite.frames,
    ...data.inmetSatellite.frames,
    ...data.storms.frames,
  ]);
}

function getFreshness(value: string | null): {
  tone: FreshnessTone;
  label: string;
  relative: string;
} {
  if (!value) {
    return { tone: "unknown", label: "Horário não informado", relative: "Sem referência temporal" };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { tone: "unknown", label: "Horário não informado", relative: "Sem referência temporal" };
  }

  const ageMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  const relative =
    ageMinutes < 1
      ? "Recebido agora"
      : ageMinutes < 60
        ? `Recebido há ${ageMinutes} min`
        : ageMinutes < 1_440
          ? `Recebido há ${Math.floor(ageMinutes / 60)}h`
          : "Recebido há mais de 1 dia";

  if (ageMinutes <= 30) return { tone: "recent", label: "Atualização recente", relative };
  if (ageMinutes <= 120) return { tone: "attention", label: "Confira o horário", relative };
  return { tone: "stale", label: "Quadro com mais de 2h", relative };
}

function sourceCountLabel(count: number) {
  if (count === 1) return "1 fonte com dados disponíveis";
  return `${count} fontes com dados disponíveis`;
}

function frameCountLabel(count: number) {
  if (count === 1) return "1 quadro disponível";
  return `${count} quadros disponíveis`;
}

function FreshnessBadge({ value }: { value: string | null }) {
  const freshness = getFreshness(value);

  return (
    <span className={`redemet-freshness is-${freshness.tone}`}>
      <i aria-hidden="true" />
      {freshness.label}
    </span>
  );
}

function SourceState({ configured, available }: { configured: boolean; available: boolean }) {
  const label = !configured
    ? "Integração pendente"
    : available
      ? "Dados disponíveis"
      : "Indisponível nesta atualização";
  const className = !configured ? "is-pending" : available ? "is-live" : "is-unavailable";

  return (
    <span className={`redemet-source-state ${className}`}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

function SourceSummaryCard({
  icon: Icon,
  title,
  description,
  layer,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  layer: SourceLayer;
}) {
  const latest = latestFrameTime(layer.frames);
  const freshness = getFreshness(latest);

  return (
    <article className={`redemet-source-summary is-${freshness.tone}`}>
      <div className="redemet-source-summary__heading">
        <Icon aria-hidden="true" />
        <div>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
      </div>
      <SourceState configured={layer.configured} available={layer.available} />
      <dl>
        <div>
          <dt>Último quadro</dt>
          <dd>{formatDateTime(latest)}</dd>
        </div>
        <div>
          <dt>Sequência</dt>
          <dd>{frameCountLabel(layer.frames.length)}</dd>
        </div>
      </dl>
      <small>{freshness.relative}</small>
    </article>
  );
}

function useFramePlayback(frameCount: number, currentIndex: number) {
  const safeCurrentIndex = Math.max(0, Math.min(Math.max(0, frameCount - 1), currentIndex));
  const [selectedIndex, setSelectedIndex] = useState(safeCurrentIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setSelectedIndex(safeCurrentIndex);
    setIsPlaying(false);
  }, [safeCurrentIndex, frameCount]);

  useEffect(() => {
    if (!isPlaying || frameCount <= 1) return;

    const timer = window.setInterval(() => {
      setSelectedIndex((index) => (index >= frameCount - 1 ? 0 : index + 1));
    }, FRAME_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [frameCount, isPlaying]);

  function selectFrame(nextIndex: number) {
    setIsPlaying(false);
    setSelectedIndex(Math.max(0, Math.min(Math.max(0, frameCount - 1), nextIndex)));
  }

  function showLatest() {
    setIsPlaying(false);
    setSelectedIndex(safeCurrentIndex);
  }

  function togglePlayback() {
    if (frameCount <= 1) return;
    setIsPlaying((playing) => !playing);
  }

  return {
    selectedIndex,
    isPlaying,
    selectFrame,
    showLatest,
    togglePlayback,
    isLatest: selectedIndex === safeCurrentIndex,
  };
}

type ImageLayerPanelProps = {
  id: string;
  layer: RedemetImageLayerResponse;
  kind: "radar" | "satellite";
  eyebrow: string;
  title: string;
  description: string;
  featured?: boolean;
};

function ImageLayerPanel({
  id,
  layer,
  kind,
  eyebrow,
  title,
  description,
  featured = false,
}: ImageLayerPanelProps) {
  const playback = useFramePlayback(layer.frames.length, layer.currentIndex);
  const selectedFrame = layer.frames[playback.selectedIndex] ?? layer.frames.at(-1) ?? null;
  const Icon = kind === "radar" ? Radar : Satellite;
  const sourceName = layer.provider === "INMET" ? "INMET" : "REDEMET";
  const freshness = getFreshness(selectedFrame?.observedAt ?? null);

  return (
    <article
      className={`redemet-layer-card is-${kind}${featured ? " is-featured" : ""}`}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <header>
        <div className="redemet-layer-title">
          <Icon aria-hidden="true" />
          <div>
            <span>{eyebrow}</span>
            <h2 id={`${id}-title`}>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        <SourceState configured={layer.configured} available={layer.available} />
      </header>

      {layer.available && selectedFrame ? (
        <>
          <figure className="redemet-image-frame" data-freshness={freshness.tone}>
            <img
              src={selectedFrame.imageUrl}
              alt={`${title}, imagem observada em ${formatDateTime(selectedFrame.observedAt)}`}
              loading={kind === "radar" ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={kind === "radar" ? "high" : "auto"}
            />
            <figcaption>
              <div>
                <span>{selectedFrame.label}</span>
                <FreshnessBadge value={selectedFrame.observedAt} />
              </div>
              <strong>Observado em {formatDateTime(selectedFrame.observedAt)}</strong>
            </figcaption>
          </figure>

          <div className="redemet-frame-controls" aria-label={`Imagens disponíveis de ${title}`}>
            <button
              type="button"
              onClick={() => playback.selectFrame(playback.selectedIndex - 1)}
              disabled={playback.selectedIndex === 0}
              aria-label="Ver imagem anterior"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <label>
              <span>
                Imagem {playback.selectedIndex + 1} de {layer.frames.length}
              </span>
              <input
                type="range"
                min="0"
                max={Math.max(0, layer.frames.length - 1)}
                value={playback.selectedIndex}
                onChange={(event) => playback.selectFrame(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={() => playback.selectFrame(playback.selectedIndex + 1)}
              disabled={playback.selectedIndex >= layer.frames.length - 1}
              aria-label="Ver próxima imagem"
            >
              <ArrowRight aria-hidden="true" />
            </button>

            <div className="redemet-frame-tools">
              <button
                type="button"
                className="is-playback"
                onClick={playback.togglePlayback}
                disabled={layer.frames.length <= 1}
                aria-pressed={playback.isPlaying}
              >
                {playback.isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                {playback.isPlaying ? "Pausar sequência" : "Reproduzir sequência"}
              </button>
              <button
                type="button"
                className="is-latest"
                onClick={playback.showLatest}
                disabled={playback.isLatest}
              >
                <RotateCcw aria-hidden="true" /> Quadro mais recente
              </button>
              <a href={selectedFrame.imageUrl} target="_blank" rel="noopener noreferrer">
                <Maximize2 aria-hidden="true" /> Abrir imagem
              </a>
            </div>
          </div>
        </>
      ) : (
        <div className="redemet-layer-unavailable">
          <ImageIcon aria-hidden="true" />
          <strong>
            {layer.configured
              ? "A fonte não publicou uma imagem utilizável nesta atualização."
              : "Esta fonte ainda depende da configuração da integração no servidor."}
          </strong>
          <p>As demais imagens, a previsão por horário e os avisos oficiais continuam disponíveis.</p>
        </div>
      )}

      <footer>
        <span>
          {layer.sourceLabel} · Produto: {layer.product}
        </span>
        <a
          href={layer.officialUrl ?? REDEMET_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar ${title} no site do ${sourceName}, em nova aba`}
        >
          Abrir fonte oficial
          <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </article>
  );
}

function StormLayerPanel({ layer }: { layer: RedemetStormLayerResponse }) {
  const playback = useFramePlayback(layer.frames.length, layer.currentIndex);
  const selectedFrame = layer.frames[playback.selectedIndex] ?? layer.frames.at(-1) ?? null;
  const count = selectedFrame?.points.length ?? 0;

  return (
    <article
      className="redemet-storm-card"
      id="trovoadas-regionais"
      aria-labelledby="trovoadas-regionais-title"
    >
      <div className="redemet-storm-heading">
        <div>
          <CloudLightning aria-hidden="true" />
          <span>Atividade elétrica regional</span>
        </div>
        <SourceState configured={layer.configured} available={layer.available} />
      </div>

      <div className="redemet-storm-content">
        <div>
          <span>{layer.product}</span>
          <h2 id="trovoadas-regionais-title">Trovoadas detectadas na sequência selecionada</h2>
          <p>
            Os pontos representam descargas detectadas na região. Eles não confirmam, isoladamente,
            tempestade ou risco no município; confira o horário, a evolução dos quadros e os avisos
            oficiais.
          </p>
        </div>

        <div className="redemet-storm-reading">
          <strong>{layer.available && selectedFrame ? count : "—"}</strong>
          <span>{count === 1 ? "ocorrência detectada" : "ocorrências detectadas"}</span>
          <small>
            {selectedFrame
              ? `Observado em ${formatDateTime(selectedFrame.observedAt)}`
              : "Dados em atualização"}
          </small>
          <FreshnessBadge value={selectedFrame?.observedAt ?? null} />
        </div>
      </div>

      {layer.available && layer.frames.length > 0 ? (
        <div className="redemet-storm-controls" aria-label="Quadros de trovoadas disponíveis">
          <button
            type="button"
            onClick={() => playback.selectFrame(playback.selectedIndex - 1)}
            disabled={playback.selectedIndex === 0}
            aria-label="Ver quadro anterior de trovoadas"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <label className="redemet-storm-timeline">
            <span>
              Quadro {playback.selectedIndex + 1} de {layer.frames.length}
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(0, layer.frames.length - 1)}
              value={playback.selectedIndex}
              onChange={(event) => playback.selectFrame(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            onClick={() => playback.selectFrame(playback.selectedIndex + 1)}
            disabled={playback.selectedIndex >= layer.frames.length - 1}
            aria-label="Ver próximo quadro de trovoadas"
          >
            <ArrowRight aria-hidden="true" />
          </button>
          <div className="redemet-frame-tools">
            <button
              type="button"
              className="is-playback"
              onClick={playback.togglePlayback}
              disabled={layer.frames.length <= 1}
              aria-pressed={playback.isPlaying}
            >
              {playback.isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {playback.isPlaying ? "Pausar sequência" : "Reproduzir sequência"}
            </button>
            <button
              type="button"
              className="is-latest"
              onClick={playback.showLatest}
              disabled={playback.isLatest}
            >
              <RotateCcw aria-hidden="true" /> Quadro mais recente
            </button>
          </div>
        </div>
      ) : null}

      <div className="redemet-storm-warning">
        <AlertTriangle aria-hidden="true" />
        <p>
          Detecção de trovoada não é aviso meteorológico. Para decisões de segurança, consulte os{" "}
          <Link to="/alertas">avisos oficiais para Pelotas</Link>.
        </p>
      </div>
    </article>
  );
}

export function RedemetOverview({ data }: { data: RedemetOverviewData }) {
  const imagerySources = [data.radar, data.satellite, data.inmetSatellite];
  const allSources = [...imagerySources, data.storms];
  const availableSources = allSources.filter((source) => source.available).length;
  const latestFrame = latestObservedAt(data);
  const latestFreshness = getFreshness(latestFrame);

  return (
    <div className="redemet-page">
      <section
        className="redemet-hero"
        id="visao-geral-radar"
        aria-labelledby="redemet-page-title"
      >
        <div className="redemet-hero__copy">
          <p>Imagens meteorológicas para a região de Pelotas</p>
          <h1 id="redemet-page-title">
            Radar meteorológico e satélite em Pelotas: <span>acompanhe chuva, nuvens e trovoadas.</span>
          </h1>
          <span>
            Compare a sequência e o horário dos quadros da REDEMET/DECEA e do INMET. Radar indica
            ecos associados à precipitação, satélite mostra nuvens e a camada STSC registra atividade
            elétrica regional.
          </span>
          <div className="redemet-hero__actions">
            <a href="#radar-regional">
              Abrir radar regional <ArrowRight aria-hidden="true" />
            </a>
            <Link to="/alertas">
              Conferir avisos oficiais <ShieldAlert aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside aria-label="Atualização das imagens meteorológicas" data-freshness={latestFreshness.tone}>
          <Clock3 aria-hidden="true" />
          <span>Último quadro recebido</span>
          <strong>{formatDateTime(latestFrame)}</strong>
          <FreshnessBadge value={latestFrame} />
          <small>
            {sourceCountLabel(availableSources)}. {latestFreshness.relative}.
          </small>
        </aside>
      </section>

      <InternalPageChapters items={chapters} label="Navegação de radar, satélite e trovoadas" />

      <section className="redemet-source-overview" aria-labelledby="redemet-source-overview-title">
        <header>
          <div>
            <span>Disponibilidade nesta atualização</span>
            <h2 id="redemet-source-overview-title">Horário e sequência de cada fonte</h2>
          </div>
          <p>
            As fontes podem atualizar em momentos diferentes. Use o horário de cada produto, e não
            apenas o horário mais recente exibido no topo.
          </p>
        </header>
        <div className="redemet-source-overview__grid">
          <SourceSummaryCard
            icon={Radar}
            title="Radar regional"
            description="Ecos associados à precipitação"
            layer={data.radar}
          />
          <SourceSummaryCard
            icon={Satellite}
            title="Satélite REDEMET"
            description="Nebulosidade disponibilizada pelo DECEA"
            layer={data.satellite}
          />
          <SourceSummaryCard
            icon={Satellite}
            title="Satélite INMET"
            description="Produto GOES para a Região Sul"
            layer={data.inmetSatellite}
          />
          <SourceSummaryCard
            icon={CloudLightning}
            title="Trovoadas STSC"
            description="Atividade elétrica detectada"
            layer={data.storms}
          />
        </div>
      </section>

      <section className="redemet-explainer" aria-label="Como usar radar e satélite nesta página">
        <article>
          <Clock3 aria-hidden="true" />
          <strong>1. Confira o horário</strong>
          <span>Um quadro antigo pode não representar a condição meteorológica deste momento.</span>
        </article>
        <article>
          <Play aria-hidden="true" />
          <strong>2. Reproduza a sequência</strong>
          <span>Observe se os ecos, as nuvens ou as trovoadas avançam, recuam ou perdem intensidade.</span>
        </article>
        <article>
          <Layers3 aria-hidden="true" />
          <strong>3. Compare produtos diferentes</strong>
          <span>Radar, satélite e trovoadas mostram fenômenos relacionados, mas não equivalentes.</span>
        </article>
        <article>
          <ShieldAlert aria-hidden="true" />
          <strong>4. Confirme risco e orientação</strong>
          <span>Para severidade e segurança, consulte os avisos oficiais e a previsão por horário.</span>
        </article>
      </section>

      <ImageLayerPanel
        id="radar-regional"
        layer={data.radar}
        kind="radar"
        eyebrow="Radar meteorológico · REDEMET/DECEA"
        title="Sinais de precipitação na região de Pelotas"
        description="Reproduza os quadros para acompanhar a posição e o deslocamento recente dos ecos associados à chuva. A imagem é regional e não confirma precipitação em um endereço específico."
        featured
      />

      <section
        className="redemet-satellite-section"
        id="satelites-regionais"
        aria-labelledby="satelites-regionais-title"
      >
        <header className="redemet-section-heading">
          <div>
            <span>Imagens de satélite</span>
            <h2 id="satelites-regionais-title">Cobertura e evolução das nuvens sobre a Região Sul</h2>
          </div>
          <p>
            REDEMET e INMET aparecem lado a lado, com produto, horário e origem separados. Nuvens no
            satélite não significam necessariamente chuva no solo em Pelotas.
          </p>
        </header>

        <div className="redemet-layers">
          <ImageLayerPanel
            id="satelite-redemet"
            layer={data.satellite}
            kind="satellite"
            eyebrow="Satélite regional · REDEMET/DECEA"
            title="Evolução da nebulosidade pelo DECEA"
            description="Compare os quadros para observar mudanças na cobertura e na organização das nuvens disponibilizadas pela REDEMET."
          />
          <ImageLayerPanel
            id="satelite-inmet"
            layer={data.inmetSatellite}
            kind="satellite"
            eyebrow="Satélite GOES · INMET"
            title="Nuvens sobre a Região Sul pelo INMET"
            description="Use este produto como leitura complementar para comparar cobertura, organização e deslocamento regional das nuvens."
          />
        </div>
      </section>

      <StormLayerPanel layer={data.storms} />

      <section
        className="redemet-method-note"
        id="como-ler-as-imagens"
        aria-labelledby="como-ler-as-imagens-title"
      >
        <div>
          <span>Limites da observação</span>
          <h2 id="como-ler-as-imagens-title">Imagem meteorológica ajuda a acompanhar, mas não define o risco sozinha</h2>
        </div>
        <p>
          O radar pode mostrar ecos sem confirmar chuva no seu bairro; o satélite mostra nuvens; e a
          detecção de trovoada registra atividade elétrica regional. Para severidade, abrangência e
          orientação de segurança, prevalecem os avisos oficiais.
        </p>
        <Link to="/metodologia">
          Entender fontes e limitações
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <nav className="redemet-related" aria-label="Continue acompanhando o tempo em Pelotas">
        <Link to="/chuva-em-pelotas">
          <CloudLightning aria-hidden="true" />
          <span><small>Previsão por horário</small><strong>Chance e volume de chuva</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/alertas">
          <ShieldAlert aria-hidden="true" />
          <span><small>Risco e orientação</small><strong>Avisos oficiais do INMET</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/metodologia">
          <Layers3 aria-hidden="true" />
          <span><small>Origem dos produtos</small><strong>Fontes e metodologia</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/tempo-hoje-pelotas">
          <Eye aria-hidden="true" />
          <span><small>Temperatura, chuva e vento</small><strong>Tempo hoje em Pelotas</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}
