"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  MapPinned,
  RadioTower,
  Route,
  Waves,
  WifiOff,
} from "lucide-react";

import type {
  SaceGuaibaData,
  SaceGuaibaStation,
  SaceRiverSystem,
} from "@/lib/hydrology/sace-guaiba.server";

import { SaceGuaibaMap } from "./SaceGuaibaMap";
import "./SaceGuaibaContext.css";

type StationFilter = "all" | "above-normal" | "transmitting" | SaceRiverSystem;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isAboveNormal(station: SaceGuaibaStation) {
  return station.transmitting && station.alertType.toUpperCase() !== "NORMAL";
}

function filterStations(stations: SaceGuaibaStation[], filter: StationFilter) {
  if (filter === "all") return stations;
  if (filter === "above-normal") return stations.filter(isAboveNormal);
  if (filter === "transmitting") return stations.filter((station) => station.transmitting);
  return stations.filter((station) => station.riverSystem === filter);
}

function stationDescription(station: SaceGuaibaStation) {
  const parts = [station.river];
  if (station.code) parts.push(`código ${station.code}`);
  if (station.drainageAreaKm2 !== null) {
    parts.push(
      `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(station.drainageAreaKm2)} km² de drenagem`,
    );
  }
  return parts.join(" · ");
}

function SourceState({ data }: { data: SaceGuaibaData }) {
  const Icon = data.status === "live" ? CheckCircle2 : data.status === "partial" ? AlertTriangle : WifiOff;
  return (
    <div className={`sace-source-state is-${data.status}`}>
      <Icon aria-hidden="true" />
      <span>
        <strong>
          {data.status === "live"
            ? "Rede pública disponível"
            : data.status === "partial"
              ? "Rede disponível parcialmente"
              : "Integração com o SACE temporariamente sem resposta"}
        </strong>
        <small>
          {data.error ?? `Consulta realizada em ${formatDateTime(data.source.fetchedAt)}.`}
        </small>
      </span>
    </div>
  );
}

