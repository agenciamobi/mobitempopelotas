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
  Radio,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";

import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { WeatherSourceHealthStatus } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./MethodologyPage.css";

type MethodologyPageProps = {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
};

type SourceDisplayStatus = WeatherSourceHealthStatus | LaranjalLevelData["status"];

type SourceCard = {
  id: string;
  name: string;
  organization: string;
  role: string;
  description: string;
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
      "Quando uma instituição não responde, o portal usa contingência compatível ou informa a degradação em vez de ocultar o problema.",
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

function createSourceCards(weather: WeatherIntelligenceData, level: LaranjalLevelData) {
  const sourceHealth = weather.weather.sources;
  const forecastProvider = weather.weather.quality.forecastProvider ?? "Open-Meteo / MET Norway";
  const usesMetNorway = forecastProvider.toLocaleLowerCase("pt-BR").includes("norway");

  const cards: SourceCard[] = [
    {
      id: "embrapa",
      name: "Estação meteorológica de Pelotas",
      organization: "Embrapa Clima Temperado",
      role: "Medição local",
      description:
        "Temperatura, umidade, pressão, vento, extremos e acumulados observados no Posto Meteorológico da Sede.",
      status: sourceHealth.embrapa.status,
      fetchedAt: sourceHealth.embrapa.fetchedAt,
      url: weather.weather.observation.source.url,
      icon: Gauge,
    },
    {
      id: "inmet",
      name: "Avisos meteorológicos oficiais",
      organization: "INMET",
      role: "Alertas",
      description:
        "Avisos oficiais filtrados por relevância para Pelotas, Zona Sul e Rio Grande do Sul, sem alteração do conteúdo de segurança.",
      status: sourceHealth.inmet.status,
      fetchedAt: sourceHealth.inmet.fetchedAt,
      url: "https://avisos.inmet.gov.br/",
      icon: AlertTriangle,
    },
    {
      id: "cppmet",
      name: "Previsão regional e contexto técnico",
      organization: "CPPMet / UFPel",
      role: "Contexto regional",
      description:
        "Texto e faixa de temperatura publicados pelo Centro de Pesquisas e Previsões Meteorológicas da UFPel.",
      status: sourceHealth.cppmet.status,
      fetchedAt: sourceHealth.cppmet.fetchedAt,
      url: "https://wp.ufpel.edu.br/cppmet/",
      icon: Radio,
    },
    {
      id: "forecast",
      name: forecastProvider,
      organization: usesMetNorway ? "MET Norway" : "Open-Meteo",
      role: "Previsão global",
      description: usesMetNorway
        ? "Contingência global usada quando o provedor principal não responde, preservando como ausentes os campos que o modelo não publica."
        : "Condições modeladas, previsão horária e previsão diária usadas como base global para temperatura, chuva e vento.",
      status: sourceHealth["open-meteo"].status,
      fetchedAt: sourceHealth["open-meteo"].fetchedAt,
      url: usesMetNorway
        ? "https://api.met.no/weatherapi/locationforecast/2.0/documentation"
        : "https://open-meteo.com/",
      icon: CloudSun,
    },
    {
      id: "laranjal",
      name: "Estação Laranjal",
      organization: "LabHidroSens / UFPel",
      role: "Nível da Lagoa dos Patos",
      description:
        "Telemetria do sensor instalado na Praia do Laranjal, com última leitura, evolução recente e indicação explícita de atraso.",
      status: level.status,
      fetchedAt: level.source.fetchedAt,
      url: level.source.url,
      icon: Waves,
    },
  ];

  return cards;
}

function StatusIcon({ status }: { status: SourceDisplayStatus }) {
  if (status === "live") return <CheckCircle2 aria-hidden="true" />;
  if (status === "stale" || status === "partial") return <Clock3 aria-hidden="true" />;
  return <Info aria-hidden="true" />;
}

export function MethodologyPage({ weather, level }: MethodologyPageProps) {
  const cards = createSourceCards(weather, level);
  const operationalSources = cards.filter((source) => source.status === "live").length;
  const degradedSources = cards.filter(
    (source) => source.status === "partial" || source.status === "stale",
  ).length;
  const confidence = confidenceLabels[weather.weather.quality.confidence];
  const updatedAt = weather.weather.source.fetchedAt;

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
    <main className="methodology-page">
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
            O portal combina medições locais, alertas oficiais e modelos de previsão. Esta página
            mostra a função de cada fonte, como os dados são verificados e quais limites precisam ser
            considerados antes de tomar decisões.
          </p>
        </div>

        <aside className="methodology-quality" aria-label="Qualidade atual das informações">
          <div className="methodology-quality-heading">
            <Activity aria-hidden="true" />
            <span>Estado atual</span>
          </div>
          <strong>{weather.weather.quality.score}/100</strong>
          <span className={`methodology-confidence methodology-confidence-${weather.weather.quality.confidence}`}>
            {confidence}
          </span>
          <dl>
            <div>
              <dt>Operacionais</dt>
              <dd>{operationalSources}</dd>
            </div>
            <div>
              <dt>Com atenção</dt>
              <dd>{degradedSources}</dd>
            </div>
          </dl>
          <small>Consulta consolidada em {formatDateTime(updatedAt)}</small>
        </aside>
      </header>

      <section className="methodology-section" aria-labelledby="methodology-sources-title">
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Fontes consultadas</p>
            <h2 id="methodology-sources-title">Quem fornece cada informação</h2>
          </div>
          <p>
            O estado abaixo é calculado no carregamento desta página. Uma fonte pode estar funcionando,
            parcialmente disponível, atrasada ou indisponível.
          </p>
        </div>

        <div className="methodology-source-grid">
          {cards.map((source) => {
            const Icon = source.icon;
            return (
              <article key={source.id} className="methodology-source-card">
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
                <small>Consultada em {formatDateTime(source.fetchedAt)}</small>
                <a href={source.url} target="_blank" rel="noreferrer">
                  Consultar fonte original <ExternalLink aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="methodology-section methodology-pipeline" aria-labelledby="pipeline-title">
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Fluxo dos dados</p>
            <h2 id="pipeline-title">Como uma informação chega à tela</h2>
          </div>
          <p>
            A aplicação não escolhe apenas a resposta mais rápida. Ela registra origem, validade e
            divergências antes de montar o resumo final.
          </p>
        </div>

        <ol className="methodology-pipeline-grid">
          <li>
            <span>01</span>
            <Database aria-hidden="true" />
            <h3>Coleta</h3>
            <p>As fontes são consultadas no servidor com limite de tempo, cache e tratamento isolado de falhas.</p>
          </li>
          <li>
            <span>02</span>
            <FileCheck2 aria-hidden="true" />
            <h3>Normalização</h3>
            <p>Datas, unidades e campos são convertidos para um contrato comum sem preencher o que não existe.</p>
          </li>
          <li>
            <span>03</span>
            <Scale aria-hidden="true" />
            <h3>Comparação</h3>
            <p>Medições locais e modelos são comparados para detectar idade, inconsistências e degradação.</p>
          </li>
          <li>
            <span>04</span>
            <Sparkles aria-hidden="true" />
            <h3>Publicação</h3>
            <p>O resumo usa regras determinísticas e, quando habilitado, uma síntese textual sem alterar números.</p>
          </li>
        </ol>
      </section>

      <section className="methodology-section" aria-labelledby="methodology-rules-title">
        <div className="methodology-section-heading">
          <div>
            <p className="methodology-kicker">Regras de integridade</p>
            <h2 id="methodology-rules-title">Como evitamos apresentar certezas falsas</h2>
          </div>
          <p>
            O objetivo é facilitar a leitura sem apagar as limitações das fontes ou transformar uma
            estimativa em medição.
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

      <section className="methodology-section" aria-labelledby="methodology-differences-title">
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
              É o valor registrado por um instrumento em um local e horário específicos, como a
              temperatura da Embrapa ou o nível da Estação Laranjal.
            </p>
          </article>
          <article>
            <CloudSun aria-hidden="true" />
            <h3>Previsão</h3>
            <p>
              É uma estimativa produzida por modelos numéricos. Pode mudar entre atualizações e não
              representa uma garantia de que o fenômeno ocorrerá exatamente como previsto.
            </p>
          </article>
          <article>
            <Sparkles aria-hidden="true" />
            <h3>Interpretação</h3>
            <p>
              É o texto que organiza os dados para leitura rápida. A síntese não substitui os números,
              os avisos oficiais nem a avaliação de profissionais responsáveis.
            </p>
          </article>
        </div>
      </section>

      <section className="methodology-warning" aria-labelledby="methodology-warning-title">
        <AlertTriangle aria-hidden="true" />
        <div>
          <p className="methodology-kicker">Limite de uso</p>
          <h2 id="methodology-warning-title">O portal não substitui autoridades e serviços de emergência</h2>
          <p>
            O Tempo Pelotas não determina evacuações, não garante que uma rua irá alagar e não consegue
            assegurar disponibilidade contínua de sistemas externos. Em risco iminente, siga a Defesa
            Civil, o INMET, órgãos municipais e demais autoridades responsáveis.
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
          <Link className="methodology-secondary-action" to="/situacao-hidrologica-pelotas">
            Situação das águas
          </Link>
          <Link className="methodology-secondary-action" to="/alertas">
            Alertas oficiais
          </Link>
        </div>
      </section>
    </main>
  );
}
