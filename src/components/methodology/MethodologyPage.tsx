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
  high: "Boa confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

const statusLabels: Record<SourceDisplayStatus, string> = {
  live: "Disponível",
  partial: "Alguns dados",
  stale: "Leitura atrasada",
  unavailable: "Indisponível",
};

const validationRules = [
  {
    icon: FileCheck2,
    title: "Cada informação mantém sua origem",
    description:
      "A página identifica a instituição responsável e registra quando a fonte foi consultada.",
  },
  {
    icon: Clock3,
    title: "Dados antigos não aparecem como atuais",
    description:
      "Leituras atrasadas recebem aviso. Quando útil, o último valor conhecido continua visível com seu horário.",
  },
  {
    icon: Scale,
    title: "Diferenças entre fontes são consideradas",
    description:
      "Medições e previsões podem discordar porque usam locais, horários e métodos diferentes. Diferenças relevantes reduzem a confiança exibida.",
  },
  {
    icon: ShieldCheck,
    title: "Valores ausentes não viram zero",
    description:
      "Chance de chuva, rajada ou qualquer outro valor não informado continua marcado como indisponível.",
  },
  {
    icon: AlertTriangle,
    title: "Alertas oficiais não são inventados",
    description:
      "Os avisos vêm do INMET. O Tempo Pelotas não cria níveis de risco, áreas atingidas ou instruções de emergência.",
  },
  {
    icon: RefreshCw,
    title: "Falhas das fontes ficam visíveis",
    description:
      "Quando uma instituição não responde, a página usa outra fonte compatível ou informa a indisponibilidade.",
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
    role: "Imagens e ocorrências na região",
    description:
      available > 0
        ? `${available} de ${products.length} informações estão disponíveis. A REDEMET fornece radar, satélite regional e registros de trovoadas; o INMET complementa com imagens GOES da Região Sul.`
        : "Nenhuma imagem ou ocorrência pôde ser exibida nesta atualização. O portal não cria imagens ou ecos quando a fonte não responde.",
    detail:
      configured === products.length
        ? "Todos os serviços esperados foram reconhecidos."
        : `${configured} de ${products.length} serviços foram reconhecidos no servidor.`,
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
      role: "Medições locais",
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
      name: "Previsão e avisos oficiais",
      organization: "INMET",
      role: "Previsão municipal e alertas",
      description:
        "Previsão para Pelotas, avisos oficiais por área e informações da estação de referência. Esses dados complementam a medição atual da Embrapa.",
      detail: sourceHealth.inmet.reason,
      status: sourceHealth.inmet.status,
      fetchedAt: sourceHealth.inmet.fetchedAt,
      url: "https://portal.inmet.gov.br/",
      icon: AlertTriangle,
    },
    {
      id: "cppmet",
      category: "meteorology",
      name: "Previsão regional da UFPel",
      organization: "CPPMet / UFPel",
      role: "Previsão para a região",
      description:
        "Condição prevista, temperaturas e textos publicados pelo Centro de Pesquisas e Previsões Meteorológicas da UFPel.",
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
      name: "Previsão detalhada por hora e por dia",
      organization: forecastProvider,
      role: usesMetNorway ? "Previsão usada quando a principal falha" : "Previsão detalhada principal",
      description: usesMetNorway
        ? "O MET Norway é usado quando a previsão principal não entrega dados utilizáveis. Informações não publicadas continuam indisponíveis."
        : "O Open-Meteo fornece previsão detalhada de temperatura, chuva e vento. Esses valores são estimativas de modelo, não medições atuais.",
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
      role: "Medição local da Lagoa dos Patos",
      description:
        "Medição do nível na Praia do Laranjal, com última leitura, evolução recente e aviso quando o dado está atrasado.",
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
      role: "Nível do Guaíba em Porto Alegre",
      description:
        "Leitura usada para acompanhar a situação regional. O nível do Guaíba não determina sozinho o nível observado em Pelotas.",
      detail:
        guaiba.error ??
        `Estação usada nesta atualização: ${guaiba.station}. Outra fonte compatível pode ser usada quando necessário.`,
      status: guaiba.status,
      fetchedAt: guaiba.source.fetchedAt,
      url: guaiba.source.url,
      icon: Gauge,
    },
    {
      id: "lagoon-network",
      category: "hydrology",
      name: "Pontos da Lagoa dos Patos",
      organization: lagoon.source.organizations,
      role: "Medições em diferentes partes da Lagoa",
      description: `${lagoon.available} de ${lagoon.total} estações têm leitura disponível. A rede acompanha pontos entre Itapuã, Arambaré, São Lourenço do Sul, Rio Grande e São José do Norte.`,
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
      <small>Atualizada em {formatDateTime(source.fetchedAt)}</small>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir página de ${source.organization} em nova aba`}
      >
        Abrir página original <ExternalLink aria-hidden="true" />
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
    weather.intelligence.origin === "gemini" ? "Resumo com apoio do Gemini" : "Resumo montado pelo portal";
  const synthesisDetail =
    weather.intelligence.origin === "gemini"
      ? `${weather.intelligence.model ?? "Modelo configurado"}; os números continuam ligados às fontes identificadas.`
      : "O texto foi montado por regras do portal, sem completar números ausentes.";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Como os dados do Tempo Pelotas funcionam",
    description:
      "Origem dos dados meteorológicos e de nível, regras de verificação, fontes alternativas e limites do Tempo Pelotas.",
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
          <p className="methodology-kicker">Como os dados funcionam</p>
          <h1>De onde vêm as informações do Tempo Pelotas</h1>
          <p className="methodology-lead">
            O portal reúne medições locais, previsões, alertas oficiais, imagens e níveis da água. Esta
            página mostra quem fornece cada informação, quando ela foi atualizada e o que acontece quando
            uma fonte falha.
          </p>
        </div>

        <aside className="methodology-quality" aria-label="Qualidade dos dados e situação das fontes">
          <div className="methodology-quality-heading">
            <Activity aria-hidden="true" />
            <span>Qualidade dos dados do tempo</span>
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
              <dt>Disponíveis</dt>
              <dd>{operationalSources}</dd>
            </div>
            <div>
              <dt>Parciais ou atrasadas</dt>
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
              <small>Como o resumo foi escrito</small>
              <strong>{synthesisLabel}</strong>
              <span>{synthesisDetail}</span>
            </div>
          </div>
          <small>Última verificação em {formatDateTime(updatedAt)}</small>
        </aside>
      </header>

      <nav className="methodology-chapter-nav" aria-label="Navegação desta página">
        <a href="#fontes-ativas"><span>01</span> Fontes disponíveis</a>
        <a href="#fluxo-dados"><span>02</span> Caminho dos dados</a>
        <a href="#regras-integridade"><span>03</span> Verificações</a>
        <a href="#tipos-informacao"><span>04</span> Como interpretar</a>
        <a href="#limites-uso"><span>05</span> Limites de uso</a>
      </nav>

      <section
        className="methodology-section methodology-sources-section"
        id="fontes-ativas"
        aria-labelledby="methodology-sources-title"
      >
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Fontes desta atualização</p>
            <h2 id="methodology-sources-title">Quem fornece cada informação</h2>
          </div>
          <p>
            Uma fonte pode estar disponível, parcial, atrasada ou indisponível sem impedir que as demais
            continuem funcionando.
          </p>
        </div>

        <div className="methodology-source-groups">
          <section className="methodology-source-group is-meteorology" aria-labelledby="meteorology-sources-title">
            <header className="methodology-source-group-heading">
              <div>
                <span>01</span>
                <div>
                  <p>Previsão, alertas e medições</p>
                  <h3 id="meteorology-sources-title">Tempo</h3>
                </div>
              </div>
              <small>{meteorologyCards.length} fontes verificadas</small>
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
                  <p>Níveis e mudanças recentes</p>
                  <h3 id="hydrology-sources-title">Águas</h3>
                </div>
              </div>
              <small>{hydrologyCards.length} fontes verificadas</small>
            </header>
            <div className="methodology-source-grid">
              {hydrologyCards.map((source) => <SourceCardItem source={source} key={source.id} />)}
            </div>
            <p className="methodology-hydrology-note">
              Cada estação usa uma referência própria. Valores do Laranjal, do Cais Mauá e das estações
              da FURG/Portos RS não devem ser comparados diretamente como se partissem do mesmo zero.
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
            <p className="methodology-kicker">Caminho dos dados</p>
            <h2 id="pipeline-title">Como uma informação chega à tela</h2>
          </div>
          <p>
            Antes de exibir um valor, o portal verifica a origem, o horário, a unidade e possíveis
            diferenças entre as fontes disponíveis.
          </p>
        </div>

        <ol className="methodology-pipeline-grid">
          <li>
            <span>01</span>
            <Database aria-hidden="true" />
            <h3>Consulta</h3>
            <p>As fontes são consultadas separadamente para que uma falha não interrompa toda a página.</p>
          </li>
          <li>
            <span>02</span>
            <FileCheck2 aria-hidden="true" />
            <h3>Organização</h3>
            <p>Datas, horários e unidades são organizados sem preencher informações que não foram publicadas.</p>
          </li>
          <li>
            <span>03</span>
            <Scale aria-hidden="true" />
            <h3>Conferência</h3>
            <p>Medições e previsões são comparadas para identificar atrasos e diferenças importantes.</p>
          </li>
          <li>
            <span>04</span>
            <Sparkles aria-hidden="true" />
            <h3>Exibição</h3>
            <p>O resumo organiza as informações sem alterar os números recebidos das fontes.</p>
          </li>
        </ol>
      </section>

      <section className="methodology-section" id="regras-integridade" aria-labelledby="methodology-rules-title">
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Verificações do portal</p>
            <h2 id="methodology-rules-title">Como evitamos apresentar certezas falsas</h2>
          </div>
          <p>
            A página procura facilitar a leitura sem transformar previsão em medição ou esconder que uma
            fonte está atrasada ou indisponível.
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
            <p className="methodology-kicker">Como interpretar</p>
            <h2 id="methodology-differences-title">Medição, previsão e resumo não são a mesma coisa</h2>
          </div>
        </div>

        <div className="methodology-definition-grid">
          <article>
            <Gauge aria-hidden="true" />
            <h3>Medição</h3>
            <p>
              É o valor registrado por um instrumento em local e horário específicos, como a temperatura
              da Embrapa ou os níveis do Laranjal e do Cais Mauá.
            </p>
          </article>
          <article>
            <CloudSun aria-hidden="true" />
            <h3>Previsão</h3>
            <p>
              É uma estimativa produzida por modelos ou por um órgão meteorológico. Pode mudar entre
              atualizações e não garante que o fenômeno ocorrerá exatamente como indicado.
            </p>
          </article>
          <article>
            <Sparkles aria-hidden="true" />
            <h3>Resumo</h3>
            <p>
              É o texto que organiza os dados para leitura rápida. Ele não substitui os números, os
              alertas oficiais ou a avaliação de profissionais responsáveis.
            </p>
          </article>
        </div>
      </section>

      <section className="methodology-warning" id="limites-uso" aria-labelledby="methodology-warning-title">
        <AlertTriangle aria-hidden="true" />
        <div>
          <p className="methodology-kicker">Limites de uso</p>
          <h2 id="methodology-warning-title">O portal não substitui autoridades e serviços de emergência</h2>
          <p>
            O Tempo Pelotas não determina evacuações, não garante que uma rua irá alagar e não calcula o
            nível futuro do Laranjal apenas pelo Guaíba. Em risco iminente, siga a Defesa Civil, o INMET e
            as autoridades responsáveis.
          </p>
        </div>
      </section>

      <section className="methodology-actions" aria-label="Outras páginas para consulta">
        <div>
          <p className="methodology-kicker">Consulte as informações</p>
          <h2>Abra a página adequada para cada necessidade</h2>
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
