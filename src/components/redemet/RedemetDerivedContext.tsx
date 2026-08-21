import { Clock3, CloudLightning, Radar, Satellite, type LucideIcon } from "lucide-react";

import { isUsableRedemetObservedAt } from "@/lib/redemet/redemet-display-time";
import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
  RedemetStormPoint,
} from "@/lib/redemet/redemet.types";

import "./RedemetDerivedContext.css";

const PELOTAS = { latitude: -31.7654, longitude: -52.3376 } as const;
const EARTH_RADIUS_KM = 6_371;

type FrameLayer = Pick<RedemetImageLayerResponse | RedemetStormLayerResponse, "frames">;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceFromPelotas(point: RedemetStormPoint) {
  const latitudeDelta = radians(point.latitude - PELOTAS.latitude);
  const longitudeDelta = radians(point.longitude - PELOTAS.longitude);
  const latitudeA = radians(PELOTAS.latitude);
  const latitudeB = radians(point.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function usableTimes(layer: FrameLayer) {
  return layer.frames
    .map((frame) => frame.observedAt)
    .filter((value): value is string => isUsableRedemetObservedAt(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

function timelineWindow(layer: FrameLayer) {
  const times = usableTimes(layer);
  if (times.length < 2) return null;
  return Math.round((times.at(-1)! - times[0]) / 60_000);
}

function medianCadence(layer: FrameLayer) {
  const times = usableTimes(layer);
  if (times.length < 2) return null;
  const intervals = times
    .slice(1)
    .map((value, index) => Math.max(0, Math.round((value - times[index]) / 60_000)))
    .filter((value) => value > 0)
    .sort((a, b) => a - b);
  if (!intervals.length) return null;
  const middle = Math.floor(intervals.length / 2);
  return intervals.length % 2
    ? intervals[middle]
    : Math.round((intervals[middle - 1] + intervals[middle]) / 2);
}

function durationLabel(minutes: number | null) {
  if (minutes === null) return "Sem janela suficiente";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

function cadenceLabel(minutes: number | null) {
  if (minutes === null) return "Não calculada";
  return `~${minutes} min`;
}

function LayerReading({
  icon: Icon,
  label,
  layer,
}: {
  icon: LucideIcon;
  label: string;
  layer: FrameLayer;
}) {
  const usableCount = layer.frames.filter((frame) => isUsableRedemetObservedAt(frame.observedAt)).length;

  return (
    <article>
      <Icon aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{usableCount} quadros com horário utilizável</strong>
        <dl>
          <div>
            <dt>Janela</dt>
            <dd>{durationLabel(timelineWindow(layer))}</dd>
          </div>
          <div>
            <dt>Cadência observada</dt>
            <dd>{cadenceLabel(medianCadence(layer))}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function StormDistanceReading({ layer }: { layer: RedemetStormLayerResponse }) {
  const frame = layer.frames.filter((item) => isUsableRedemetObservedAt(item.observedAt)).at(-1) ?? null;
  const distances = (frame?.points ?? []).map(distanceFromPelotas).sort((a, b) => a - b);
  const nearest = distances[0] ?? null;
  const near = distances.filter((distance) => distance <= 50).length;
  const middle = distances.filter((distance) => distance > 50 && distance <= 150).length;
  const regional = distances.filter((distance) => distance > 150 && distance <= 450).length;

  return (
    <div className="redemet-derived-context__storms">
      <div>
        <span>Referência local de atividade elétrica</span>
        <h3>
          {nearest === null
            ? "Sem descarga STSC em quadro com horário utilizável"
            : `Descarga detectada mais próxima a aproximadamente ${Math.round(nearest)} km de Pelotas`}
        </h3>
        <p>
          A distância é calculada em linha reta entre a coordenada detectada pela REDEMET e o ponto de
          referência de Pelotas. Ela localiza a atividade elétrica; não mede intensidade, trajetória nem
          substitui aviso meteorológico.
        </p>
      </div>
      <dl aria-label="Distribuição das descargas por distância de Pelotas">
        <div>
          <dt>Até 50 km</dt>
          <dd>{near}</dd>
        </div>
        <div>
          <dt>50–150 km</dt>
          <dd>{middle}</dd>
        </div>
        <div>
          <dt>150–450 km</dt>
          <dd>{regional}</dd>
        </div>
      </dl>
    </div>
  );
}

export function RedemetDerivedContext({ data }: { data: RedemetOverview }) {
  return (
    <section className="redemet-derived-context" aria-labelledby="redemet-derived-context-title">
      <header>
        <div>
          <span>Detalhes extraídos da própria sequência</span>
          <h2 id="redemet-derived-context-title">Quanto tempo os quadros cobrem e com que intervalo atualizam</h2>
        </div>
        <p>
          O Tempo Pelotas calcula estes resumos a partir dos timestamps já recebidos das fontes. A
          cadência é observada na sequência disponível e pode variar entre atualizações; não é uma
          promessa de frequência da fonte.
        </p>
      </header>

      <div className="redemet-derived-context__layers">
        <LayerReading icon={Radar} label="Radar REDEMET" layer={data.radar} />
        <LayerReading icon={Satellite} label="Satélite REDEMET" layer={data.satellite} />
        <LayerReading icon={Satellite} label="Satélite INMET" layer={data.inmetSatellite} />
        <LayerReading icon={CloudLightning} label="Trovoadas STSC" layer={data.storms} />
      </div>

      <StormDistanceReading layer={data.storms} />

      <footer>
        <Clock3 aria-hidden="true" />
        <span>
          Janela e cadência usam apenas horários considerados utilizáveis pelo mesmo contrato temporal da
          página. Quadros ausentes, atrasados ou irregulares podem alterar esses números.
        </span>
      </footer>
    </section>
  );
}
