import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
  CloudFog,
  CloudRain,
  Database,
  ExternalLink,
  Gauge,
  Info,
  Leaf,
  MapPinned,
  Snowflake,
  Sun,
  ThermometerSun,
  Waves,
  Wind,
} from "lucide-react";

import type { WeatherHistoryData } from "@/lib/weather/history.types";

import "./ClimatePelotasPage.css";

type SeasonId = "summer" | "autumn" | "winter" | "spring";

type Season = {
  id: SeasonId;
  title: string;
  months: string;
  headline: string;
  description: string;
  watch: string;
};

const seasons: Season[] = [
  {
    id: "summer",
    title: "Verão",
    months: "dezembro a fevereiro",
    headline: "Calor, umidade e mudanças rápidas",
    description:
      "Dias quentes podem alternar com passagens de frentes, vento e períodos de chuva. A sensação térmica depende bastante da umidade e da ventilação.",
    watch: "Calor, temporais, rajadas e chuva localizada.",
  },
  {
    id: "autumn",
    title: "Outono",
    months: "março a maio",
    headline: "Transição e grande variação de temperatura",
    description:
      "Massas de ar mais frio passam a chegar com maior frequência. Manhãs frias e tardes amenas podem ocorrer dentro da mesma semana.",
    watch: "Frentes frias, neblina, queda de temperatura e vento.",
  },
  {
    id: "winter",
    title: "Inverno",
    months: "junho a agosto",
    headline: "Frio, umidade e passagens de frentes",
    description:
      "Massas de ar frio podem reduzir bastante a temperatura. Umidade elevada, vento e céu encoberto alteram a sensação térmica e a visibilidade.",
    watch: "Geada, neblina, frio úmido, vento e baixa visibilidade.",
  },
  {
    id: "spring",
    title: "Primavera",
    months: "setembro a novembro",
    headline: "Aquecimento gradual e tempo instável",
    description:
      "A temperatura tende a subir, mas incursões de ar frio ainda são possíveis. Grandes diferenças de temperatura podem favorecer chuva, rajadas e trovoadas.",
    watch: "Mudanças bruscas, temporais, vento e retorno do calor.",
  },
];

function seasonForMonth(month: number): SeasonId {
  if (month === 12 || month <= 2) return "summer";
  if (month <= 5) return "autumn";
  if (month <= 8) return "winter";
  return "spring";
}

function currentSeason(history: WeatherHistoryData): Season {
  const reference = history.source.periodEnd
    ? new Date(`${history.source.periodEnd}T12:00:00-03:00`)
    : new Date();
  const month = Number.isNaN(reference.getTime()) ? new Date().getMonth() + 1 : reference.getMonth() + 1;
  return seasons.find((season) => season.id === seasonForMonth(month)) ?? seasons[0]!;
}

