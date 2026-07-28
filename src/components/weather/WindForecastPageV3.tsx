import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Compass,
  Database,
  Gauge,
  Info,
  Navigation,
  ShieldAlert,
  TrendingUp,
  Waves,
  Wind,
} from "lucide-react";

import type { WeatherSourceKey } from "@/lib/weather/aggregated-weather.types";
import type { HourlyForecast } from "@/lib/weather/types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./WindForecastPageV3.css";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function number(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
}

function gust(value: number | null | undefined) {
  return value === null || value === undefined ? "Não informada" : `${number(value)} km/h`;
}

function sourceName(source: WeatherSourceKey | null | undefined) {
  if (source === "embrapa") return "Estação Embrapa";
  if (source === "open-meteo") return "modelo Open-Meteo";
  if (source === "met-norway") return "modelo MET Norway";
  if (source === "inmet") return "INMET";
  if (source === "cppmet") return "CPPMET/UFPel";
  return "fonte não identificada";
}

function spread(hour: HourlyForecast | null) {
  if (!hour || hour.windGust === null) return null;
  return Math.max(0, hour.windGust - hour.windSpeed);
}

function peakHours(hours: HourlyForecast[]) {
  return [...hours]
    .sort((a, b) => (b.windGust ?? b.windSpeed) - (a.windGust ?? a.windSpeed))
    .slice(0, 3);
}

function readingBand(maximum: number | null) {
  if (maximum === null) return { key: "unknown", label: "Rajadas indisponíveis" };
  if (maximum >= 70) return { key: "strong", label: "Faixa editorial mais intensa" };
  if (maximum >= 50) return { key: "elevated", label: "Faixa editorial elevada" };
  return { key: "moderate", label: "Faixa editorial moderada" };
}

function EmptyWindPage() {
  return (
    <section className="wind-v3-empty" aria-labelledby="wind-v3-empty-title">
      <Wind aria-hidden="true" />
      <div>
        <span className="wind-v3-eyebrow">Vento em Pelotas</span>
        <h1 id="wind-v3-empty-title">Os dados de vento estão em atualização</h1>
        <p>Nenhuma velocidade ou rajada foi preenchida manualmente enquanto as fontes estão indisponíveis.</p>
        <Link to="/tempo-hoje-pelotas"><ArrowLeft aria-hidden="true" /> Ver o tempo de hoje</Link>
      </div>
    </section>
  );
}

