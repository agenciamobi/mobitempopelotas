import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CloudSun,
  Database,
  ExternalLink,
  FileCheck2,
  Gauge,
  Info,
  Radar,
  Radio,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";

import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { RedemetOverview } from "@/lib/redemet/redemet.types";
import type { WeatherSourceHealthStatus } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./MethodologyPage.css";
import "./MethodologyPageRefinement.css";

type MethodologyPageProps = {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
  redemet: RedemetOverview;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};

type SourceDisplayStatus =
  | WeatherSourceHealthStatus
  | LaranjalLevelData["status"]
  | GuaibaObservationData["status"]
  | LagoonMonitoringNetworkData["status"];

type SourceCategory = "meteorology" | "hydrology";

type SourceCard = {
  id: string;
  category: SourceCategory;
  name: string;
  organization: string;
  role: string;
  description: string;
  detail: string | null;
  status: SourceDisplayStatus;
  fetchedAt: string;
  url: string;
  icon: LucideIcon;
};

const confidenceLabels = {
  high: "Alta confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

const statusLabels: Record<SourceDisplayStatus, string> = {
  live: "Operacional",
  partial: "Parcial",
  stale: "Leitura atrasada",
  unavailable: "Indisponível",
};

const validationRules = [
  {
    icon: FileCheck2,
    title: "A fonte acompanha cada informação",
    description:
      "O portal identifica a instituição responsável, registra o horário da consulta e preserva a origem dos campos usados.",
  },
  {
    icon: Clock3,
    title: "Dados antigos não são tratados como atuais",
    description:
      "Leituras atrasadas são sinalizadas. Quando possível, o último valor conhecido continua disponível com sua idade explícita.",
  },
  {
    icon: Scale,
    title: "Divergências reduzem a confiança",
    description:
      "Medições e modelos são comparados. Diferenças relevantes entram no cálculo de qualidade e aparecem nas observações da previsão.",
  },
  {
    icon: ShieldCheck,
    title: "Campos ausentes permanecem ausentes",
    description:
      "Probabilidade, rajada ou qualquer outro valor não informado pela fonte é exibido como não disponível, sem aproximações artificiais.",
  },
  {
    icon: AlertTriangle,
    title: "Alertas oficiais não são recriados",
    description:
      "Os avisos apresentados vêm do INMET. O Tempo Pelotas não inventa níveis de risco, áreas atingidas ou orientações de emergência.",
  },
  {
    icon: RefreshCw,
    title: "Falhas externas ficam visíveis",
    description:
      "Quando uma instituição não responde, o portal usa uma contingência compatível ou informa a degradação em vez de ocultar o problema.",
  },
] as const;

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function latestTimestamp(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter(Number.isFinite);

  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function redemetSourceCard(redemet: RedemetOverview): SourceCard {
  const products = [redemet.radar, redemet.satellite, redemet.inmetSatellite, redemet.storms];
  const configured = products.filter((source) => source.configured).length;
  const available = products.filter((source) => source.available).length;
  const fetchedAt =
    latestTimestamp(products.map((source) => source.updatedAt)) ?? new Date().toISOString();
  const status: SourceDisplayStatus =
    available === products.length ? "live" : available > 0 ? "partial" : "unavailable";

  return {
    id: "redemet",
    category: "meteorology",
    name: "Radar, satélites e trovoadas",
    organization: "REDEMET / DECEA e INMET",
    role: "Observação visual regional",
    description:
      available > 0
        ? `${available} de ${products.length} produtos responderam nesta consulta. A REDEMET fornece radar, satélite regional e ocorrências de trovoadas; o INMET complementa com imagens GOES da Região Sul.`
        : "Nenhum quadro utilizável foi entregue nesta consulta. O portal não cria imagens, ecos ou ocorrências quando a fonte não responde.",
    detail:
      configured === products.length
        ? `${configured} integrações estão configuradas no servidor.`
        : `${configured} de ${products.length} integrações foram reconhecidas no ambiente.`,
    status,
    fetchedAt,
    url: "https://redemet.decea.mil.br/",
    icon: Radar,
  };
}

function createSourceCards({
  weather,
  level,
  redemet,
  guaiba,
  lagoon,
}: MethodologyPageProps): SourceCard[] {
  const sourceHealth = weather.weather.sources;
  const forecastSource = weather.weather.quality.forecastSource ?? "open-meteo";
  const forecastHealth = sourceHealth[forecastSource];
  const usesMetNorway = forecastSource === "met-norway";
  const forecastProvider =
    weather.weather.quality.forecastProvider ?? (usesMetNorway ? "MET Norway" : "Open-Meteo");

  return [
    {
      id: "embrapa",
      category: "meteorology",
      name: "Estação meteorológica de Pelotas",
      organization: "Embrapa Clima Temperado",
      role: "Medição local observada",
      description:
        "Temperatura, umidade, pressão, vento, extremos e acumulados medidos no Posto Meteorológico da Sede, em Pelotas.",
      detail: sourceHealth.embrapa.reason,
      status: sourceHealth.embrapa.status,
      fetchedAt: sourceHealth.embrapa.fetchedAt,
      url: weather.weather.observation.source.url,
      icon: Gauge,
    },
    {
      id: "inmet",
      category: "meteorology",
      name: "Previsão, avisos e referência oficial",
      organization: "INMET",
      role: "Previsão e alertas oficiais",
      description:
        "Previsão municipal para Pelotas, avisos oficiais por área e metadados da estação de referência. Esses dados complementam, sem substituir, a medição atual da Embrapa.",
      detail: sourceHealth.inmet.reason,
      status: sourceHealth.inmet.status,
      fetchedAt: sourceHealth.inmet.fetchedAt,
      url: "https://portal.inmet.gov.br/",
      icon: AlertTriangle,
    },
    {
      id: "cppmet",
      category: "meteorology",
      name: "Previsão regional e contexto técnico",
      organization: "CPPMet / UFPel",
      role: "Contexto meteorológico regional",
      description:
        "Texto técnico, condição prevista e faixa de temperatura publicados pelo Centro de Pesquisas e Previsões Meteorológicas da UFPel.",
      detail: sourceHealth.cppmet.reason,
      status: sourceHealth.cppmet.status,
      fetchedAt: sourceHealth.cppmet.fetchedAt,
      url: "https://wp.ufpel.edu.br/cppmet/",
      icon: Radio,
    },
    redemetSourceCard(redemet),
    {
      id: "forecast",
      category: "meteorology",
      name: "Previsão horária e diária detalhada",
      organization: forecastProvider,
      role: usesMetNorway ? "Modelo global de contingência" : "Modelo global principal",
      description: usesMetNorway
        ? "O MET Norway é usado quando o provedor principal não entrega uma previsão utilizável. Campos não publicados pelo modelo permanecem ausentes."
        : "O Open-Meteo fornece a base global detalhada de temperatura, chuva e vento. Esses valores são previsão por modelo, não medição atual.",
      detail: forecastHealth.reason,
      status: forecastHealth.status,
      fetchedAt: forecastHealth.fetchedAt,
      url: usesMetNorway
        ? "https://api.met.no/weatherapi/locationforecast/2.0/documentation"
        : "https://open-meteo.com/",
      icon: CloudSun,
    },
    {
      id: "laranjal",
      category: "hydrology",
      name: "Estação Laranjal",
      organization: "LabHidroSens / UFPel",
      role: "Referência local da Lagoa dos Patos",
      description:
        "Telemetria do sensor instalado na Praia do Laranjal, com última leitura, evolução recente e indicação explícita de atraso.",
      detail: level.error,
      status: level.status,
      fetchedAt: level.source.fetchedAt,
      url: level.source.url,
      icon: Waves,
    },
    {
      id: "guaiba",
      category: "hydrology",
      name: guaiba.station,
      organization: guaiba.source.name,
      role: "Contexto regional do Guaíba",
      description:
        "Leitura do nível em Porto Alegre usada como referência regional. O Guaíba não determina sozinho o nível observado em Pelotas.",
      detail:
        guaiba.error ??
        `Fonte selecionada nesta consulta: ${guaiba.station}, com contingência automática quando necessário.`,
      status: guaiba.status,
      fetchedAt: guaiba.source.fetchedAt,
      url: guaiba.source.url,
      icon: Gauge,
    },
    {
      id: "lagoon-network",
      category: "hydrology",
      name: "Rede da Lagoa dos Patos",
      organization: lagoon.source.organizations,
      role: "Monitoramento hidrológico regional",
      description: `${lagoon.available} de ${lagoon.total} estações possuem leitura nesta consulta. A rede acompanha pontos entre Itapuã, Arambaré, São Lourenço do Sul, Rio Grande e São José do Norte.`,
      detail: lagoon.error ?? lagoon.source.reference,
      status: lagoon.status,
      fetchedAt: lagoon.source.fetchedAt,
      url: lagoon.source.url,
      icon: Database,
    },
  ];
}

function StatusIcon({ status }: { status: SourceDisplayStatus }) {
  if (status === "live") return <CheckCircle2 aria-hidden="true" />;
  if (status === "stale" || status === "partial") return <Clock3 aria-hidden="true" />;
  return <Info aria-hidden="true" />;
}

function SourceCardItem({ source }: { source: SourceCard }) {
  const Icon = source.icon;

  return (
    <article className="methodology-source-card" data-category={source.category}>
      <div className="methodology-source-topline">
        <span className="methodology-source-icon">
          <Icon aria-hidden="true" />
        </span>
        <span className={`methodology-source-status methodology-source-status-${source.status}`}>
          <StatusIcon status={source.status} /> {statusLabels[source.status]}
        </span>
      </div>
      <p>{source.organization}</p>
      <h3>{source.name}</h3>
      <span className="methodology-source-role">{source.role}</span>
      <div className="methodology-source-description">{source.description}</div>
      {source.detail ? <div className="methodology-source-detail">{source.detail}</div> : null}
      <small>Consultada em {formatDateTime(source.fetchedAt)}</small>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Consultar ${source.organization} em nova aba`}
      >
        Consultar fonte original <ExternalLink aria-hidden="true" />
      </a>
    </article>
  );
}

export function MethodologyPage(props: MethodologyPageProps) {
  const { weather } = props;
  const cards = createSourceCards(props);
  const meteorologyCards = cards.filter((source) => source.category === "meteorology");
  const hydrologyCards = cards.filter((source) => source.category === "hydrology");
  const operationalSources = cards.filter((source) => source.status === "live").length;
  const degradedSources = cards.filter(
    (source) => source.status === "partial" || source.status === "stale",
  ).length;
  const unavailableSources = cards.filter((source) => source.status === "unavailable").length;
  const confidence = confidenceLabels[weather.weather.quality.confidence];
  const updatedAt = latestTimestamp([
    weather.intelligence.generatedAt,
    ...cards.map((source) => source.fetchedAt),
  ]);
  const synthesisLabel =
    weather.intelligence.origin === "gemini" ? "Síntese assistida por Gemini" : "Regras determinísticas";
  const synthesisDetail =
    weather.intelligence.origin === "gemini"
      ? `${weather.intelligence.model ?? "Modelo configurado"}; os números permanecem vinculados às fontes estruturadas.`
      : "O texto foi montado por regras do portal, sem alterar ou completar números ausentes.";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Metodologia e fontes do Tempo Pelotas",
    description:
      "Origem dos dados meteorológicos e hidrológicos, critérios de validação, contingências e limites do Tempo Pelotas.",
    inLanguage: "pt-BR",
    dateModified: updatedAt,
    publisher: {
      "@type": "Organization",
      name: "Tempo Pelotas",
    },
  };

  return (
    <div className="methodology-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />

      <header className="methodology-hero">
        <div className="methodology-hero-copy">
          <Link className="methodology-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Tempo agora
          </Link>
          <p className="methodology-kicker">Transparência operacional</p>
          <h1>De onde vêm os dados do Tempo Pelotas</h1>
          <p className="methodology-lead">
            O portal combina medições locais, previsões oficiais e por modelos, observação regional e
            monitoramento das águas. Esta página mostra quais fontes responderam nesta consulta, a
            função de cada uma e os limites que precisam ser considerados.
          </p>
        </div>

        <aside className="methodology-quality" aria-label="Qualidade meteorológica e estado das fontes">
          <div className="methodology-quality-heading">
            <Activity aria-hidden="true" />
            <span>Qualidade meteorológica</span>
          </div>
          <strong>{weather.weather.quality.score}/100</strong>
          <span
            className={`methodology-confidence methodology-confidence-${weather.weather.quality.confidence}`}
          >
            {confidence}
          </span>
          <dl>
            <div>
              <dt>Fontes verificadas</dt>
              <dd>{cards.length}</dd>
            </div>
            <div>
              <dt>Operacionais</dt>
              <dd>{operationalSources}</dd>
            </div>
            <div>
              <dt>Com atenção</dt>
              <dd>{degradedSources}</dd>
            </div>
            <div>
              <dt>Indisponíveis</dt>
              <dd>{unavailableSources}</dd>
            </div>
          </dl>
          <div className="methodology-synthesis-state">
            <Sparkles aria-hidden="true" />
            <div>
              <small>Resumo exibido agora</small>
              <strong>{synthesisLabel}</strong>
              <span>{synthesisDetail}</span>
            </div>
          </div>
          <small>Consulta consolidada em {formatDateTime(updatedAt)}</small>
        </aside>
      </header>

      <nav className="methodology-chapter-nav" aria-label="Navegação desta página">
        <a href="#fontes-ativas"><span>01</span> Fontes ativas</a>
        <a href="#fluxo-dados"><span>02</span> Fluxo dos dados</a>
        <a href="#regras-integridade"><span>03</span> Integridade</a>
        <a href="#tipos-informacao"><span>04</span> Leitura correta</a>
        <a href="#limites-uso"><span>05</span> Limites de uso</a>
      </nav>

      <section
        className="methodology-section methodology-sources-section"
        id="fontes-ativas"
        aria-labelledby="methodology-sources-title"
      >
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Inventário desta consulta</p>
            <h2 id="methodology-sources-title">Quem fornece cada informação</h2>
          </div>
          <p>
            Os estados abaixo são calculados no carregamento da página. Uma fonte pode estar
            operacional, parcial, atrasada ou indisponível sem que as demais parem de funcionar.
          </p>
        </div>

        <div className="methodology-source-groups">
          <section className="methodology-source-group is-meteorology" aria-labelledby="meteorology-sources-title">
            <header className="methodology-source-group-heading">
              <div>
                <span>01</span>
                <div>
                  <p>Previsão e observação</p>
                  <h3 id="meteorology-sources-title">Meteorologia</h3>
                </div>
              </div>
              <small>{meteorologyCards.length} integrações verificadas</small>
            </header>
            <div className="methodology-source-grid">
              {meteorologyCards.map((source) => <SourceCardItem source={source} key={source.id} />)}
            </div>
          </section>

          <section className="methodology-source-group is-hydrology" aria-labelledby="hydrology-sources-title">
            <header className="methodology-source-group-heading">
              <div>
                <span>02</span>
                <div>
                  <p>Níveis e tendências</p>
                  <h3 id="hydrology-sources-title">Hidrologia</h3>
                </div>
              </div>
              <small>{hydrologyCards.length} integrações verificadas</small>
            </header>
            <div className="methodology-source-grid">
              {hydrologyCards.map((source) => <SourceCardItem source={source} key={source.id} />)}
            </div>
            <p className="methodology-hydrology-note">
              Cada régua possui referência vertical e cota próprias. Valores do Laranjal, Cais Mauá e
              das estações da FURG/Portos RS não devem ser comparados diretamente como se partissem do
              mesmo zero.
            </p>
          </section>
        </div>
      </section>

      <section
        className="methodology-section methodology-pipeline"
        id="fluxo-dados"
        aria-labelledby="pipeline-title"
      >
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Fluxo dos dados</p>
            <h2 id="pipeline-title">Como uma informação chega à tela</h2>
          </div>
          <p>
            A aplicação não escolhe apenas a resposta mais rápida. Ela registra origem, validade,
            idade e divergências antes de montar a apresentação final.
          </p>
        </div>

        <ol className="methodology-pipeline-grid">
          <li>
            <span>01</span>
            <Database aria-hidden="true" />
            <h3>Coleta</h3>
            <p>As fontes são consultadas no servidor com limite de tempo, cache e falhas isoladas.</p>
          </li>
          <li>
            <span>02</span>
            <FileCheck2 aria-hidden="true" />
            <h3>Normalização</h3>
            <p>Datas, unidades e campos são convertidos sem preencher o que a fonte não publicou.</p>
          </li>
          <li>
            <span>03</span>
            <Scale aria-hidden="true" />
            <h3>Comparação</h3>
            <p>Medições e modelos são comparados para detectar idade, inconsistências e degradação.</p>
          </li>
          <li>
            <span>04</span>
            <Sparkles aria-hidden="true" />
            <h3>Publicação</h3>
            <p>
              O resumo usa regras determinísticas e pode usar Gemini quando configurado, sem alterar
              os números estruturados.
            </p>
          </li>
        </ol>
      </section>

      <section className="methodology-section" id="regras-integridade" aria-labelledby="methodology-rules-title">
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Regras de integridade</p>
            <h2 id="methodology-rules-title">Como evitamos apresentar certezas falsas</h2>
          </div>
          <p>
            O objetivo é facilitar a leitura sem apagar limitações, transformar estimativa em medição
            ou esconder que uma integração está degradada.
          </p>
        </div>

        <div className="methodology-rules-grid">
          {validationRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <article key={rule.title}>
                <Icon aria-hidden="true" />
                <h3>{rule.title}</h3>
                <p>{rule.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="methodology-section" id="tipos-informacao" aria-labelledby="methodology-differences-title">
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Leitura correta</p>
            <h2 id="methodology-differences-title">Medição, previsão e interpretação não são a mesma coisa</h2>
          </div>
        </div>

        <div className="methodology-definition-grid">
          <article>
            <Gauge aria-hidden="true" />
            <h3>Medição</h3>
            <p>
              É o valor registrado por um instrumento em local e horário específicos, como a
              temperatura da Embrapa ou os níveis do Laranjal e do Cais Mauá.
            </p>
          </article>
          <article>
            <CloudSun aria-hidden="true" />
            <h3>Previsão</h3>
            <p>
              É uma estimativa produzida por modelos ou por um órgão meteorológico. Pode mudar entre
              atualizações e não garante a ocorrência exata do fenômeno.
            </p>
          </article>
          <article>
            <Sparkles aria-hidden="true" />
            <h3>Interpretação</h3>
            <p>
              É o texto que organiza os dados para leitura rápida. A síntese não substitui números,
              avisos oficiais nem a avaliação de profissionais responsáveis.
            </p>
          </article>
        </div>
      </section>

      <section className="methodology-warning" id="limites-uso" aria-labelledby="methodology-warning-title">
        <AlertTriangle aria-hidden="true" />
        <div>
          <p className="methodology-kicker">Limite de uso</p>
          <h2 id="methodology-warning-title">O portal não substitui autoridades e serviços de emergência</h2>
          <p>
            O Tempo Pelotas não determina evacuações, não garante que uma rua irá alagar e não prevê
            o nível do Laranjal apenas a partir do Guaíba. Em risco iminente, siga a Defesa Civil, o
            INMET, órgãos municipais e demais autoridades responsáveis.
          </p>
        </div>
      </section>

      <section className="methodology-actions" aria-label="Próximas consultas">
        <div>
          <p className="methodology-kicker">Consulte os dados</p>
          <h2>Veja a informação no contexto em que será usada</h2>
        </div>
        <div>
          <Link className="methodology-primary-action" to="/tempo-hoje-pelotas">
            Previsão de hoje <ArrowRight aria-hidden="true" />
          </Link>
          <Link className="methodology-secondary-action" to="/radar-e-satelite-pelotas">Radar e satélite</Link>
          <Link className="methodology-secondary-action" to="/situacao-hidrologica-pelotas">Situação das águas</Link>
          <Link className="methodology-secondary-action" to="/alertas">Alertas oficiais</Link>
        </div>
      </section>
    </div>
  );
}
