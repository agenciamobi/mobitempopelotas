from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    found = text.count(old)
    if found != expected:
        raise RuntimeError(f"{path}: esperado {expected} ocorrência(s), encontrado {found}: {old[:80]!r}")
    file.write_text(text.replace(old, new), encoding="utf-8")


# Contratos: ausência real deve permanecer nula, nunca virar zero ou valor derivado.
replace(
    "src/lib/weather/types.ts",
    "  precipitationProbability: number;\n  windSpeed: number;\n  windGust: number;",
    "  precipitationProbability: number | null;\n  windSpeed: number;\n  windGust: number | null;",
)
replace(
    "src/lib/weather/types.ts",
    "  rainChance: number;\n  precipitationMm: number;\n  windGust: number;",
    "  rainChance: number | null;\n  precipitationMm: number;\n  windGust: number | null;",
)

# MET Norway: não inferir probabilidade e não tratar vento médio como rajada.
replace(
    "src/lib/weather/met-norway.server.ts",
    "                  wind_speed: finiteNumber.optional(),",
    "                  wind_speed: finiteNumber,",
)
replace(
    "src/lib/weather/met-norway.server.ts",
    "function precipitationProbability(point: MetPoint) {\n  const period = pointPeriod(point);\n  const explicit = period?.details?.probability_of_precipitation;\n  if (explicit !== undefined) return Math.max(0, Math.min(100, Math.round(explicit)));\n\n  const amount = period?.details?.precipitation_amount ?? 0;\n  const presentation = pointPresentation(point);\n  return amount > 0 || presentation.severity >= 4 ? 100 : 0;\n}",
    "function precipitationProbability(point: MetPoint) {\n  const explicit = pointPeriod(point)?.details?.probability_of_precipitation;\n  return explicit === undefined ? null : Math.max(0, Math.min(100, Math.round(explicit)));\n}",
)
replace(
    "src/lib/weather/met-norway.server.ts",
    "    const windSpeed = metersPerSecondToKilometersPerHour(details.wind_speed) ?? 0;\n    const windGust = metersPerSecondToKilometersPerHour(details.wind_speed_of_gust) ?? windSpeed;",
    "    const windSpeed = Math.round(details.wind_speed * 3.6);\n    const windGust = metersPerSecondToKilometersPerHour(details.wind_speed_of_gust);",
)
replace(
    "src/lib/weather/met-norway.server.ts",
    "    const windSpeed = metersPerSecondToKilometersPerHour(details.wind_speed) ?? 0;\n    const windGust = metersPerSecondToKilometersPerHour(details.wind_speed_of_gust) ?? windSpeed;\n\n    group.temperatures.push(details.air_temperature);\n    group.precipitation += precipitationAmount(point);\n    group.probabilities.push(precipitationProbability(point));\n    group.windGusts.push(windGust);",
    "    const windGust = metersPerSecondToKilometersPerHour(details.wind_speed_of_gust);\n    const probability = precipitationProbability(point);\n\n    group.temperatures.push(details.air_temperature);\n    group.precipitation += precipitationAmount(point);\n    if (probability !== null) group.probabilities.push(probability);\n    if (windGust !== null) group.windGusts.push(windGust);",
)
replace(
    "src/lib/weather/met-norway.server.ts",
    "      rainChance: Math.max(...group.probabilities, 0),\n      precipitationMm: Number(group.precipitation.toFixed(1)),\n      windGust: Math.max(...group.windGusts, 0),",
    "      rainChance: group.probabilities.length > 0 ? Math.max(...group.probabilities) : null,\n      precipitationMm: Number(group.precipitation.toFixed(1)),\n      windGust: group.windGusts.length > 0 ? Math.max(...group.windGusts) : null,",
)
replace(
    "src/lib/weather/met-norway.server.ts",
    "        windGust: windGust ?? windSpeed,",
    "        windGust,",
)

