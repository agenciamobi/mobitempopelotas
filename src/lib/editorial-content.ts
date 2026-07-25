export type EditorialFaq = {
  question: string;
  answer: string;
};

export type EditorialInternalPath =
  | "/"
  | "/alertas"
  | "/chuva-em-pelotas"
  | "/estacao-embrapa-pelotas"
  | "/metodologia"
  | "/previsao-7-dias-pelotas"
  | "/radar-e-satelite-pelotas"
  | "/tempo-amanha-pelotas"
  | "/tempo-hoje-pelotas"
  | "/vento-em-pelotas";

export type EditorialRelatedLink = {
  label: string;
  href: EditorialInternalPath;
  description: string;
};

export type EditorialContentDefinition = {
  eyebrow: string;
  title: string;
  answer: string;
  facts: readonly string[];
  faqs: readonly EditorialFaq[];
  relatedLinks: readonly EditorialRelatedLink[];
};

export const HOME_EDITORIAL_CONTENT = {
  eyebrow: "Entenda a leitura",
  title: "Como o Tempo Pelotas organiza a informação meteorológica",
  answer:
    "O portal separa claramente o que foi medido em Pelotas do que é previsto pelos modelos. A condição atual prioriza observações locais verificáveis; previsões, alertas e imagens de monitoramento aparecem identificados por origem e finalidade.",
  facts: [
    "Condição atual: prioriza medições locais recentes, especialmente da Embrapa Clima Temperado, sem apresentar previsão como se fosse observação.",
    "Previsão: usa a fonte meteorológica ativa e complementa a leitura com dados oficiais e regionais quando disponíveis.",
    "Risco: avisos oficiais do INMET e orientações das autoridades aparecem separados da interpretação editorial do portal.",
  ],
  faqs: [
    {
      question: "De onde vêm os dados do Tempo Pelotas?",
      answer:
        "O portal consulta fontes locais, oficiais e regionais, incluindo Embrapa Clima Temperado, INMET, CPPMet/UFPel, REDEMET/DECEA e o provedor de previsão identificado em cada atualização.",
    },
    {
      question: "O Tempo Pelotas substitui os alertas oficiais?",
      answer:
        "Não. O portal organiza e contextualiza informações meteorológicas, mas, em situações de risco, devem prevalecer os comunicados da Defesa Civil, do INMET e das autoridades locais.",
    },
    {
      question: "Qual área o portal acompanha?",
      answer:
        "O foco principal é Pelotas e a Zona Sul do Rio Grande do Sul, com contexto regional para a Lagoa dos Patos, o Laranjal e sistemas meteorológicos que influenciam o município.",
    },
  ],
  relatedLinks: [
    {
      label: "Fontes e metodologia",
      href: "/metodologia",
      description: "Veja como cada fonte é usada, atualizada e identificada.",
    },
    {
      label: "Estação Embrapa em Pelotas",
      href: "/estacao-embrapa-pelotas",
      description: "Consulte a observação meteorológica local e sua rastreabilidade.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Acompanhe a evolução regional de chuva, nuvens e trovoadas.",
    },
  ],
} satisfies EditorialContentDefinition;

export const TODAY_EDITORIAL_CONTENT = {
  eyebrow: "Resposta rápida",
  title: "Como interpretar o tempo de hoje em Pelotas",
  answer:
    "A página de hoje combina a observação local mais recente com a previsão para as próximas horas. Temperatura atual e sensação térmica pertencem à medição quando a estação está disponível; chuva, máxima, mínima e evolução horária são previsões.",
  facts: [
    "Medição e previsão são exibidas em blocos diferentes para evitar confusão entre dado observado e valor estimado.",
    "Chance de chuva representa probabilidade; o volume em milímetros representa a quantidade estimada para o período.",
    "A previsão pode mudar durante o dia conforme novas rodadas dos modelos e novas observações locais.",
  ],
  faqs: [
    {
      question: "A temperatura atual é uma previsão?",
      answer:
        "Quando há leitura local recente, a temperatura atual vem da estação observacional identificada na página. Se a medição estiver indisponível, o portal não substitui esse campo por uma previsão sem informar a diferença.",
    },
    {
      question: "Chance de chuva e volume previsto são a mesma coisa?",
      answer:
        "Não. A chance de chuva indica a probabilidade de ocorrer precipitação, enquanto o volume em milímetros estima quanto pode chover durante o período.",
    },
    {
      question: "Quando devo consultar a previsão novamente?",
      answer:
        "Consulte novamente antes de deslocamentos, eventos ou atividades ao ar livre, especialmente quando houver instabilidade, vento forte ou avisos oficiais ativos.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão para amanhã em Pelotas",
      href: "/tempo-amanha-pelotas",
      description: "Planeje o próximo dia com máxima, mínima, chuva e vento.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Veja probabilidade por horário e volume previsto.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Confira alertas vigentes e orientações de segurança.",
    },
  ],
} satisfies EditorialContentDefinition;

