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
  Radar,
  Satellite,
  ShieldAlert,
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

const REDEMET_URL = "https://redemet.decea.mil.br/";

const chapters = [
  { href: "#visao-geral-radar", label: "Visão geral", detail: "Fontes e atualização" },
  { href: "#radar-regional", label: "Radar", detail: "Sinais de precipitação" },
  { href: "#satelites-regionais", label: "Satélites", detail: "Nuvens sobre a região" },
  { href: "#trovoadas-regionais", label: "Trovoadas", detail: "Atividade elétrica detectada" },
  { href: "#como-ler-as-imagens", label: "Como interpretar", detail: "Limites e avisos" },
];

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

function latestObservedAt(data: RedemetOverviewData) {
  const values = [
    ...data.radar.frames,
    ...data.satellite.frames,
    ...data.inmetSatellite.frames,
    ...data.storms.frames,
  ]
    .map((frame) => frame.observedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return values[0]?.toISOString() ?? null;
}

function sourceCountLabel(count: number) {
  if (count === 1) return "1 fonte com dados disponíveis";
  return `${count} fontes com dados disponíveis`;
}

function SourceState({ configured, available }: { configured: boolean; available: boolean }) {
  const label = !configured
    ? "Integração pendente"
    : available
      ? "Imagem disponível"
      : "Indisponível nesta atualização";
  const className = !configured ? "is-pending" : available ? "is-live" : "is-unavailable";

  return (
    <span className={`redemet-source-state ${className}`}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
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
  const [selectedIndex, setSelectedIndex] = useState(layer.currentIndex);
  const selectedFrame = layer.frames[selectedIndex] ?? layer.frames.at(-1) ?? null;
  const Icon = kind === "radar" ? Radar : Satellite;
  const sourceName = layer.provider === "INMET" ? "INMET" : "REDEMET";

  useEffect(() => {
    setSelectedIndex(layer.currentIndex);
  }, [layer.currentIndex, layer.frames.length]);

  function changeFrame(nextIndex: number) {
    setSelectedIndex(Math.max(0, Math.min(layer.frames.length - 1, nextIndex)));
  }

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
          <figure className="redemet-image-frame">
            <img
              src={selectedFrame.imageUrl}
              alt={`${title}, imagem observada em ${formatDateTime(selectedFrame.observedAt)}`}
              loading={kind === "radar" ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={kind === "radar" ? "high" : "auto"}
            />
            <figcaption>
              <span>{selectedFrame.label}</span>
              <strong>Observado em {formatDateTime(selectedFrame.observedAt)}</strong>
            </figcaption>
          </figure>

          <div className="redemet-frame-controls" aria-label={`Imagens disponíveis de ${title}`}>
            <button
              type="button"
              onClick={() => changeFrame(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              aria-label="Ver imagem anterior"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <label>
              <span>
                Imagem {selectedIndex + 1} de {layer.frames.length}
              </span>
              <input
                type="range"
                min="0"
                max={Math.max(0, layer.frames.length - 1)}
                value={selectedIndex}
                onChange={(event) => changeFrame(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={() => changeFrame(selectedIndex + 1)}
              disabled={selectedIndex >= layer.frames.length - 1}
              aria-label="Ver próxima imagem"
            >
              <ArrowRight aria-hidden="true" />
            </button>
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
          <p>As demais imagens e a previsão do portal continuam disponíveis separadamente.</p>
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
  const [selectedIndex, setSelectedIndex] = useState(layer.currentIndex);
  const selectedFrame = layer.frames[selectedIndex] ?? layer.frames.at(-1) ?? null;

  useEffect(() => {
    setSelectedIndex(layer.currentIndex);
  }, [layer.currentIndex, layer.frames.length]);

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
          <h2 id="trovoadas-regionais-title">Trovoadas detectadas no quadro selecionado</h2>
          <p>
            Os pontos mostram ocorrências detectadas na região e não significam, isoladamente, que há
            tempestade ou risco em Pelotas. Confira o horário e os avisos oficiais.
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
        </div>
      </div>

      {layer.available && layer.frames.length > 1 ? (
        <label className="redemet-storm-timeline">
          <span>
            Imagem {selectedIndex + 1} de {layer.frames.length}
          </span>
          <input
            type="range"
            min="0"
            max={layer.frames.length - 1}
            value={selectedIndex}
            onChange={(event) => setSelectedIndex(Number(event.target.value))}
          />
        </label>
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

  return (
    <div className="redemet-page">
      <section
        className="redemet-hero"
        id="visao-geral-radar"
        aria-labelledby="redemet-page-title"
      >
        <div className="redemet-hero__copy">
          <p>Observação meteorológica regional</p>
          <h1 id="redemet-page-title">
            Radar e satélite em Pelotas: <span>chuva, nuvens e trovoadas.</span>
          </h1>
          <span>
            Acompanhe imagens recentes da REDEMET/DECEA e do INMET. Antes de interpretar qualquer
            quadro, confira o horário: radar, satélite e trovoadas mostram observações diferentes.
          </span>
          <div className="redemet-hero__actions">
            <a href="#radar-regional">
              Ver radar regional <ArrowRight aria-hidden="true" />
            </a>
            <Link to="/alertas">
              Ver avisos oficiais <ShieldAlert aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside aria-label="Atualização das imagens meteorológicas">
          <Clock3 aria-hidden="true" />
          <span>Quadro mais recente</span>
          <strong>{formatDateTime(latestFrame)}</strong>
          <small>{sourceCountLabel(availableSources)} entre radar, satélites e trovoadas.</small>
        </aside>
      </section>

      <InternalPageChapters items={chapters} label="Navegação de radar, satélite e trovoadas" />

      <section className="redemet-explainer" aria-label="O que cada imagem meteorológica mostra">
        <article>
          <Radar aria-hidden="true" />
          <strong>Radar: sinais de precipitação</strong>
          <span>Mostra ecos associados à chuva e ajuda a acompanhar seu deslocamento regional.</span>
        </article>
        <article>
          <Satellite aria-hidden="true" />
          <strong>Satélite: cobertura de nuvens</strong>
          <span>Mostra nuvens e seus padrões. Nuvem visível não confirma chuva no solo.</span>
        </article>
        <article>
          <CloudLightning aria-hidden="true" />
          <strong>Trovoadas: atividade elétrica</strong>
          <span>Mostra ocorrências detectadas na região, sem classificar risco local.</span>
        </article>
        <article>
          <Clock3 aria-hidden="true" />
          <strong>Horário: parte essencial da leitura</strong>
          <span>Uma imagem antiga pode não representar a condição meteorológica deste momento.</span>
        </article>
      </section>

      <ImageLayerPanel
        id="radar-regional"
        layer={data.radar}
        kind="radar"
        eyebrow="Radar meteorológico · REDEMET/DECEA"
        title="Sinais de precipitação na região de Pelotas"
        description="Compare os quadros para acompanhar a posição e o deslocamento recente dos ecos associados à chuva."
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
            <h2 id="satelites-regionais-title">Nuvens sobre Pelotas e a Região Sul</h2>
          </div>
          <p>
            REDEMET e INMET aparecem separadamente para que produto, fonte e horário permaneçam
            identificados.
          </p>
        </header>

        <div className="redemet-layers">
          <ImageLayerPanel
            id="satelite-redemet"
            layer={data.satellite}
            kind="satellite"
            eyebrow="Satélite regional · REDEMET/DECEA"
            title="Evolução da nebulosidade regional"
            description="Use a sequência de quadros para observar mudanças na cobertura de nuvens disponibilizada pelo DECEA."
          />
          <ImageLayerPanel
            id="satelite-inmet"
            layer={data.inmetSatellite}
            kind="satellite"
            eyebrow="Satélite GOES · INMET"
            title="Nuvens sobre a Região Sul"
            description="Produto complementar do INMET para comparar cobertura e organização das nuvens em escala regional."
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
          <span>Como interpretar</span>
          <h2 id="como-ler-as-imagens-title">Imagem meteorológica não é alerta automático</h2>
        </div>
        <p>
          O radar pode mostrar ecos sem confirmar chuva no seu bairro; o satélite mostra nuvens, e a
          detecção de trovoada indica atividade elétrica regional. Para risco, severidade e orientação
          de segurança, prevalecem os avisos oficiais.
        </p>
        <Link to="/metodologia">
          Como usamos as fontes
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <nav className="redemet-related" aria-label="Continue acompanhando o tempo em Pelotas">
        <Link to="/chuva-em-pelotas">
          <CloudLightning aria-hidden="true" />
          <span><small>Previsão</small><strong>Chance e volume de chuva</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/alertas">
          <ShieldAlert aria-hidden="true" />
          <span><small>Segurança</small><strong>Avisos oficiais do INMET</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/metodologia">
          <Layers3 aria-hidden="true" />
          <span><small>Transparência</small><strong>Fontes e metodologia</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/tempo-hoje-pelotas">
          <Eye aria-hidden="true" />
          <span><small>Próximas horas</small><strong>Tempo hoje em Pelotas</strong></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}
