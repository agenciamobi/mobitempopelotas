from pathlib import Path
import re


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    if old not in text:
        raise RuntimeError(f"Trecho não encontrado em {path}: {old[:140]!r}")
    path.write_text(text.replace(old, new, 1))


def replace_pattern(path: Path, pattern: str, replacement: str) -> None:
    text = path.read_text()
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Bloco não encontrado em {path}: {pattern[:140]!r}")
    path.write_text(updated)


# Home: campos de probabilidade ausentes não podem virar "null%".
home = Path("src/production/components/home-editorial-dashboard.tsx")
replace_once(
    home,
    'aria-label={`${day.weekday}, ${day.date}: máxima de ${day.max} graus, mínima de ${day.min} graus e ${rain.chance}% de chance de chuva`}',
    'aria-label={`${day.weekday}, ${day.date}: máxima de ${day.max} graus, mínima de ${day.min} graus e ${rain.chance === null ? "probabilidade de chuva não informada" : `${rain.chance}% de chance de chuva`}`}',
)
replace_once(
    home,
    "<strong>{rain.chance}%</strong>",
    '<strong>{rain.chance === null ? "—" : `${rain.chance}%`}</strong>',
)

# Hero editorial alternativo: nunca usar o provedor de previsão como fonte do agora.
hero = Path("src/components/weather/WeatherEditorialHero.tsx")
replace_once(hero, "  Gauge,\n" if "  Gauge,\n" in hero.read_text() else "  Info,\n", "  Gauge,\n  Info,\n" if "  Gauge,\n" not in hero.read_text() else "  Gauge,\n")
replace_pattern(
    hero,
    r"  const currentSource =\n    weather\.quality\.currentSource === \"embrapa\"\n      \? \"Embrapa\"\n      : \(weather\.quality\.forecastProvider \?\? \"Modelo meteorológico\"\);",
    '  const currentSource = "Embrapa Clima Temperado";',
)
replace_pattern(
    hero,
    r"        <aside className=\"weather-editorial-now\" aria-label=\"Tempo agora em Pelotas\">.*?        </aside>",
    '''        <aside
          className={`weather-editorial-now${current ? "" : " is-unavailable"}`}
          aria-label={current ? "Medição atual da Embrapa em Pelotas" : "Medição atual indisponível"}
        >
          <div className="weather-editorial-now-heading">
            <div>
              <strong>Pelotas, RS</strong>
              <small>
                {current?.observedAt
                  ? `Leitura das ${current.observedAt} · ${currentSource}`
                  : `Medição recente indisponível · ${currentSource}`}
              </small>
            </div>
            <span className="weather-editorial-live">
              <i aria-hidden="true" /> {current ? "Medição" : "Indisponível"}
            </span>
          </div>

          {current ? (
            <>
              <div className="weather-editorial-visual">
                <div className="weather-editorial-icon">
                  <Gauge aria-hidden="true" size={64} strokeWidth={1.55} />
                </div>
                <div className="weather-editorial-temperature">
                  <strong>{current.temperature === null ? "—" : `${current.temperature}°`}</strong>
                  <div>
                    <span>Medição da estação</span>
                    <small>
                      {current.feelsLike === null
                        ? "Sensação não informada"
                        : `Sensação de ${current.feelsLike}°`}
                    </small>
                  </div>
                </div>
              </div>

              <div className="weather-editorial-metrics">
                <HeroMetric icon={Droplets} label="Umidade" value={displayNumber(current.humidity, "%")} />
                <HeroMetric icon={Wind} label="Vento medido" value={displayNumber(current.windSpeed, " km/h")} />
                <HeroMetric icon={Gauge} label="Pressão" value={displayNumber(current.pressure, " hPa")} />
                <HeroMetric icon={Wind} label="Direção" value={current.windDirection ?? "—"} />
              </div>
            </>
          ) : (
            <div className="weather-editorial-forecast-only">
              <Gauge aria-hidden="true" size={54} strokeWidth={1.55} />
              <strong>Medição atual indisponível</strong>
              <span>A previsão permanece disponível abaixo, separada da observação local.</span>
            </div>
          )}

          <div className="weather-editorial-quality">
            <span
              className={`weather-editorial-confidence weather-editorial-confidence-${weather.quality.confidence}`}
            >
              {weather.quality.confidence === "high" ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <Info aria-hidden="true" />
              )}
              {confidenceLabels[weather.quality.confidence]}
            </span>
            <small>Índice de qualidade {weather.quality.score}/100</small>
          </div>
        </aside>''',
)