export function SaceGuaibaContext({ data }: { data: SaceGuaibaData }) {
  const [filter, setFilter] = useState<StationFilter>("all");
  const filteredStations = useMemo(
    () => filterStations(data.stations, filter),
    [data.stations, filter],
  );
  const stationCards = filter === "all" ? data.highlightedStations : filteredStations.slice(0, 12);

  return (
    <section className="sace-context" id="bacia-do-guaiba" aria-labelledby="sace-context-title">
      <header className="sace-context-heading">
        <div>
          <p className="hydrology-kicker">Contexto a montante · SGB</p>
          <h2 id="sace-context-title">O que acontece nos rios que alimentam o Guaíba</h2>
        </div>
        <div>
          <p>
            O SACE acompanha estações nos rios Jacuí, Taquari-Antas, Caí, Sinos, Gravataí, no Delta e
            no Guaíba. Essa rede amplia o contexto regional antes da água chegar à Lagoa dos Patos.
          </p>
          <SourceState data={data} />
        </div>
      </header>

      <div className="sace-boundary-note">
        <Route aria-hidden="true" />
        <p>
          <strong>Leitura regional, não previsão para o Laranjal.</strong> Uma categoria elevada em um
          afluente indica a situação oficial daquela estação. Vento, chuva, armazenamento no Guaíba e
          na Lagoa, saída oceânica e drenagem local interferem no que será observado em Pelotas.
        </p>
      </div>

      <div className="sace-summary-grid" aria-label="Resumo da rede SACE Guaíba">
        <article>
          <Database aria-hidden="true" />
          <span>Estações publicadas</span>
          <strong>{data.counts.total || "—"}</strong>
          <small>Pontos retornados pela rede pública do SACE.</small>
        </article>
        <article>
          <RadioTower aria-hidden="true" />
          <span>Com transmissão</span>
          <strong>{data.counts.transmitting || "—"}</strong>
          <small>Estações sem a categoria oficial “Sem transmissão”.</small>
        </article>
        <article className={data.counts.aboveNormal > 0 ? "is-attention" : ""}>
          <Activity aria-hidden="true" />
          <span>Acima de normal</span>
          <strong>{data.counts.aboveNormal}</strong>
          <small>Categorias de atenção, alerta ou inundação informadas pelo SACE.</small>
        </article>
        <article>
          <WifiOff aria-hidden="true" />
          <span>Sem transmissão</span>
          <strong>{data.counts.withoutTransmission}</strong>
          <small>Ausência de dado não significa nível normal.</small>
        </article>
      </div>

      {data.stations.length ? (
        <>
          <div className="sace-system-grid" aria-label="Estações por sistema fluvial">
            {data.systems.map((system) => (
              <button
                type="button"
                key={system.name}
                className={filter === system.name ? "is-active" : ""}
                aria-pressed={filter === system.name}
                onClick={() => setFilter(filter === system.name ? "all" : system.name)}
              >
                <span>{system.name}</span>
                <strong>{system.total}</strong>
                <small>
                  {system.aboveNormal > 0
                    ? `${system.aboveNormal} com categoria acima de normal`
                    : "Sem categoria acima de normal no quadro atual"}
                </small>
              </button>
            ))}
          </div>

          <div className="sace-map-panel">
            <div className="sace-map-toolbar">
              <div>
                <MapPinned aria-hidden="true" />
                <span>
                  <strong>Estações e hidrografia da bacia</strong>
                  <small>Selecione um filtro para concentrar a leitura do mapa.</small>
                </span>
              </div>
              <div className="sace-filter-buttons" aria-label="Filtros das estações SACE">
                <button
                  type="button"
                  className={filter === "all" ? "is-active" : ""}
                  aria-pressed={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  Todas
                </button>
                <button
                  type="button"
                  className={filter === "above-normal" ? "is-active" : ""}
                  aria-pressed={filter === "above-normal"}
                  onClick={() => setFilter("above-normal")}
                >
                  Acima de normal
                </button>
                <button
                  type="button"
                  className={filter === "transmitting" ? "is-active" : ""}
                  aria-pressed={filter === "transmitting"}
                  onClick={() => setFilter("transmitting")}
                >
                  Transmitindo
                </button>
              </div>
            </div>

            <SaceGuaibaMap
              stations={filteredStations}
              layers={data.layers}
              bounds={data.bounds}
            />

            {data.legend.length ? (
              <div className="sace-legend" aria-label="Legenda oficial do SACE Guaíba">
                {data.legend.map((item) => (
                  <span key={`${item.order}-${item.label}`}>
                    <i style={{ backgroundColor: item.color }} aria-hidden="true" />
                    {item.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="sace-stations-heading">
            <div>
              <Waves aria-hidden="true" />
              <span>
                <strong>{filter === "all" ? "Estações estratégicas e destaques oficiais" : "Estações do filtro"}</strong>
                <small>
                  As categorias abaixo são reproduzidas da rede SACE, sem conversão para risco local em
                  Pelotas.
                </small>
              </span>
            </div>
            <span>{stationCards.length} exibidas</span>
          </div>

          {stationCards.length ? (
            <div className="sace-stations-grid">
              {stationCards.map((station) => (
                <article key={station.id}>
                  <div>
                    <i style={{ backgroundColor: station.alertColor }} aria-hidden="true" />
                    <span>{station.riverSystem}</span>
                  </div>
                  <h3>{station.name}</h3>
                  <p>{stationDescription(station)}</p>
                  <strong>{station.alertLabel}</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="sace-unavailable">
              <Activity aria-hidden="true" />
              <div>
                <strong>Nenhuma estação corresponde a este filtro</strong>
                <p>O quadro atual não possui estação nesta seleção. Escolha outro sistema ou retorne a Todas.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="sace-unavailable">
          <WifiOff aria-hidden="true" />
          <div>
            <strong>A integração não recebeu as estações do SACE nesta atualização</strong>
            <p>
              Isso não confirma indisponibilidade do SGB. A leitura local do Laranjal e a rede da Lagoa
              dos Patos continuam independentes desta integração.
            </p>
          </div>
        </div>
      )}

      <footer className="sace-context-footer">
        <span>
          <Database aria-hidden="true" />
          <small>
            Fonte: {data.source.name}. Consulta do portal em {formatDateTime(data.source.fetchedAt)}.
          </small>
        </span>
        <a href={data.source.url} target="_blank" rel="noopener noreferrer">
          Abrir SACE Guaíba <ArrowUpRight aria-hidden="true" />
        </a>
      </footer>
    </section>
  );
}
