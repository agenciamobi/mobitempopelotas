import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Info,
  Moon,
  Navigation,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast, WeatherIconName } from "@/lib/weather/types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./DailyForecastPagesV2.css";

const iconMap: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "partly-cloudy": CloudSun,
  "partly-cloudy-night": CloudMoon,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  wind: Wind,
};

const conditionLabels: Record<WeatherIconName, string> = {
  sun: "Predomínio de sol",
  moon: "Céu limpo durante a noite",
  "partly-cloudy": "Sol entre nuvens",
  "partly-cloudy-night": "Noite parcialmente nublada",
  cloud: "Céu nublado",
  rain: "Previsão de chuva",
  storm: "Risco de temporal",
  wind: "Vento forte",
};

const confidenceLabels = {
  high: "Alta confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

function WeatherGlyph({ name, size = 42 }: { name: WeatherIconName | null; size?: number }) {
  const Icon = name ? iconMap[name] : Cloud;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.65} />;
}

function formatNumber(value: number | null, suffix = "") {
  return value === null ? "Não informado" : `${value}${suffix}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function sourceLabel(data: WeatherIntelligenceData) {
  const source = data.weather.quality.currentSource;
  if (source === "embrapa") return "Medição observada · Embrapa Clima Temperado";
  if (source === "met-norway") return "Condição estimada · MET Norway";
  if (source === "open-meteo") {
    return `Condição estimada · ${data.weather.quality.forecastProvider ?? "Open-Meteo"}`;
  }
  return "Origem da condição atual não informada";
}

function rainLabel(day: DailyForecast) {
  return day.rainChance === null ? "Probabilidade não informada" : `${day.rainChance}%`;
}

function QualityLine({ data }: { data: WeatherIntelligenceData }) {
  const quality = data.weather.quality;

  return (
    <div className={`daily-quality daily-quality--${quality.confidence}`}>
      {quality.confidence === "high" ? (
        <CheckCircle2 aria-hidden="true" />
      ) : (
        <Info aria-hidden="true" />
      )}
      <span>{confidenceLabels[quality.confidence]}</span>
      <small>{quality.score}/100</small>
    </div>
  );
}

function ForecastUnavailable({ tomorrow = false }: { tomorrow?: boolean }) {
  return (
    <section className="daily-unavailable" aria-labelledby="daily-unavailable-title">
      <p>Tempo Pelotas</p>
      <h1 id="daily-unavailable-title">
        {tomorrow ? "A previsão de amanhã está em atualização" : "A previsão de hoje está em atualização"}
      </h1>
      <span>
        As fontes não forneceram dados suficientes para montar esta página. Nenhum valor demonstrativo
        foi inserido.
      </span>
      <Link to="/">
        <ArrowLeft aria-hidden="true" /> Voltar à visão geral
      </Link>
    </section>
  );
}

function ActiveAlert({ data }: { data: WeatherIntelligenceData }) {
  const active = data.weather.alerts.filter((alert) => alert.period === "active");
  const upcoming = data.weather.alerts.filter((alert) => alert.period === "upcoming");
  const alert = active[0] ?? upcoming[0] ?? null;

  if (!alert) return null;

  return (
    <section className="daily-alert" aria-label="Aviso meteorológico relevante">
      <AlertTriangle aria-hidden="true" />
      <div>
        <strong>{alert.period === "active" ? "Aviso oficial em vigor" : "Aviso oficial programado"}</strong>
        <span>{alert.headline || alert.event}</span>
      </div>
      <Link to="/alertas">
        Consultar aviso <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

function RelatedLinks({ tomorrow = false }: { tomorrow?: boolean }) {
  const links = tomorrow
    ? [
        ["/tempo-hoje-pelotas", "Condição atual", "Previsão de hoje"],
        ["/previsao-7-dias-pelotas", "Planejamento", "Previsão para 7 dias"],
        ["/chuva-em-pelotas", "Precipitação", "Chuva em Pelotas"],
        ["/vento-em-pelotas", "Condição regional", "Vento e rajadas"],
      ]
    : [
        ["/tempo-amanha-pelotas", "Próximo período", "Previsão para amanhã"],
        ["/previsao-7-dias-pelotas", "Planejamento", "Previsão para 7 dias"],
        ["/radar-e-satelite-pelotas", "Observação regional", "Radar e satélite"],
      ];

  return (
    <nav className="daily-related" aria-label="Continue consultando o Tempo Pelotas">
      {links.map(([to, eyebrow, label]) => (
        <Link to={to} key={to}>
          <span>
            <small>{eyebrow}</small>
            <strong>{label}</strong>
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}

export function TodayForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const current = weather.current;
  const today = weather.daily[0];

  if (!current && !today && weather.hourly.length === 0) return <ForecastUnavailable />;

  const condition = current?.condition ?? (today ? conditionLabels[today.icon] : "Tempo em atualização");
  const title = current?.temperature !== null && current?.temperature !== undefined
    ? `${condition} agora, com ${current.temperature}° em Pelotas.`
    : today
      ? `Hoje em Pelotas: ${today.min}° a ${today.max}°.`
      : "Tempo hoje em Pelotas.";
  const lead = current && today
    ? `A sensação é de ${current.feelsLike ?? "valor não informado"}°. Para o restante do dia, a previsão varia entre ${today.min}° e ${today.max}°, com ${rainLabel(today)} de chance máxima de chuva.`
    : recoveredData.brief.summary;
  const observed = weather.quality.currentSource === "embrapa";

  return (
    <div className="daily-page daily-page--today">
      <header className="daily-hero daily-hero--today" id="agora">
        <div className="daily-hero-copy">
          <Link className="daily-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Visão geral
          </Link>
          <p className="daily-kicker">Hoje · {todayLabel()}</p>
          <h1>{title}</h1>
          <p className="daily-lead">{lead}</p>

          <dl className="daily-hero-facts" aria-label="Resumo da previsão de hoje">
            <div>
              <dt>Agora</dt>
              <dd>{current?.temperature === null || !current ? "—" : `${current.temperature}°`}</dd>
            </div>
            <div>
              <dt>Faixa prevista</dt>
              <dd>{today ? `${today.min}° / ${today.max}°` : "—"}</dd>
            </div>
            <div>
              <dt>Chuva</dt>
              <dd>{today ? rainLabel(today) : "—"}</dd>
            </div>
          </dl>
        </div>

        <aside className="daily-condition-card" aria-label="Condição atual em Pelotas">
          <div className="daily-condition-topline">
            <span>{observed ? "Observado agora" : "Estimativa atual"}</span>
            <QualityLine data={recoveredData} />
          </div>
          <div className="daily-condition-reading">
            <span className="daily-weather-icon">
              <WeatherGlyph name={current?.icon ?? today?.icon ?? null} size={82} />
            </span>
            <div>
              <strong>{current?.temperature === null || !current ? "—" : `${current.temperature}°`}</strong>
              <span>{condition}</span>
            </div>
          </div>
          <dl className="daily-condition-details">
            <div>
              <dt>Sensação</dt>
              <dd>{formatNumber(current?.feelsLike ?? null, "°")}</dd>
            </div>
            <div>
              <dt>Umidade</dt>
              <dd>{formatNumber(current?.humidity ?? null, "%")}</dd>
            </div>
            <div>
              <dt>Vento</dt>
              <dd>{formatNumber(current?.windSpeed ?? null, " km/h")}</dd>
            </div>
          </dl>
          <p className="daily-condition-source">
            <span>{sourceLabel(recoveredData)}</span>
            <small>Atualizado em {formatDateTime(current?.observedAt ?? weather.source.fetchedAt)}</small>
          </p>
        </aside>
      </header>

      <nav className="daily-chapters" aria-label="Navegação da previsão de hoje">
        <a href="#agora">Agora</a>
        <a href="#medicao-atual">Medição local</a>
        <a href="#proximas-horas">Próximas horas</a>
        <a href="#leitura-do-dia">Leitura do dia</a>
        <a href="#como-interpretar-hoje">Como interpretar</a>
      </nav>

      <ActiveAlert data={recoveredData} />

      {current ? (
        <section className="daily-metrics" id="medicao-atual" aria-label="Detalhes da condição atual">
          <article><Droplets aria-hidden="true" /><span>Umidade</span><strong>{formatNumber(current.humidity, "%")}</strong></article>
          <article><Wind aria-hidden="true" /><span>Vento médio</span><strong>{formatNumber(current.windSpeed, " km/h")}</strong></article>
          <article><Navigation aria-hidden="true" /><span>Direção</span><strong>{current.windDirection ?? "Não informada"}</strong></article>
          <article><Gauge aria-hidden="true" /><span>Pressão</span><strong>{formatNumber(current.pressure, " hPa")}</strong></article>
          <article><Sunrise aria-hidden="true" /><span>Nascer do sol</span><strong>{current.sunrise ?? "—"}</strong></article>
          <article><Sunset aria-hidden="true" /><span>Pôr do sol</span><strong>{current.sunset ?? "—"}</strong></article>
        </section>
      ) : null}

      {weather.hourly.length > 0 ? (
        <section className="daily-section daily-hourly" id="proximas-horas" aria-labelledby="today-hours-title">
          <header className="daily-section-heading">
            <div><p className="daily-kicker">Próximas horas</p><h2 id="today-hours-title">Como temperatura, chuva e vento devem evoluir</h2></div>
            <Link to="/chuva-em-pelotas">Detalhes da chuva</Link>
          </header>
          <div className="daily-hourly-track" aria-label="Previsão horária para hoje">
            {weather.hourly.slice(0, 12).map((hour, index) => (
              <article className={index === 0 ? "is-current" : undefined} key={hour.time} aria-label={`${hour.time}: ${hour.temperature} graus, ${hour.precipitationProbability === null ? "probabilidade de chuva não informada" : `${hour.precipitationProbability}% de chance de chuva`} e vento de ${hour.windSpeed} quilômetros por hora`}>
                <span>{index === 0 ? "Agora" : hour.time}</span>
                <WeatherGlyph name={hour.icon} />
                <strong>{hour.temperature}°</strong>
                <small>{hour.precipitationProbability === null ? "Chuva não informada" : `${hour.precipitationProbability}% chuva`}</small>
                <small>{hour.windSpeed} km/h de vento</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="daily-section daily-guidance" id="leitura-do-dia" aria-labelledby="today-reading-title">
        <header className="daily-section-heading">
          <div><p className="daily-kicker">Leitura do dia</p><h2 id="today-reading-title">O que os dados indicam neste momento</h2></div>
        </header>
        <div className="daily-guidance-grid">
          <article>
            <strong>Destaques</strong>
            {recoveredData.brief.highlights.length ? <ul>{recoveredData.brief.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Sem destaques adicionais para o período.</p>}
          </article>
          <article className="is-caution">
            <strong>Pontos de atenção</strong>
            {recoveredData.brief.cautions.length ? <ul>{recoveredData.brief.cautions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Não há pontos de atenção relevantes nas fontes consultadas.</p>}
          </article>
        </div>
      </section>

      <RelatedLinks />
      <aside className="daily-source-note"><Info aria-hidden="true" /><p>Dados consolidados em {formatDateTime(weather.source.fetchedAt)} a partir de Embrapa, INMET, CPPMet/UFPel e {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}. Medição e previsão permanecem identificadas separadamente.</p></aside>
    </div>
  );
}

function tomorrowRainAnswer(tomorrow: DailyForecast) {
  const probability = tomorrow.rainChance === null
    ? "A fonte ativa não informou probabilidade percentual de chuva"
    : `A maior probabilidade prevista é de ${tomorrow.rainChance}%`;
  return `${probability}, com volume diário estimado de ${tomorrow.precipitationMm} mm.`;
}

function tomorrowWindAnswer(tomorrow: DailyForecast) {
  return tomorrow.windGust === null
    ? "A fonte ativa não informou previsão de rajadas para amanhã."
    : `As rajadas podem chegar a ${tomorrow.windGust} km/h durante o dia.`;
}

export function TomorrowForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const today = weather.daily[0];
  const tomorrow = weather.daily[1];

  if (!tomorrow) return <ForecastUnavailable tomorrow />;

  const condition = conditionLabels[tomorrow.icon];
  const amplitude = Math.max(0, tomorrow.max - tomorrow.min);
  const faqs = [
    { question: "Qual será a temperatura amanhã em Pelotas?", answer: `A previsão indica máxima de ${tomorrow.max}°C e mínima de ${tomorrow.min}°C em Pelotas.` },
    { question: "Vai chover amanhã em Pelotas?", answer: tomorrowRainAnswer(tomorrow) },
    { question: "Como estará o vento amanhã em Pelotas?", answer: tomorrowWindAnswer(tomorrow) },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="daily-page daily-page--tomorrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />

      <header className="daily-hero daily-hero--tomorrow" id="resumo-amanha">
        <div className="daily-hero-copy">
          <Link className="daily-back-link" to="/tempo-hoje-pelotas"><ArrowLeft aria-hidden="true" /> Previsão de hoje</Link>
          <p className="daily-kicker">Amanhã · {tomorrow.weekday} · {tomorrow.date}</p>
          <h1>{condition} em Pelotas, com {tomorrow.min}° a {tomorrow.max}°.</h1>
          <p className="daily-lead">
            {tomorrow.rainChance === null ? "A probabilidade de chuva não foi publicada" : `A chance máxima de chuva é de ${tomorrow.rainChance}%`}, com {tomorrow.precipitationMm} mm previstos e {tomorrow.windGust === null ? "rajadas não informadas" : `rajadas de até ${tomorrow.windGust} km/h`}.
          </p>
          <dl className="daily-hero-facts" aria-label="Resumo da previsão de amanhã">
            <div><dt>Máxima</dt><dd>{tomorrow.max}°</dd></div>
            <div><dt>Mínima</dt><dd>{tomorrow.min}°</dd></div>
            <div><dt>Chuva</dt><dd>{rainLabel(tomorrow)}</dd></div>
          </dl>
        </div>

        <aside className="daily-condition-card daily-condition-card--tomorrow" aria-label="Planejamento meteorológico para amanhã">
          <div className="daily-condition-topline"><span>Planejamento do dia</span><QualityLine data={recoveredData} /></div>
          <div className="daily-condition-reading">
            <span className="daily-weather-icon"><WeatherGlyph name={tomorrow.icon} size={82} /></span>
            <div><strong>{tomorrow.max}°</strong><span>{condition}</span><small>Mínima de {tomorrow.min}° · amplitude de {amplitude}°</small></div>
          </div>
          <dl className="daily-condition-details">
            <div><dt>Volume</dt><dd>{tomorrow.precipitationMm} mm</dd></div>
            <div><dt>Rajada</dt><dd>{tomorrow.windGust === null ? "—" : `${tomorrow.windGust} km/h`}</dd></div>
            <div><dt>Modelo</dt><dd>{weather.quality.forecastProvider ?? "Disponível"}</dd></div>
          </dl>
          <p className="daily-condition-source"><span>Previsão por modelo, complementada por fontes oficiais e regionais</span><small>Consolidada em {formatDateTime(weather.source.fetchedAt)}</small></p>
        </aside>
      </header>

      <nav className="daily-chapters" aria-label="Navegação da previsão de amanhã">
        <a href="#resumo-amanha">Resumo</a>
        <a href="#indicadores-amanha">Indicadores</a>
        <a href="#planejamento-amanha">Planejamento</a>
        <a href="#perguntas-amanha">Perguntas</a>
        <a href="#proximos-passos-amanha">Continue consultando</a>
      </nav>

      <ActiveAlert data={recoveredData} />

      <section className="daily-metrics daily-metrics--tomorrow" id="indicadores-amanha" aria-label="Indicadores da previsão para amanhã">
        <article><Droplets aria-hidden="true" /><span>Chance de chuva</span><strong>{rainLabel(tomorrow)}</strong><small>Maior probabilidade prevista</small></article>
        <article><CloudRain aria-hidden="true" /><span>Volume previsto</span><strong>{tomorrow.precipitationMm} mm</strong><small>Acumulado diário estimado</small></article>
        <article><Wind aria-hidden="true" /><span>Rajada mais forte</span><strong>{tomorrow.windGust === null ? "Não informada" : `${tomorrow.windGust} km/h`}</strong><small>Maior rajada publicada</small></article>
        <article><Thermometer aria-hidden="true" /><span>Amplitude térmica</span><strong>{amplitude}°C</strong><small>Diferença entre máxima e mínima</small></article>
      </section>

      <section className="daily-section daily-planning" id="planejamento-amanha" aria-labelledby="tomorrow-planning-title">
        <header className="daily-section-heading"><div><p className="daily-kicker">Planejamento do próximo dia</p><h2 id="tomorrow-planning-title">Como transformar a previsão em decisão prática</h2></div><Link to="/previsao-7-dias-pelotas">Comparar com a semana</Link></header>
        <div className="daily-planning-grid">
          <article><span>01</span><strong>Chuva e volume</strong><p>{tomorrowRainAnswer(tomorrow)}</p></article>
          <article><span>02</span><strong>Vento e rajadas</strong><p>{tomorrowWindAnswer(tomorrow)}</p></article>
          <article><span>03</span><strong>Comparação com hoje</strong><p>{today ? `Hoje, a faixa prevista é de ${today.min}°C a ${today.max}°C. Amanhã, varia de ${tomorrow.min}°C a ${tomorrow.max}°C.` : "A previsão de hoje não está disponível para comparação neste momento."}</p></article>
          <article><span>04</span><strong>Atualizações</strong><p>Os modelos recebem novas rodadas. Consulte novamente antes de atividades externas e acompanhe os avisos oficiais.</p></article>
        </div>
      </section>

      <section className="daily-section daily-faq" id="perguntas-amanha" aria-labelledby="tomorrow-faq-title">
        <header className="daily-section-heading"><div><p className="daily-kicker">Respostas diretas</p><h2 id="tomorrow-faq-title">Perguntas sobre o tempo de amanhã</h2></div><p>As respostas usam somente os valores publicados pela previsão ativa.</p></header>
        <div className="daily-faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <div id="proximos-passos-amanha"><RelatedLinks tomorrow /></div>
      <aside className="daily-source-note"><Info aria-hidden="true" /><p>Previsão consolidada em {formatDateTime(weather.source.fetchedAt)}. Fonte principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}, enriquecida com fontes oficiais e regionais quando disponíveis.</p></aside>
    </div>
  );
}