function formatDate(value: string | null) {
  if (!value) return "data não informada";
  const date = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
    .format(date)
    .replace(" de ", " ")
    .replace(".", "");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatNumber(value: number | null | undefined, unit: string, digits = 1) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
  }).format(value)}${unit}`;
}

function recentPeriod(history: WeatherHistoryData) {
  if (!history.source.periodStart || !history.source.periodEnd) return "Período recente indisponível";
  return `${formatDate(history.source.periodStart)} a ${formatDate(history.source.periodEnd)}`;
}

export function ClimatePelotasHero({ history }: { history: WeatherHistoryData }) {
  const season = currentSeason(history);
  const summary = history.summary;

  return (
    <section className="climate-hero" aria-labelledby="climate-hero-title">
      <div className="climate-hero__content">
        <span className="eyebrow">Estações do ano em Pelotas</span>
        <h1 id="climate-hero-title">Clima de Pelotas: chuva, frio, calor e vento ao longo do ano.</h1>
        <p>
          Entenda como o tempo costuma variar entre as estações, quais fatores influenciam a cidade e por
          que uma previsão de poucos dias não representa o clima de muitos anos.
        </p>
        <div className="climate-hero__actions">
          <a href="#estacoes-em-pelotas">
            Ver as estações do ano <ArrowRight aria-hidden="true" />
          </a>
          <Link to="/historico-climatico-pelotas">Ver os últimos 30 dias</Link>
        </div>
      </div>

      <aside className="climate-hero__panel" aria-label="Estação do ano e últimos 30 dias">
        <header>
          <span>Estação atual</span>
          <strong>{season.title}</strong>
          <small>{season.months}</small>
        </header>
        <div className="climate-hero__season">
          {season.id === "winter" ? (
            <Snowflake aria-hidden="true" />
          ) : season.id === "summer" ? (
            <Sun aria-hidden="true" />
          ) : (
            <Leaf aria-hidden="true" />
          )}
          <span>
            <strong>{season.headline}</strong>
            <small>{season.watch}</small>
          </span>
        </div>
        <div className="climate-hero__recent">
          <span>Últimos 30 dias</span>
          <strong>
            {formatNumber(summary?.averageMin, " °C")} a {formatNumber(summary?.averageMax, " °C")}
          </strong>
          <small>Médias das temperaturas mínimas e máximas dos dias disponíveis.</small>
        </div>
        <footer>
          <CalendarRange aria-hidden="true" />
          <span>{recentPeriod(history)}</span>
        </footer>
      </aside>
    </section>
  );
}

export function ClimatePelotasPage({ history }: { history: WeatherHistoryData }) {
  const season = currentSeason(history);
  const summary = history.summary;
  const hasRecentData = history.status !== "unavailable" && summary !== null;

  return (
    <div className="climate-page">
      <nav className="climate-chapters" aria-label="Seções sobre o clima de Pelotas">
        <a href="#tempo-e-clima"><span>01</span><strong>Tempo e clima</strong><small>Qual é a diferença</small></a>
        <a href="#estacoes-em-pelotas"><span>02</span><strong>Estações do ano</strong><small>Verão, outono, inverno e primavera</small></a>
        <a href="#fatores-locais"><span>03</span><strong>Por que varia</strong><small>Lagoa, oceano e frentes</small></a>
        <a href="#recorte-recente"><span>04</span><strong>Últimos 30 dias</strong><small>O que ocorreu recentemente</small></a>
        <a href="#fontes-climaticas"><span>05</span><strong>Onde consultar</strong><small>Clima, histórico e previsão</small></a>
      </nav>

      <section className="climate-definition" id="tempo-e-clima" aria-labelledby="climate-definition-title">
        <header>
          <div>
            <span className="eyebrow">Uma diferença importante</span>
            <h2 id="climate-definition-title">Tempo mostra o presente; clima descreve muitos anos</h2>
          </div>
          <p>
            Uma frente fria, uma semana chuvosa ou um mês quente descrevem um período específico. Para
            entender o clima, é preciso comparar muitos anos de observações organizadas e verificadas.
          </p>
        </header>
        <div>
          <article>
            <Gauge aria-hidden="true" />
            <span>Tempo de agora</span>
            <strong>Horas, dias e próximas semanas</strong>
            <p>Condição atual, previsão, chuva por horário, vento, radar e avisos oficiais.</p>
            <Link to="/tempo-hoje-pelotas">Ver o tempo de hoje <ArrowRight aria-hidden="true" /></Link>
          </article>
          <article>
            <CalendarRange aria-hidden="true" />
            <span>Clima</span>
            <strong>Comportamento de longo prazo</strong>
            <p>As Normais Climatológicas usam muitos anos de dados para representar médias e variações.</p>
            <a href="https://portal.inmet.gov.br/normais" target="_blank" rel="noopener noreferrer">
              Consultar Normais do INMET <ExternalLink aria-hidden="true" />
            </a>
          </article>
        </div>
      </section>

      <section className="climate-seasons" id="estacoes-em-pelotas" aria-labelledby="climate-seasons-title">
        <header>
          <div>
            <span className="eyebrow">Estações do ano</span>
            <h2 id="climate-seasons-title">O que costuma mudar ao longo do ano</h2>
          </div>
          <p>
            As descrições abaixo mostram tendências gerais. Frentes, massas de ar e áreas de alta ou baixa
            pressão podem produzir condições diferentes do esperado para a época.
          </p>
        </header>
        <div className="climate-season-grid">
          {seasons.map((item) => (
            <article key={item.id} className={item.id === season.id ? "is-current" : ""}>
              <div>
                {item.id === "winter" ? (
                  <Snowflake aria-hidden="true" />
                ) : item.id === "summer" ? (
                  <Sun aria-hidden="true" />
                ) : (
                  <Leaf aria-hidden="true" />
                )}
                {item.id === season.id ? <em>Atual</em> : null}
              </div>
              <span>{item.months}</span>
              <h3>{item.title}</h3>
              <strong>{item.headline}</strong>
              <p>{item.description}</p>
              <small>{item.watch}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="climate-factors" id="fatores-locais" aria-labelledby="climate-factors-title">
        <header>
          <div>
            <span className="eyebrow">Por que Pelotas varia tanto</span>
            <h2 id="climate-factors-title">Fatores que ajudam a explicar o clima local</h2>
          </div>
          <p>
            Nenhum fator atua sozinho. A combinação entre vento, umidade, relevo baixo e grandes superfícies
            de água ajuda a definir como cada situação é percebida na cidade e na orla.
          </p>
        </header>
        <div>
          <article>
            <Waves aria-hidden="true" />
            <span>Lagoa dos Patos e oceano</span>
            <strong>Umidade, brisa e variação de temperatura</strong>
            <p>A proximidade da água influencia umidade, vento local, neblina e mudanças de temperatura.</p>
          </article>
          <article>
            <Wind aria-hidden="true" />
            <span>Frentes e massas de ar</span>
            <strong>Mudanças rápidas de temperatura e vento</strong>
            <p>A chegada de ar frio ou quente pode alterar o tempo em poucas horas.</p>
          </article>
          <article>
            <CloudFog aria-hidden="true" />
            <span>Umidade e visibilidade</span>
            <strong>Neblina e nuvens baixas variam por local</strong>
            <p>Ar muito úmido, vento fraco e nuvens baixas podem reduzir a visibilidade.</p>
          </article>
          <article>
            <CloudRain aria-hidden="true" />
            <span>Chuva ao longo do ano</span>
            <strong>Chuva pode ocorrer em qualquer época</strong>
            <p>Frentes, áreas de baixa pressão e períodos instáveis podem provocar chuva em todas as estações.</p>
          </article>
        </div>
      </section>

      <section className="climate-recent" id="recorte-recente" aria-labelledby="climate-recent-title">
        <header>
          <div>
            <span className="eyebrow">O que ocorreu recentemente</span>
            <h2 id="climate-recent-title">Últimos 30 dias: dados recentes, não média histórica</h2>
          </div>
          <p>
            Estes valores descrevem somente o período indicado e o local de referência usado pela fonte.
            Eles não mostram, sozinhos, se o período ficou acima ou abaixo do clima normal.
          </p>
        </header>

        {hasRecentData && summary ? (
          <>
            <div className="climate-recent-grid">
              <article>
                <ThermometerSun aria-hidden="true" />
                <span>Média das máximas</span>
                <strong>{formatNumber(summary.averageMax, " °C")}</strong>
                <small>Temperaturas máximas dos dias disponíveis</small>
              </article>
              <article>
                <Snowflake aria-hidden="true" />
                <span>Média das mínimas</span>
                <strong>{formatNumber(summary.averageMin, " °C")}</strong>
                <small>Temperaturas mínimas dos dias disponíveis</small>
              </article>
              <article>
                <CloudRain aria-hidden="true" />
                <span>Chuva acumulada</span>
                <strong>{formatNumber(summary.totalPrecipitation, " mm")}</strong>
                <small>Soma da chuva informada no período</small>
              </article>
              <article>
                <Wind aria-hidden="true" />
                <span>Maior rajada</span>
                <strong>{formatNumber(summary.strongestWindGust, " km/h")}</strong>
                <small>Maior valor diário disponível</small>
              </article>
            </div>

            <div className="climate-recent-records">
              <div>
                <span>Dia mais quente do período</span>
                <strong>{formatNumber(summary.warmestDay.temperatureMax, " °C")}</strong>
                <small>{summary.warmestDay.weekday}, {summary.warmestDay.label}</small>
              </div>
              <div className="climate-temperature-range" aria-label="Faixa entre a menor mínima e a maior máxima do período">
                <span />
                <i style={{ left: "0%" }}><b>{formatNumber(summary.coldestDay.temperatureMin, " °C")}</b><small>menor mínima</small></i>
                <i style={{ left: "100%" }}><b>{formatNumber(summary.warmestDay.temperatureMax, " °C")}</b><small>maior máxima</small></i>
              </div>
              <div>
                <span>Noite mais fria do período</span>
                <strong>{formatNumber(summary.coldestDay.temperatureMin, " °C")}</strong>
                <small>{summary.coldestDay.weekday}, {summary.coldestDay.label}</small>
              </div>
            </div>

            <footer>
              <Database aria-hidden="true" />
              <span>
                <strong>{history.source.name}</strong>
                <small>{recentPeriod(history)} · atualizado em {formatDateTime(history.source.fetchedAt)}</small>
              </span>
              <Link to="/historico-climatico-pelotas">Ver valores diários <ArrowRight aria-hidden="true" /></Link>
            </footer>
          </>
        ) : (
          <div className="climate-recent-unavailable">
            <Info aria-hidden="true" />
            <div>
              <strong>Os últimos 30 dias estão temporariamente indisponíveis</strong>
              <p>A página mantém as explicações sobre o clima sem preencher a ausência dos dados com números simulados.</p>
            </div>
          </div>
        )}
      </section>

      <section className="climate-sources" id="fontes-climaticas" aria-labelledby="climate-sources-title">
        <div>
          <span className="eyebrow">Onde consultar</span>
          <h2 id="climate-sources-title">Clima, histórico e previsão respondem perguntas diferentes</h2>
          <p>
            As Normais Climatológicas representam muitos anos; o histórico mostra dias passados; e a previsão
            estima os próximos horários e dias.
          </p>
        </div>
        <div className="climate-source-grid">
          <a href="https://portal.inmet.gov.br/normais" target="_blank" rel="noopener noreferrer">
            <CalendarRange aria-hidden="true" />
            <span><strong>Normais Climatológicas do INMET</strong><small>Referências oficiais calculadas com muitos anos.</small></span>
            <ExternalLink aria-hidden="true" />
          </a>
          <Link to="/historico-climatico-pelotas">
            <Database aria-hidden="true" />
            <span><strong>Histórico de 30 dias</strong><small>Máximas, mínimas, chuva e rajadas dos últimos dias.</small></span>
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link to="/previsao-7-dias-pelotas">
            <CloudRain aria-hidden="true" />
            <span><strong>Previsão para 7 dias</strong><small>Tendência para os próximos dias.</small></span>
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link to="/metodologia">
            <MapPinned aria-hidden="true" />
            <span><strong>Como os dados funcionam</strong><small>Origem, atualização e limites das informações.</small></span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="climate-related" aria-labelledby="climate-related-title">
        <header>
          <span className="eyebrow">Acompanhe a situação atual</span>
          <h2 id="climate-related-title">Do clima de muitos anos ao tempo de hoje</h2>
        </header>
        <div>
          <Link to="/tempo-hoje-pelotas"><Gauge aria-hidden="true" /><span><strong>Tempo hoje</strong><small>Condição atual e próximas horas.</small></span></Link>
          <Link to="/meteograma-pelotas"><ThermometerSun aria-hidden="true" /><span><strong>Previsão hora a hora</strong><small>Temperatura, chuva, nuvens, pressão e vento.</small></span></Link>
          <Link to="/mapa-de-geadas-rio-grande-do-sul"><Snowflake aria-hidden="true" /><span><strong>Mapa de geadas</strong><small>Registros encontrados no Rio Grande do Sul.</small></span></Link>
          <Link to="/radar-e-satelite-pelotas"><CloudRain aria-hidden="true" /><span><strong>Radar e satélite</strong><small>Imagens e horários da região.</small></span></Link>
        </div>
      </section>
    </div>
  );
}