# Home: apresentar ausência explicitamente.
replace(
    "src/components/weather/WeatherHome.tsx",
    "                <small>{hour.precipitationProbability}% de chuva</small>",
    "                <small>\n                  {hour.precipitationProbability === null\n                    ? \"Probabilidade não informada\"\n                    : `${hour.precipitationProbability}% de chuva`}\n                </small>",
)
replace(
    "src/components/weather/WeatherHome.tsx",
    "                <span>{day.rainChance}% chuva</span>\n                <span>{day.precipitationMm} mm</span>\n                <span>Rajadas {day.windGust} km/h</span>",
    "                <span>\n                  {day.rainChance === null ? \"Chuva: probabilidade não informada\" : `${day.rainChance}% chuva`}\n                </span>\n                <span>{day.precipitationMm} mm</span>\n                <span>\n                  {day.windGust === null ? \"Rajadas não informadas\" : `Rajadas ${day.windGust} km/h`}\n                </span>",
)

# Hero editorial.
replace(
    "src/components/weather/WeatherEditorialHero.tsx",
    "                <dd>{today.rainChance}%</dd>",
    "                <dd>{today.rainChance === null ? \"Não informada\" : `${today.rainChance}%`}</dd>",
)
replace(
    "src/components/weather/WeatherEditorialHero.tsx",
    "                <dd>\n                  {today.windGust} <small>km/h</small>\n                </dd>",
    "                <dd>\n                  {today.windGust === null ? (\n                    \"Não informada\"\n                  ) : (\n                    <>\n                      {today.windGust} <small>km/h</small>\n                    </>\n                  )}\n                </dd>",
)
replace(
    "src/components/weather/WeatherEditorialHero.tsx",
    "              <span>{today.rainChance}% de chance de chuva</span>",
    "              <span>\n                {today.rainChance === null\n                  ? `${today.precipitationMm} mm previstos`\n                  : `${today.rainChance}% de chance de chuva`}\n              </span>",
)

# Página de hoje e sete dias.
replace(
    "src/components/weather/ForecastPages.tsx",
    "            {today\n              ? `${today.rainChance}% de chance de chuva · ${today.precipitationMm} mm previstos`\n              : \"Previsão diária em atualização\"}",
    "            {today\n              ? `${today.rainChance === null ? \"Probabilidade de chuva não informada\" : `${today.rainChance}% de chance de chuva`} · ${today.precipitationMm} mm previstos`\n              : \"Previsão diária em atualização\"}",
)
replace(
    "src/components/weather/ForecastPages.tsx",
    "                <small>{hour.precipitationProbability}% chuva</small>",
    "                <small>\n                  {hour.precipitationProbability === null\n                    ? \"Probabilidade não informada\"\n                    : `${hour.precipitationProbability}% chuva`}\n                </small>",
)
replace(
    "src/components/weather/ForecastPages.tsx",
    "  const rainiestDay = weather.daily.reduce((current, day) =>\n    day.rainChance > current.rainChance ? day : current,\n  );\n  const windiestDay = weather.daily.reduce((current, day) =>\n    day.windGust > current.windGust ? day : current,\n  );",
    "  const daysWithRainProbability = weather.daily.filter((day) => day.rainChance !== null);\n  const rainiestDay =\n    daysWithRainProbability.length > 0\n      ? daysWithRainProbability.reduce((current, day) =>\n          (day.rainChance ?? -1) > (current.rainChance ?? -1) ? day : current,\n        )\n      : null;\n  const daysWithGust = weather.daily.filter((day) => day.windGust !== null);\n  const windiestDay =\n    daysWithGust.length > 0\n      ? daysWithGust.reduce((current, day) =>\n          (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,\n        )\n      : null;",
)
replace(
    "src/components/weather/ForecastPages.tsx",
    "          <strong>{rainiestDay.rainChance}%</strong>\n          <small>{rainiestDay.weekday}</small>",
    "          <strong>{rainiestDay?.rainChance === null || !rainiestDay ? \"Não informada\" : `${rainiestDay.rainChance}%`}</strong>\n          <small>{rainiestDay?.weekday ?? \"Fonte sem probabilidade\"}</small>",
)
replace(
    "src/components/weather/ForecastPages.tsx",
    "          <strong>{windiestDay.windGust} km/h</strong>\n          <small>{windiestDay.weekday}</small>",
    "          <strong>{windiestDay?.windGust === null || !windiestDay ? \"Não informada\" : `${windiestDay.windGust} km/h`}</strong>\n          <small>{windiestDay?.weekday ?? \"Fonte sem rajadas\"}</small>",
)
replace(
    "src/components/weather/ForecastPages.tsx",
    "                  <Droplets aria-hidden=\"true\" /> {day.rainChance}% de chuva\n                </span>",
    "                  <Droplets aria-hidden=\"true\" />{\" \"}\n                  {day.rainChance === null ? \"Probabilidade não informada\" : `${day.rainChance}% de chuva`}\n                </span>",
)
replace(
    "src/components/weather/ForecastPages.tsx",
    "                  <Wind aria-hidden=\"true\" /> Rajadas de {day.windGust} km/h\n                </span>",
    "                  <Wind aria-hidden=\"true\" />{\" \"}\n                  {day.windGust === null ? \"Rajadas não informadas\" : `Rajadas de ${day.windGust} km/h`}\n                </span>",
)