export const SEVEN_DAY_EDITORIAL_CONTENT = {
  eyebrow: "Planejamento semanal",
  title: "Como usar a previsão de 7 dias para Pelotas",
  answer:
    "A previsão semanal é mais útil para identificar tendências de temperatura, chuva e vento do que para definir horários exatos com muitos dias de antecedência. Quanto mais distante o dia, maior a possibilidade de ajuste.",
  facts: [
    "Os primeiros dias normalmente têm maior estabilidade do que o fim da janela de sete dias.",
    "Probabilidade de chuva, volume previsto e rajadas devem ser analisados em conjunto.",
    "Atividades sensíveis ao tempo devem ser confirmadas novamente na previsão de hoje ou de amanhã.",
  ],
  faqs: [
    {
      question: "A previsão de 7 dias é confiável?",
      answer:
        "Ela é adequada para acompanhar tendências, mas a precisão diminui com a distância temporal. Para decisões operacionais, confirme os dados nas páginas de hoje e amanhã.",
    },
    {
      question: "Por que a previsão muda ao longo da semana?",
      answer:
        "Modelos meteorológicos recebem novas observações e recalculam a atmosfera várias vezes ao dia. Pequenas mudanças iniciais podem alterar chuva, temperatura e vento previstos.",
    },
    {
      question: "Qual dado devo observar primeiro?",
      answer:
        "Comece pela condição predominante e pela faixa de temperatura; depois compare chance e volume de chuva, rajadas de vento e alertas oficiais.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Veja a observação atual e a evolução das próximas horas.",
    },
    {
      label: "Tempo amanhã em Pelotas",
      href: "/tempo-amanha-pelotas",
      description: "Consulte a previsão detalhada para o próximo dia.",
    },
    {
      label: "Vento e rajadas em Pelotas",
      href: "/vento-em-pelotas",
      description: "Compare velocidade, direção e rajadas previstas.",
    },
  ],
} satisfies EditorialContentDefinition;

export const RAIN_EDITORIAL_CONTENT = {
  eyebrow: "Leitura da precipitação",
  title: "O que significam chance de chuva e milímetros previstos",
  answer:
    "A probabilidade informa a chance de chover em Pelotas durante o período analisado. O volume em milímetros estima a quantidade de precipitação. Um percentual alto não significa, por si só, chuva volumosa.",
  facts: [
    "Probabilidade responde se pode chover; milímetros ajudam a estimar quanto pode chover.",
    "Previsão acumulada não é o mesmo que chuva já medida por uma estação ou pluviômetro.",
    "Em risco de temporal, alagamento ou inundação, consulte os avisos oficiais e a situação hidrológica.",
  ],
  faqs: [
    {
      question: "O que significa 70% de chance de chuva?",
      answer:
        "Significa que a fonte estima alta probabilidade de ocorrer precipitação no local e período indicados. O percentual não informa sozinho a duração nem a intensidade da chuva.",
    },
    {
      question: "Quantos milímetros representam chuva forte?",
      answer:
        "O impacto depende do intervalo de tempo, da distribuição da chuva, da drenagem e das condições anteriores. Por isso, o volume previsto deve ser analisado junto de alertas e observações locais.",
    },
    {
      question: "A chuva prevista já foi medida?",
      answer:
        "Não. Os valores futuros são estimativas dos modelos. Medições observadas devem ser identificadas como acumulado registrado por uma estação ou rede de monitoramento.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão completa de hoje",
      href: "/tempo-hoje-pelotas",
      description: "Compare chuva, temperatura, sensação térmica e vento.",
    },
    {
      label: "Radar e satélite meteorológico",
      href: "/radar-e-satelite-pelotas",
      description: "Observe a posição e a evolução regional das áreas de chuva.",
    },
    {
      label: "Alertas de chuva e tempestade",
      href: "/alertas",
      description: "Consulte avisos oficiais vigentes para Pelotas.",
    },
  ],
} satisfies EditorialContentDefinition;

export const WIND_EDITORIAL_CONTENT = {
  eyebrow: "Leitura do vento",
  title: "Diferença entre velocidade do vento, direção e rajadas",
  answer:
    "A velocidade representa o vento médio no período; a rajada é um pico de curta duração e pode ser bem mais forte. A direção informa de onde o vento vem e ajuda a entender mudanças no tempo e efeitos locais.",
  facts: [
    "Vento médio e rajada não devem ser comparados como se fossem a mesma medida.",
    "Rajadas podem afetar árvores, estruturas leves, navegação, trânsito e atividades ao ar livre.",
    "Quando houver aviso oficial, a orientação de segurança prevalece sobre a interpretação geral da previsão.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre vento e rajada?",
      answer:
        "O vento é a velocidade média em um intervalo; a rajada é um aumento breve e mais intenso. Por isso, a rajada máxima costuma ser superior ao vento sustentado.",
    },
    {
      question: "O que significa a direção do vento?",
      answer:
        "A direção indica de onde o vento sopra. Vento sul, por exemplo, vem do sul em direção ao norte.",
    },
    {
      question: "Quando o vento exige atenção?",
      answer:
        "Atenção é necessária quando as rajadas aumentam, existem estruturas vulneráveis ou há avisos oficiais. Consulte também a evolução horária antes de atividades externas ou náuticas.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Veja a medição local e a previsão para as próximas horas.",
    },
    {
      label: "Previsão para os próximos 7 dias",
      href: "/previsao-7-dias-pelotas",
      description: "Compare as rajadas e tendências ao longo da semana.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Verifique alertas relacionados a vento forte e tempestades.",
    },
  ],
} satisfies EditorialContentDefinition;
