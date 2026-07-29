import {
  Activity,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock3,
  CloudRain,
  Database,
  Target,
  Thermometer,
} from "lucide-react";

import type {
  ForecastAccuracyProvider,
  ForecastAccuracySummary,
} from "@/lib/weather/forecast-accuracy.server";

import "./ForecastAccuracyPanel.css";

const statusCopy = {
  collecting: {
    label: "Coleta iniciada",
    title: "A avaliação está formando sua primeira amostra",
    description:
      "As previsões já estão sendo arquivadas. A primeira comparação será publicada depois que houver um dia completo observado pela Embrapa.",
  },
  building: {
    label: "Amostra inicial",
    title: "Resultados preliminares, ainda sem ranking definitivo",
    description:
      "Já existem comparações válidas, mas o período ainda é curto. Os indicadores devem ser interpretados como acompanhamento inicial.",
  },
  ready: {
    label: "Avaliação disponível",
    title: "Precisão medida com observações locais",
    description:
      "Os provedores são comparados com dias completos observados pela Estação Embrapa, separados pela antecedência da previsão.",
  },
  unavailable: {
    label: "Diagnóstico indisponível",
    title: "A avaliação não pôde ser consultada",
    description:
      "As previsões do portal continuam disponíveis, mas o resumo histórico de precisão não respondeu nesta atualização.",
  },
} as const;

function formatNumber(value: number | null, digits = 1) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Aguardando dados";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Aguardando dados";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(" de ", " ")
    .replace(" de ", " ")
    .replace(".", "");
}

function providerDescription(provider: ForecastAccuracyProvider) {
  if (provider.key === "open-meteo") {
    return provider.model ?? "Seleção automática de modelos do Open-Meteo";
  }
  return "Modelo regional do serviço Locationforecast";
}

function ProviderCard({
  provider,
  rank,
  showRank,
}: {
  provider: ForecastAccuracyProvider;
  rank: number;
  showRank: boolean;
}) {
  return (
    <article className="forecast-accuracy-provider">
      <header>
        <div>
          <span>{showRank ? `${rank}º menor erro térmico` : "Provedor em avaliação"}</span>
          <h3>{provider.name}</h3>
          <p>{providerDescription(provider)}</p>
        </div>
        <strong>{provider.evaluationCount} avaliações</strong>
      </header>

      <div className="forecast-accuracy-provider__metrics">
        <div>
          <Thermometer aria-hidden="true" />
          <span>Erro médio de temperatura</span>
          <strong>{formatNumber(provider.meanTemperatureError, 2)} °C</strong>
          <small>
            mínima {formatNumber(provider.minimumError, 2)} °C · máxima {formatNumber(provider.maximumError, 2)} °C
          </small>
        </div>
        <div>
          <CloudRain aria-hidden="true" />
          <span>Erro médio de chuva</span>
          <strong>{formatNumber(provider.rainError, 2)} mm</strong>
          <small>
            Acerto de ocorrência: {formatNumber(provider.rainEventAccuracy, 1)}%
          </small>
        </div>
      </div>

      {provider.leadDays.length ? (
        <div className="forecast-accuracy-leads">
          <div className="forecast-accuracy-leads__heading">
            <span>Antecedência</span>
            <span>Erro térmico</span>
            <span>Chuva</span>
          </div>
          {provider.leadDays.map((lead) => (
            <div key={lead.leadDays}>
              <strong>
                {lead.leadDays === 0
                  ? "Mesmo dia"
                  : `${lead.leadDays} dia${lead.leadDays === 1 ? "" : "s"} antes`}
              </strong>
              <span>{formatNumber(lead.meanTemperatureError, 2)} °C</span>
              <span>{formatNumber(lead.rainEventAccuracy, 1)}% de ocorrência</span>
            </div>
          ))}
        </div>
      ) : null}

      <footer>
        Período avaliado: {formatDate(provider.firstDate)} até {formatDate(provider.lastDate)}
      </footer>
    </article>
  );
}

export function ForecastAccuracyPanel({ summary }: { summary: ForecastAccuracySummary }) {
  const copy = statusCopy[summary.status];
  const rankedProviders = [...summary.providers].sort((left, right) => {
    if (left.meanTemperatureError === null) return 1;
    if (right.meanTemperatureError === null) return -1;
    return left.meanTemperatureError - right.meanTemperatureError;
  });
  const showRank = summary.status === "ready" && rankedProviders.length > 1;

  return (
    <section
      className={`forecast-accuracy is-${summary.status}`}
      id="precisao-das-previsoes"
      aria-labelledby="forecast-accuracy-title"
    >
      <header className="forecast-accuracy__header">
        <div>
          <span className="forecast-accuracy__eyebrow">Verificação das previsões</span>
          <h2 id="forecast-accuracy-title">O portal passa a medir o que realmente acerta</h2>
          <p>{copy.description}</p>
        </div>
        <span className="forecast-accuracy__status">
          {summary.status === "ready" ? <CheckCircle2 aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
          {copy.label}
        </span>
      </header>

      <div className="forecast-accuracy__intro">
        <Target aria-hidden="true" />
        <div>
          <h3>{copy.title}</h3>
          <p>
            O erro é calculado comparando máximas, mínimas e chuva previstas com um dia completo medido no
            Posto Meteorológico da Sede da Embrapa. Dias incompletos são descartados.
          </p>
        </div>
      </div>

      <div className="forecast-accuracy__summary" aria-label="Resumo da avaliação">
        <article>
          <CalendarRange aria-hidden="true" />
          <span>Dias verificados</span>
          <strong>{summary.verifiedDays}</strong>
          <small>Janela móvel de {summary.windowDays} dias</small>
        </article>
        <article>
          <Activity aria-hidden="true" />
          <span>Comparações realizadas</span>
          <strong>{summary.evaluationCount}</strong>
          <small>Provedor, ciclo e antecedência preservados</small>
        </article>
        <article>
          <BarChart3 aria-hidden="true" />
          <span>Provedores avaliados</span>
          <strong>{summary.providers.length}</strong>
          <small>Open-Meteo e MET Norway são coletados separadamente</small>
        </article>
        <article>
          <Database aria-hidden="true" />
          <span>Referência observada</span>
          <strong>Embrapa</strong>
          <small>Mínimo de 18 horas de cobertura por dia</small>
        </article>
      </div>

      {rankedProviders.length ? (
        <div className="forecast-accuracy__providers">
          {rankedProviders.map((provider, index) => (
            <ProviderCard
              provider={provider}
              rank={index + 1}
              showRank={showRank}
              key={provider.key}
            />
          ))}
        </div>
      ) : (
        <div className="forecast-accuracy__empty">
          <Clock3 aria-hidden="true" />
          <div>
            <strong>Primeiras previsões sendo arquivadas</strong>
            <p>
              Não é possível reconstruir com fidelidade uma previsão antiga. Por isso, o histórico começa
              agora e somente publicará métricas depois que as previsões arquivadas puderem ser comparadas
              com observações completas.
            </p>
          </div>
        </div>
      )}

      <ol className="forecast-accuracy__method">
        <li><span>01</span><strong>Arquivar</strong><p>Os dois provedores são registrados quatro vezes ao dia.</p></li>
        <li><span>02</span><strong>Observar</strong><p>A Embrapa alimenta o histórico central durante todo o dia.</p></li>
        <li><span>03</span><strong>Validar</strong><p>Somente dias com cobertura suficiente entram na amostra.</p></li>
        <li><span>04</span><strong>Comparar</strong><p>Os erros são separados por provedor e antecedência.</p></li>
      </ol>
    </section>
  );
}
