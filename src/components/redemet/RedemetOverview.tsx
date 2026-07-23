import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CloudLightning,
  ExternalLink,
  Image as ImageIcon,
  Radar,
  Satellite,
} from "lucide-react";
import { useEffect, useState } from "react";

import type {
  RedemetImageLayerResponse,
  RedemetOverview as RedemetOverviewData,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";

import "./RedemetOverview.css";

const REDEMET_URL = "https://redemet.decea.mil.br/";

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

function SourceState({ configured, available }: { configured: boolean; available: boolean }) {
  const label = !configured
    ? "Aguardando configuração"
    : available
      ? "Fonte respondendo"
      : "Temporariamente indisponível";
  const className = !configured ? "is-pending" : available ? "is-live" : "is-unavailable";

  return (
    <span className={`redemet-source-state ${className}`}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

function ImageLayerPanel({
  layer,
  kind,
}: {
  layer: RedemetImageLayerResponse;
  kind: "radar" | "satellite";
}) {
  const [selectedIndex, setSelectedIndex] = useState(layer.currentIndex);
  const selectedFrame = layer.frames[selectedIndex] ?? layer.frames.at(-1) ?? null;
  const Icon = kind === "radar" ? Radar : Satellite;

  useEffect(() => {
    setSelectedIndex(layer.currentIndex);
  }, [layer.currentIndex, layer.frames.length]);

  function changeFrame(nextIndex: number) {
    setSelectedIndex(Math.max(0, Math.min(layer.frames.length - 1, nextIndex)));
  }

  return (
    <article className={`redemet-layer-card is-${kind}`}>
      <header>
        <div className="redemet-layer-title">
          <Icon aria-hidden="true" />
          <div>
            <span>{kind === "radar" ? "Radar regional" : "Imagem de satélite"}</span>
            <h2>{layer.product}</h2>
          </div>
        </div>
        <SourceState configured={layer.configured} available={layer.available} />
      </header>

      {layer.available && selectedFrame ? (
        <>
          <figure className="redemet-image-frame">
            <img
              src={selectedFrame.imageUrl}
              alt={`${layer.product}, quadro de ${formatDateTime(selectedFrame.observedAt)}`}
              loading={kind === "radar" ? "eager" : "lazy"}
            />
            <figcaption>
              <span>{selectedFrame.label}</span>
              <strong>{formatDateTime(selectedFrame.observedAt)}</strong>
            </figcaption>
          </figure>

          <div className="redemet-frame-controls" aria-label={`Quadros de ${layer.product}`}>
            <button
              type="button"
              onClick={() => changeFrame(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              aria-label="Ver quadro anterior"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <label>
              <span>
                Quadro {selectedIndex + 1} de {layer.frames.length}
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
              aria-label="Ver próximo quadro"
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
              ? "A fonte não entregou uma imagem utilizável nesta consulta."
              : "A integração está pronta e aguarda a chave da REDEMET no servidor."}
          </strong>
          <p>{layer.error}</p>
        </div>
      )}

      <footer>
        <span>{layer.sourceLabel}</span>
        <a href={REDEMET_URL} target="_blank" rel="noreferrer">
          Consultar a REDEMET
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
    <article className="redemet-storm-card">
      <div className="redemet-storm-heading">
        <div>
          <CloudLightning aria-hidden="true" />
          <span>Monitoramento regional</span>
        </div>
        <SourceState configured={layer.configured} available={layer.available} />
      </div>

      <div className="redemet-storm-content">
        <div>
          <span>{layer.product}</span>
          <h2>Ocorrências detectadas no quadro selecionado</h2>
          <p>
            O produto STSC é uma camada de observação meteorológica. Ele não substitui aviso oficial
            do INMET ou orientação da Defesa Civil.
          </p>
        </div>

        <div className="redemet-storm-reading">
          <strong>{layer.available && selectedFrame ? count : "—"}</strong>
          <span>{count === 1 ? "ponto detectado" : "pontos detectados"}</span>
          <small>
            {selectedFrame
              ? formatDateTime(selectedFrame.observedAt)
              : layer.error || layer.sourceLabel}
          </small>
        </div>
      </div>

      {layer.available && layer.frames.length > 1 ? (
        <label className="redemet-storm-timeline">
          <span>
            Quadro {selectedIndex + 1} de {layer.frames.length}
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
          Para decisões de segurança, confirme a situação em{" "}
          <Link to="/alertas">Avisos oficiais</Link> e nos canais das autoridades.
        </p>
      </div>
    </article>
  );
}

export function RedemetOverview({ data }: { data: RedemetOverviewData }) {
  const availableSources = [data.radar, data.satellite, data.storms].filter(
    (source) => source.available,
  ).length;
  const configuredSources = [data.radar, data.satellite, data.storms].filter(
    (source) => source.configured,
  ).length;

  return (
    <div className="redemet-page">
      <section className="redemet-hero" aria-labelledby="redemet-page-title">
        <div>
          <p>Observação meteorológica regional</p>
          <h1 id="redemet-page-title">Radar, satélite e trovoadas próximos de Pelotas</h1>
          <span>
            Produtos públicos da REDEMET/DECEA organizados pelo Tempo Pelotas, com acesso protegido
            à API e imagens entregues por proxy seguro.
          </span>
        </div>

        <aside aria-label="Estado da integração REDEMET">
          <Radar aria-hidden="true" />
          <strong>{availableSources}/3</strong>
          <span>fontes respondendo</span>
          <small>
            {configuredSources === 3
              ? "Integração configurada no servidor"
              : "Código pronto; configuração de produção pendente"}
          </small>
        </aside>
      </section>

      <section className="redemet-explainer" aria-label="Como interpretar os produtos">
        <article>
          <strong>Radar</strong>
          <span>Ajuda a visualizar ecos de precipitação e sua evolução recente.</span>
        </article>
        <article>
          <strong>Satélite</strong>
          <span>Mostra a distribuição e o desenvolvimento de nebulosidade em escala regional.</span>
        </article>
        <article>
          <strong>STSC</strong>
          <span>Apresenta ocorrências de trovoada detectadas, sem classificar risco local.</span>
        </article>
      </section>

      <section className="redemet-layers" aria-label="Produtos REDEMET">
        <ImageLayerPanel layer={data.radar} kind="radar" />
        <ImageLayerPanel layer={data.satellite} kind="satellite" />
      </section>

      <StormLayerPanel layer={data.storms} />

      <section className="redemet-method-note">
        <div>
          <span>Transparência operacional</span>
          <h2>O portal não transforma imagem em alerta automático</h2>
        </div>
        <p>
          Quadros de radar, satélite e trovoadas são apresentados como observação complementar. A
          vigência, severidade e orientação de segurança permanecem vinculadas aos avisos oficiais.
        </p>
        <Link to="/metodologia">
          Ver metodologia e fontes
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