export function WindForecastPageV3({ data }: { data: WeatherIntelligenceData }) {
  const recovered = useOpenMeteoIntelligenceRecovery(data);
  const weather = recovered.weather;
  const current = weather.current;

  if (!current && weather.hourly.length === 0 && weather.daily.length === 0) return <EmptyWindPage />;

  const hours = weather.hourly.slice(0, 24);
  const days = weather.daily.slice(0, 7);
  const windSource = weather.currentProvenance.windSpeed ?? null;
  const directionSource = weather.currentProvenance.windDirection ?? null;
  const provider = weather.quality.forecastProvider ?? sourceName(weather.quality.forecastSource);
  const gustHours = hours.filter((hour) => hour.windGust !== null);
  const peak = gustHours.length
    ? gustHours.reduce((selected, hour) =>
        (hour.windGust ?? -1) > (selected.windGust ?? -1) ? hour : selected,
      )
    : null;
  const maximumGust = peak?.windGust ?? null;
  const band = readingBand(maximumGust);
  const topHours = peakHours(hours);
  const maximumScale = Math.max(1, ...hours.map((hour) => Math.max(hour.windSpeed, hour.windGust ?? 0)));
  const averageSpeed = hours.length
    ? hours.reduce((total, hour) => total + hour.windSpeed, 0) / hours.length
    : null;
  const dailyMaximum = Math.max(1, ...days.map((day) => day.windGust ?? 0));
  const alerts = weather.alerts.filter(
    (alert) => alert.period === "active" && /vento|vendaval|rajada|tempestade|ciclone/i.test(
      `${alert.event} ${alert.headline} ${alert.description}`,
    ),
  );

  return (
    <div className="wind-v3-page">
      <section className="wind-v3-hero" aria-labelledby="wind-v3-title">
        <div className="wind-v3-hero-copy">
          <Link className="wind-v3-back" to="/"><ArrowLeft aria-hidden="true" /> Visão geral</Link>
          <span className="wind-v3-eyebrow">Vento, direção e rajadas</span>
          <h1 id="wind-v3-title">Quando o vento ficará mais intenso em Pelotas.</h1>
          <p>
            Diferencie o valor atual das rajadas previstas, veja a procedência de cada campo e localize
            os maiores valores das próximas 24 horas.
          </p>
          <div className="wind-v3-actions">
            <a href="#vento-por-hora">Explorar 24 horas <ArrowRight aria-hidden="true" /></a>
            <Link to="/alertas">Avisos oficiais</Link>
          </div>
        </div>

        <aside className={`wind-v3-hero-card is-${band.key}`}>
          <header><span><Wind aria-hidden="true" />{band.label}</span><small>{formatDateTime(weather.source.fetchedAt)}</small></header>
          <div className="wind-v3-current">
            <span>Vento consolidado agora</span>
            <strong>{number(current?.windSpeed)}</strong>
            <small>{current?.windSpeed === null || current?.windSpeed === undefined ? "km/h indisponíveis" : `km/h · ${current.windDirection ?? "direção não informada"}`}</small>
          </div>
          <div className="wind-v3-peak"><TrendingUp aria-hidden="true" /><span><small>Maior rajada em 24 h</small><strong>{gust(maximumGust)}</strong><b>{peak?.time ?? "Horário não informado"}</b></span></div>
          <dl><div><dt>Vento atual</dt><dd>{sourceName(windSource)}</dd></div><div><dt>Previsão</dt><dd>{provider}</dd></div></dl>
          <footer>As faixas visuais não substituem alertas oficiais.</footer>
        </aside>
      </section>

      <nav className="wind-v3-chapters" aria-label="Capítulos da previsão de vento">
        <a href="#procedencia"><span>01</span><strong>Procedência</strong><small>Observado ou previsto</small></a>
        <a href="#resumo"><span>02</span><strong>Resumo</strong><small>Agora e pico</small></a>
        <a href="#vento-por-hora"><span>03</span><strong>24 horas</strong><small>Velocidade e rajada</small></a>
        <a href="#maiores-valores"><span>04</span><strong>Picos</strong><small>Maiores horários</small></a>
        <a href="#vento-na-semana"><span>05</span><strong>7 dias</strong><small>Máximas diárias</small></a>
      </nav>

      <section className="wind-v3-source" id="procedencia" aria-labelledby="wind-v3-source-title">
        <Database aria-hidden="true" />
        <div><span className="wind-v3-eyebrow">Procedência campo a campo</span><h2 id="wind-v3-source-title">Atual e futuro podem vir de fontes diferentes</h2><p>A velocidade atual veio de {sourceName(windSource)}. A direção veio de {sourceName(directionSource)}. As próximas horas usam {provider}.</p></div>
        <dl><div><dt>Horário da condição</dt><dd>{formatDateTime(current?.observedAt)}</dd></div><div><dt>Consulta do portal</dt><dd>{formatDateTime(weather.source.fetchedAt)}</dd></div><div><dt>Direção atual</dt><dd>{current?.windDirection ?? "Não informada"}</dd></div></dl>
      </section>

      <section className="wind-v3-section" id="resumo" aria-labelledby="wind-v3-summary-title">
        <header className="wind-v3-heading"><div><span className="wind-v3-eyebrow">Leitura rápida</span><h2 id="wind-v3-summary-title">O que se destaca nesta atualização</h2></div><p>Velocidade e rajada são medidas diferentes. A rajada representa um pico breve e normalmente supera o vento sustentado.</p></header>
        <div className="wind-v3-summary-grid">
          <article><Navigation aria-hidden="true" /><span>Vento atual</span><strong>{current?.windSpeed === null || current?.windSpeed === undefined ? "—" : `${number(current.windSpeed)} km/h`}</strong><small>{sourceName(windSource)}</small></article>
          <article><Gauge aria-hidden="true" /><span>Média prevista em 24 h</span><strong>{averageSpeed === null ? "—" : `${number(averageSpeed, 1)} km/h`}</strong><small>Média simples das horas disponíveis</small></article>
          <article><TrendingUp aria-hidden="true" /><span>Maior rajada em 24 h</span><strong>{gust(maximumGust)}</strong><small>{peak?.time ? `Prevista para ${peak.time}` : "Horário não informado"}</small></article>
          <article><Activity aria-hidden="true" /><span>Diferença no pico</span><strong>{spread(peak) === null ? "—" : `+${number(spread(peak))} km/h`}</strong><small>Rajada menos velocidade no mesmo horário</small></article>
        </div>
      </section>

      {alerts.length ? (
        <section className="wind-v3-alert"><AlertTriangle aria-hidden="true" /><div><span className="wind-v3-eyebrow">Aviso oficial vigente</span><h2>{alerts.length === 1 ? "Há 1 aviso relacionado a vento ou tempestade" : `Há ${alerts.length} avisos relacionados a vento ou tempestade`}</h2><p>{alerts[0]?.headline || alerts[0]?.event}</p></div><Link to="/alertas">Abrir avisos <ArrowRight aria-hidden="true" /></Link></section>
      ) : null}

      {hours.length ? (
        <section className="wind-v3-section" id="vento-por-hora" aria-labelledby="wind-v3-hourly-title">
          <header className="wind-v3-heading"><div><span className="wind-v3-eyebrow">Próximas 24 horas</span><h2 id="wind-v3-hourly-title">Velocidade e rajada por horário</h2></div><p>A série integrada não fornece direção futura por hora. A página não repete a direção atual como se fosse previsão.</p></header>
          <div className="wind-v3-hourly-head" aria-hidden="true"><span>Hora</span><span>Velocidade</span><span>Rajada</span><span>Diferença</span><span>Escala</span></div>
          <div className="wind-v3-hourly-list">
            {hours.map((hour, index) => {
              const difference = spread(hour);
              return <article key={`${hour.timestamp ?? hour.time}-${index}`}><time dateTime={hour.timestamp}>{hour.time}</time><strong>{number(hour.windSpeed)} km/h</strong><b>{gust(hour.windGust)}</b><small>{difference === null ? "—" : `+${number(difference)} km/h`}</small><div className="wind-v3-bars" aria-label={`Velocidade ${number(hour.windSpeed)} km/h; rajada ${gust(hour.windGust)}`}><i><span style={{ width: `${Math.max(3, hour.windSpeed / maximumScale * 100)}%` }} /></i><i><span style={{ width: `${hour.windGust === null ? 0 : Math.max(3, hour.windGust / maximumScale * 100)}%` }} /></i></div></article>;
            })}
          </div>
          <div className="wind-v3-legend"><span><i className="is-speed" />Velocidade</span><span><i className="is-gust" />Rajada</span></div>
        </section>
      ) : null}

      <section className="wind-v3-section" id="maiores-valores" aria-labelledby="wind-v3-peaks-title">
        <header className="wind-v3-heading"><div><span className="wind-v3-eyebrow">Horários destacados</span><h2 id="wind-v3-peaks-title">Maiores valores dentro da janela</h2></div><p>O ranking usa a rajada quando disponível e a velocidade quando a fonte não publicou rajada.</p></header>
        <div className="wind-v3-peaks-grid">{topHours.map((hour, index) => <article key={`${hour.timestamp ?? hour.time}-peak`}><span>{String(index + 1).padStart(2, "0")}</span><Clock3 aria-hidden="true" /><h3>{hour.time}</h3><dl><div><dt>Velocidade</dt><dd>{number(hour.windSpeed)} km/h</dd></div><div><dt>Rajada</dt><dd>{gust(hour.windGust)}</dd></div></dl></article>)}</div>
      </section>

      {days.length ? (
        <section className="wind-v3-section" id="vento-na-semana" aria-labelledby="wind-v3-week-title">
          <header className="wind-v3-heading"><div><span className="wind-v3-eyebrow">Próximos 7 dias</span><h2 id="wind-v3-week-title">Maior rajada prevista em cada dia</h2></div><Link to="/previsao-7-dias-pelotas">Previsão semanal completa</Link></header>
          <div className="wind-v3-week-list">{days.map((day) => <article key={`${day.weekday}-${day.date}`}><div><strong>{day.weekday}</strong><span>{day.date}</span></div><Wind aria-hidden="true" /><div className="wind-v3-week-track" aria-label={`Rajada máxima prevista de ${gust(day.windGust)}`}><span style={{ width: `${day.windGust === null ? 0 : Math.max(4, day.windGust / dailyMaximum * 100)}%` }} /></div><strong>{gust(day.windGust)}</strong></article>)}</div>
        </section>
      ) : null}

      <section className="wind-v3-interpretation"><ShieldAlert aria-hidden="true" /><div><span className="wind-v3-eyebrow">Interpretação prática</span><h2>Exposição varia dentro do município</h2><p>Orla, áreas abertas, pontes e locais com árvores ou objetos soltos podem sentir efeitos diferentes do ponto usado pela estação ou pelo modelo. Para atividades sensíveis, confirme avisos oficiais e condições no local.</p></div><div><Link to="/radar-e-satelite-pelotas"><Waves aria-hidden="true" /> Radar e satélite</Link><Link to="/situacao-hidrologica-pelotas"><Compass aria-hidden="true" /> Situação das águas</Link></div></section>

      <footer className="wind-v3-note"><Info aria-hidden="true" /><p>Velocidade atual: {sourceName(windSource)}. Direção atual: {sourceName(directionSource)}. Rajadas futuras: {provider}. Atualizado em {formatDateTime(weather.source.fetchedAt)}.</p><Link to="/metodologia">Metodologia</Link></footer>
    </div>
  );
}