# Síntese determinística.
replace(
    "src/lib/weather/weather-intelligence.server.ts",
    "  if (today) {\n    parts.push(\n      `para hoje, mínima de ${today.min} °C, máxima de ${today.max} °C e ${today.rainChance}% de chance de chuva`,\n    );\n  }",
    "  if (today) {\n    const rain =\n      today.rainChance === null\n        ? `${today.precipitationMm} mm de precipitação previstos`\n        : `${today.rainChance}% de chance de chuva`;\n    parts.push(`para hoje, mínima de ${today.min} °C, máxima de ${today.max} °C e ${rain}`);\n  }",
)
replace(
    "src/lib/weather/weather-intelligence.server.ts",
    "  if (today) {\n    highlights.push(\n      `Hoje: ${today.min} °C a ${today.max} °C, com ${today.rainChance}% de chance de chuva.`,\n    );\n  }",
    "  if (today) {\n    const rain =\n      today.rainChance === null\n        ? `${today.precipitationMm} mm de precipitação previstos`\n        : `${today.rainChance}% de chance de chuva`;\n    highlights.push(`Hoje: ${today.min} °C a ${today.max} °C, com ${rain}.`);\n  }",
)

# Página de chuva e vento.
replace(
    "src/components/weather/RainWindPages.tsx",
    "  const rainiestDay = weather.daily.reduce(\n    (selected, day) => (day.rainChance > selected.rainChance ? day : selected),\n    weather.daily[0] ?? {\n      weekday: \"Hoje\",\n      date: \"\",\n      min: 0,\n      max: 0,\n      rainChance: 0,\n      precipitationMm: 0,\n      windGust: 0,\n      icon: \"cloud\" as const,\n    },\n  );\n  const nextWetHour = weather.hourly.find((hour) => hour.precipitationProbability >= 40) ?? null;",
    "  const daysWithRainProbability = weather.daily.filter((day) => day.rainChance !== null);\n  const rainiestDay =\n    daysWithRainProbability.length > 0\n      ? daysWithRainProbability.reduce((selected, day) =>\n          (day.rainChance ?? -1) > (selected.rainChance ?? -1) ? day : selected,\n        )\n      : null;\n  const nextWetHour =\n    weather.hourly.find(\n      (hour) =>\n        hour.precipitationProbability !== null && hour.precipitationProbability >= 40,\n    ) ?? null;",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "            {today && today.rainChance >= 60\n              ? \"A chuva tem presença relevante na previsão\"\n              : \"A chance de chuva permanece limitada\"}",
    "            {today?.rainChance === null\n              ? today.precipitationMm > 0\n                ? \"Há precipitação prevista, sem percentual disponível\"\n                : \"A fonte não informou probabilidade de chuva\"\n              : today && today.rainChance >= 60\n                ? \"A chuva tem presença relevante na previsão\"\n                : \"A chance de chuva permanece limitada\"}",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "            {today\n              ? `A previsão indica até ${today.rainChance}% de chance e aproximadamente ${today.precipitationMm} mm ao longo do dia.`\n              : \"A previsão diária está em atualização; consulte a evolução por hora abaixo.\"}",
    "            {today\n              ? today.rainChance === null\n                ? `A fonte estima aproximadamente ${today.precipitationMm} mm ao longo do dia, mas não publica percentual de probabilidade para Pelotas.`\n                : `A previsão indica até ${today.rainChance}% de chance e aproximadamente ${today.precipitationMm} mm ao longo do dia.`\n              : \"A previsão diária está em atualização; consulte a evolução por hora abaixo.\"}",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "          <strong>{today ? `${today.rainChance}%` : \"—\"}</strong>",
    "          <strong>{today?.rainChance === null || !today ? \"—\" : `${today.rainChance}%`}</strong>",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "          <strong>{rainiestDay.rainChance}%</strong>\n          <small>{rainiestDay.weekday}</small>",
    "          <strong>{rainiestDay?.rainChance === null || !rainiestDay ? \"Não informada\" : `${rainiestDay.rainChance}%`}</strong>\n          <small>{rainiestDay?.weekday ?? \"Fonte sem probabilidade\"}</small>",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "                  <span style={{ width: `${Math.max(4, hour.precipitationProbability)}%` }} />",
    "                  <span\n                    style={{\n                      width: `${hour.precipitationProbability === null ? 0 : Math.max(4, hour.precipitationProbability)}%`,\n                    }}\n                  />",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "                <strong>{hour.precipitationProbability}%</strong>\n                <small>{hour.windGust} km/h de rajada</small>",
    "                <strong>\n                  {hour.precipitationProbability === null ? \"—\" : `${hour.precipitationProbability}%`}\n                </strong>\n                <small>\n                  {hour.windGust === null ? \"Rajada não informada\" : `${hour.windGust} km/h de rajada`}\n                </small>",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "                <strong>{day.rainChance}%</strong>\n                <span>{day.precipitationMm} mm</span>",
    "                <strong>{day.rainChance === null ? \"—\" : `${day.rainChance}%`}</strong>\n                <span>{day.precipitationMm} mm</span>",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "  const windiestHour = weather.hourly.reduce(\n    (selected, hour) => (hour.windGust > selected.windGust ? hour : selected),\n    weather.hourly[0] ?? {\n      time: \"Agora\",\n      temperature: 0,\n      precipitationProbability: 0,\n      windSpeed: 0,\n      windGust: 0,\n      icon: \"wind\" as const,\n    },\n  );\n  const windiestDay = weather.daily.reduce(\n    (selected, day) => (day.windGust > selected.windGust ? day : selected),\n    weather.daily[0] ?? {\n      weekday: \"Hoje\",\n      date: \"\",\n      min: 0,\n      max: 0,\n      rainChance: 0,\n      precipitationMm: 0,\n      windGust: 0,\n      icon: \"wind\" as const,\n    },\n  );\n  const maximumGust = Math.max(windiestHour.windGust, windiestDay.windGust);\n  const windLevel = maximumGust >= 70 ? \"warning\" : maximumGust >= 50 ? \"attention\" : \"normal\";",
    "  const hoursWithGust = weather.hourly.filter((hour) => hour.windGust !== null);\n  const windiestHour =\n    hoursWithGust.length > 0\n      ? hoursWithGust.reduce((selected, hour) =>\n          (hour.windGust ?? -1) > (selected.windGust ?? -1) ? hour : selected,\n        )\n      : null;\n  const daysWithGust = weather.daily.filter((day) => day.windGust !== null);\n  const windiestDay =\n    daysWithGust.length > 0\n      ? daysWithGust.reduce((selected, day) =>\n          (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,\n        )\n      : null;\n  const gustValues = [current?.windGust, windiestHour?.windGust, windiestDay?.windGust].filter(\n    (value): value is number => value !== null && value !== undefined,\n  );\n  const maximumGust = gustValues.length > 0 ? Math.max(...gustValues) : null;\n  const windLevel =\n    maximumGust === null\n      ? \"normal\"\n      : maximumGust >= 70\n        ? \"warning\"\n        : maximumGust >= 50\n          ? \"attention\"\n          : \"normal\";",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "            {windLevel === \"warning\"\n              ? \"Rajadas fortes aparecem na previsão\"\n              : windLevel === \"attention\"\n                ? \"O vento exige atenção em alguns períodos\"\n                : \"O vento permanece dentro de um padrão moderado\"}",
    "            {maximumGust === null\n              ? \"A fonte informa vento, mas não estima rajadas\"\n              : windLevel === \"warning\"\n                ? \"Rajadas fortes aparecem na previsão\"\n                : windLevel === \"attention\"\n                  ? \"O vento exige atenção em alguns períodos\"\n                  : \"O vento permanece dentro de um padrão moderado\"}",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "              ? `Agora, o vento está em ${current.windSpeed ?? \"—\"} km/h, com direção ${current.windDirection ?? \"não informada\"} e rajadas de ${current.windGust ?? \"—\"} km/h.`",
    "              ? `Agora, o vento está em ${current.windSpeed ?? \"—\"} km/h, com direção ${current.windDirection ?? \"não informada\"}${current.windGust === null ? \"; a fonte não informa rajadas\" : ` e rajadas de ${current.windGust} km/h`}.`",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "          <strong>{windiestHour.windGust} km/h</strong>\n          <small>{windiestHour.time}</small>",
    "          <strong>{windiestHour?.windGust === null || !windiestHour ? \"Não informada\" : `${windiestHour.windGust} km/h`}</strong>\n          <small>{windiestHour?.time ?? \"Fonte sem rajadas\"}</small>",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "          <strong>{windiestDay.windGust} km/h</strong>\n          <small>{windiestDay.weekday}</small>",
    "          <strong>{windiestDay?.windGust === null || !windiestDay ? \"Não informada\" : `${windiestDay.windGust} km/h`}</strong>\n          <small>{windiestDay?.weekday ?? \"Fonte sem rajadas\"}</small>",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "                <small>Rajada {hour.windGust} km/h</small>",
    "                <small>{hour.windGust === null ? \"Rajada não informada\" : `Rajada ${hour.windGust} km/h`}</small>",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "                  <span style={{ width: `${Math.min(100, Math.max(8, day.windGust))}%` }} />",
    "                  <span\n                    style={{\n                      width: `${day.windGust === null ? 0 : Math.min(100, Math.max(8, day.windGust))}%`,\n                    }}\n                  />",
)
replace(
    "src/components/weather/RainWindPages.tsx",
    "                <strong>{day.windGust} km/h</strong>",
    "                <strong>{day.windGust === null ? \"—\" : `${day.windGust} km/h`}</strong>",
)

# Contexto hidrológico.
replace(
    "src/components/hydrology/HydrologyPages.tsx",
    "  const maximumGust = Math.max(\n    current?.windGust ?? 0,\n    ...weather.weather.hourly.map((hour) => hour.windGust),\n  );",
    "  const gustValues = [current?.windGust, ...weather.weather.hourly.map((hour) => hour.windGust)].filter(\n    (value): value is number => value !== null && value !== undefined,\n  );\n  const maximumGust = gustValues.length > 0 ? Math.max(...gustValues) : null;",
)
replace(
    "src/components/hydrology/HydrologyPages.tsx",
    "            {today ? `${today.rainChance}% de probabilidade` : \"Previsão em atualização\"}",
    "            {today\n              ? today.rainChance === null\n                ? \"Probabilidade não informada pela fonte\"\n                : `${today.rainChance}% de probabilidade`\n              : \"Previsão em atualização\"}",
)
replace(
    "src/components/hydrology/HydrologyPages.tsx",
    "          <strong>{maximumGust} km/h</strong>",
    "          <strong>{maximumGust === null ? \"—\" : `${maximumGust} km/h`}</strong>",
)

print("Correção aplicada com sucesso.")