# Página de hoje: bloco atual é exclusivamente a leitura validada da Embrapa.
forecast = Path("src/components/weather/ForecastPages.tsx")
replace_once(forecast, "Voltar ao tempo agora", "Voltar à visão geral")
replace_once(forecast, "<ArrowLeft aria-hidden=\"true\" /> Tempo agora", "<ArrowLeft aria-hidden=\"true\" /> Visão geral")
replace_pattern(
    forecast,
    r"      <section className=\"forecast-today-hero\" aria-labelledby=\"today-summary-title\">.*?      </section>\n\n      \{activeAlerts\.length > 0 \? \(",
    '''      <section className="forecast-today-hero" aria-labelledby="today-summary-title">
        <div className="forecast-today-main">
          <p className="forecast-kicker">Observação local</p>
          <h2 id="today-summary-title">
            {current ? "Medição atual da Embrapa" : "Medição atual indisponível"}
          </h2>
          {current ? (
            <div className="forecast-now-reading">
              <span className="forecast-now-icon">
                <Gauge aria-hidden="true" size={62} strokeWidth={1.55} />
              </span>
              <div>
                <strong>
                  {current.temperature === null ? "—" : `${current.temperature}°`}
                </strong>
                <span>Embrapa Clima Temperado</span>
                <small>
                  {current.feelsLike === null
                    ? "Sensação térmica não informada"
                    : `Sensação de ${current.feelsLike}°`}
                </small>
              </div>
            </div>
          ) : (
            <div className="forecast-now-reading is-unavailable">
              <span className="forecast-now-icon">
                <Gauge aria-hidden="true" size={62} strokeWidth={1.55} />
              </span>
              <div>
                <strong>—</strong>
                <span>Nenhuma leitura recente e verificável</span>
                <small>Os números previstos não são usados como condição atual.</small>
              </div>
            </div>
          )}
        </div>

        <div className="forecast-today-range">
          <span>Previsão para hoje</span>
          <strong>
            {today ? `${today.min}° / ${today.max}°` : "Faixa térmica em atualização"}
          </strong>
          <small>
            {today
              ? `${today.rainChance === null ? "Probabilidade de chuva não informada" : `${today.rainChance}% de chance de chuva`} · ${today.precipitationMm} mm previstos`
              : "Previsão diária em atualização"}
          </small>
        </div>
      </section>

      {activeAlerts.length > 0 ? (''',
)

# Página de vento: separar medição local de máximas previstas.
wind = Path("src/components/weather/RainWindPages.tsx")
replace_once(wind, "<ArrowLeft aria-hidden=\"true\" /> Tempo agora", "<ArrowLeft aria-hidden=\"true\" /> Visão geral")
replace_once(wind, "Voltar ao tempo agora", "Voltar à visão geral")
replace_pattern(
    wind,
    r"  const gustValues = \[current\?\.windGust, windiestHour\?\.windGust, windiestDay\?\.windGust\]\.filter\(\n    \(value\): value is number => value !== null && value !== undefined,\n  \);\n  const maximumGust = gustValues\.length > 0 \? Math\.max\(\.\.\.gustValues\) : null;\n  const windLevel =\n    maximumGust === null",
    '''  const forecastGustValues = [windiestHour?.windGust, windiestDay?.windGust].filter(
    (value): value is number => value !== null && value !== undefined,
  );
  const maximumForecastGust =
    forecastGustValues.length > 0 ? Math.max(...forecastGustValues) : null;
  const windLevel =
    maximumForecastGust === null''',
)
replace_once(wind, "maximumGust >= 70", "maximumForecastGust >= 70")
replace_once(wind, "maximumGust >= 50", "maximumForecastGust >= 50")
replace_once(
    wind,
    'description="Acompanhe o vento agora, a evolução das próximas horas e os períodos com rajadas mais fortes em Pelotas."',
    'description="Consulte a medição local quando disponível e compare com o vento e as rajadas previstos para as próximas horas."',
)
replace_once(wind, '<p className="condition-kicker">Condição atual</p>', '<p className="condition-kicker">Previsão de vento</p>')
replace_once(wind, "{maximumGust === null", "{maximumForecastGust === null")
replace_pattern(
    wind,
    r"            \{current\n              \? `Agora, o vento está em \$\{current\.windSpeed \?\? \"—\"\} km/h, com direção \$\{current\.windDirection \?\? \"não informada\"\}\$\{current\.windGust === null \? \"; a fonte não informa rajadas\" : ` e rajadas de \$\{current\.windGust\} km/h`\}\.\`\n              : \"A leitura atual está em atualização; consulte as projeções horárias abaixo\.\"\}",
    '''            {current
              ? `A Embrapa mediu vento de ${current.windSpeed ?? "—"} km/h, com direção ${current.windDirection ?? "não informada"}. As rajadas abaixo são previsões do modelo.`
              : "A medição atual da Embrapa está indisponível. Os valores abaixo são exclusivamente previstos."}''',
)
replace_once(wind, "<span>km/h agora</span>", '<span>{current ? "km/h medidos" : "medição indisponível"}</span>')

# JSON/feed: sinalizar explicitamente se a observação pode ser usada como atual.
portal = Path("src/lib/public-portal.server.ts")
replace_once(
    portal,
    "        embrapa: publicEmbrapaObservation(weather.observation),",
    '''        embrapa: {
          ...publicEmbrapaObservation(weather.observation),
          usable_as_current: weather.quality.currentSource === "embrapa",
        },''',
)
replace_pattern(
    portal,
    r"  const embrapaText =\n    embrapa\.status === \"unavailable\"\n      \? \"A observação da Embrapa está temporariamente indisponível para consulta pelo portal\.\"\n      : `A estação da Embrapa informou \$\{formatMetric\(embrapa\.current\.temperature, \" °C\"\)\}, umidade de \$\{formatMetric\(embrapa\.current\.humidity, \"%\"\)\}, vento de \$\{formatMetric\(embrapa\.current\.windSpeed, \" km/h\"\)\} e \$\{formatMetric\(embrapa\.accumulated\.rainDaily, \" mm\"\)\} de chuva no dia\.`;",
    '''  const embrapaText =
    !embrapa.usable_as_current || !current
      ? "A Embrapa não forneceu uma leitura recente e verificável para uso como condição atual."
      : `A estação da Embrapa informou ${formatMetric(current.temperature, " °C")}, umidade de ${formatMetric(current.humidity, "%")} e vento de ${formatMetric(current.windSpeed, " km/h")}.`;''',
)

print("Segunda etapa de integridade aplicada.")
