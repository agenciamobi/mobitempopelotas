export type EditorialFaq = {
  question: string;
  answer: string;
};

export type EditorialInternalPath =
  | "/"
  | "/alertas"
  | "/cameras-ao-vivo-pelotas"
  | "/chuva-em-pelotas"
  | "/estacao-embrapa-pelotas"
  | "/historico-climatico-pelotas"
  | "/metodologia"
  | "/nivel-da-lagoa-dos-patos-laranjal"
  | "/previsao-7-dias-pelotas"
  | "/radar-e-satelite-pelotas"
  | "/situacao-hidrologica-pelotas"
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

export const RADAR_EDITORIAL_CONTENT = {
  eyebrow: "Monitoramento por imagem",
  title: "Como interpretar radar, satélite e registros de trovoadas",
  answer:
    "O radar ajuda a localizar ecos associados à precipitação e acompanhar seu deslocamento regional. O satélite mostra nuvens e características de seus topos, enquanto os registros de trovoadas indicam atividade elétrica detectada. São produtos complementares, não equivalentes.",
  facts: [
    "O horário de cada quadro é essencial: imagens antigas não representam necessariamente a situação atual.",
    "Nuvens visíveis no satélite não significam, por si só, chuva no solo em Pelotas.",
    "Radar, satélite e trovoadas ajudam a acompanhar a evolução regional, mas não substituem alertas oficiais nem medições locais.",
  ],
  faqs: [
    {
      question: "O radar mostra se está chovendo exatamente no meu bairro?",
      answer:
        "O radar oferece uma visão regional com resolução e alcance limitados. Distância, relevo, altura do feixe e intensidade da precipitação podem afetar a leitura; confirme a situação com observação local e avisos oficiais.",
    },
    {
      question: "Uma nuvem no satélite significa chuva?",
      answer:
        "Não necessariamente. A imagem mostra cobertura e características das nuvens. Para avaliar precipitação, compare satélite, radar, previsão e observações próximas.",
    },
    {
      question: "Registro de trovoada é o mesmo que alerta meteorológico?",
      answer:
        "Não. Ele indica atividade elétrica detectada em uma área e horário. Alertas são comunicados oficiais emitidos com critérios próprios de risco, abrangência e validade.",
    },
  ],
  relatedLinks: [
    {
      label: "Chuva prevista em Pelotas",
      href: "/chuva-em-pelotas",
      description: "Compare imagens regionais com probabilidade e volume previstos.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Verifique severidade, abrangência e período dos avisos do INMET.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia",
      description: "Entenda a origem, a atualização e os limites de cada produto.",
    },
  ],
} satisfies EditorialContentDefinition;

export const EMBRAPA_EDITORIAL_CONTENT = {
  eyebrow: "Observação meteorológica local",
  title: "O que a estação da Embrapa mede em Pelotas",
  answer:
    "A estação da Embrapa Clima Temperado fornece observações realizadas em um ponto específico de Pelotas. Temperatura, umidade, pressão, vento e chuva medidos pela estação descrevem aquele local e horário; não são valores previstos para toda a cidade.",
  facts: [
    "Medição observada registra o que ocorreu no ponto da estação; previsão estima condições futuras para uma área.",
    "Bairros diferentes podem apresentar variações de temperatura, vento e chuva por distância e características locais.",
    "A data e o horário da última leitura devem ser verificados antes de interpretar qualquer valor como condição atual.",
  ],
  faqs: [
    {
      question: "A temperatura da Embrapa é a temperatura atual de Pelotas?",
      answer:
        "É uma medição local válida para a estação e para o horário informado. Ela é uma referência importante para Pelotas, mas não representa necessariamente todos os bairros ao mesmo tempo.",
    },
    {
      question: "Por que a estação pode mostrar um valor diferente do aplicativo?",
      answer:
        "Aplicativos frequentemente exibem valores de modelos ou de outros pontos de observação. A estação publica uma medição no local; diferenças de fonte, distância e horário são esperadas.",
    },
    {
      question: "A estação da Embrapa fornece previsão do tempo?",
      answer:
        "Nesta página, a função principal da Embrapa é observacional. As previsões do portal são identificadas separadamente e vêm das fontes meteorológicas indicadas em cada atualização.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Compare a observação local com a previsão das próximas horas.",
    },
    {
      label: "Histórico climático recente",
      href: "/historico-climatico-pelotas",
      description: "Consulte máximas, mínimas, chuva e vento dos últimos dias.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia",
      description: "Veja como a estação participa da consolidação dos dados.",
    },
  ],
} satisfies EditorialContentDefinition;

export const HISTORY_EDITORIAL_CONTENT = {
  eyebrow: "Contexto recente",
  title: "Como interpretar o histórico dos últimos 30 dias",
  answer:
    "O histórico reúne dias completos recentes para mostrar o que efetivamente ocorreu em Pelotas segundo a fonte identificada. Ele ajuda a comparar máximas, mínimas, chuva e rajadas, mas não substitui uma normal climatológica calculada com décadas de dados.",
  facts: [
    "Histórico descreve o passado; previsão estima o futuro.",
    "Trinta dias mostram um período recente, não definem sozinhos o clima de Pelotas.",
    "Falhas ou lacunas da fonte devem permanecer explícitas e não ser preenchidas com valores inventados.",
  ],
  faqs: [
    {
      question: "O histórico climático é uma previsão?",
      answer:
        "Não. A página apresenta dados de dias já concluídos. Para condições futuras, consulte as páginas de hoje, amanhã e sete dias.",
    },
    {
      question: "Os últimos 30 dias representam o clima normal de Pelotas?",
      answer:
        "Não. Normais climatológicas exigem séries longas e metodologia específica. A janela de 30 dias serve para contexto recente e comparação operacional.",
    },
    {
      question: "Por que a máxima diária difere da temperatura atual?",
      answer:
        "A máxima é o maior valor registrado durante um dia completo. A temperatura atual corresponde a uma leitura em um horário específico.",
    },
  ],
  relatedLinks: [
    {
      label: "Estação Embrapa em Pelotas",
      href: "/estacao-embrapa-pelotas",
      description: "Consulte a observação meteorológica local mais recente.",
    },
    {
      label: "Previsão para os próximos 7 dias",
      href: "/previsao-7-dias-pelotas",
      description: "Compare o período recente com a tendência futura.",
    },
    {
      label: "Metodologia dos dados",
      href: "/metodologia",
      description: "Veja origem, período de cobertura e limitações da série.",
    },
  ],
} satisfies EditorialContentDefinition;

export const CAMERAS_EDITORIAL_CONTENT = {
  eyebrow: "Observação visual",
  title: "Como usar as câmeras para acompanhar o tempo em Pelotas",
  answer:
    "As câmeras oferecem contexto visual sobre céu, visibilidade, superfície e condições aparentes em pontos específicos. Elas complementam radar, satélite, estações e previsão, mas uma imagem não mede temperatura, vento, volume de chuva ou nível da água.",
  facts: [
    "Uma transmissão só deve ser tratada como ao vivo quando o estado e o horário indicarem atualização recente.",
    "Lente molhada, neblina, reflexos, posição da câmera e iluminação podem alterar a percepção da imagem.",
    "Condições observadas em um ponto não representam automaticamente toda Pelotas ou toda a orla do Laranjal.",
  ],
  faqs: [
    {
      question: "Todas as câmeras estão sempre ao vivo?",
      answer:
        "Não. O portal informa o estado conhecido de cada transmissão. Uma câmera pode estar indisponível, apresentar imagem estática ou depender de uma transmissão pública externa.",
    },
    {
      question: "A câmera confirma que está chovendo em Pelotas?",
      answer:
        "Ela pode mostrar chuva aparente no ponto enquadrado, mas não mede intensidade nem abrangência. Compare com radar, estação local e previsão.",
    },
    {
      question: "A imagem substitui os dados meteorológicos?",
      answer:
        "Não. Câmeras são apoio visual. Decisões de segurança devem considerar medições, avisos oficiais e informações das autoridades.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas",
      description: "Compare a imagem com observação e previsão horária.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas",
      description: "Acompanhe nuvens, precipitação e trovoadas na região.",
    },
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal",
      description: "Consulte a telemetria pública e a tendência recente da água.",
    },
  ],
} satisfies EditorialContentDefinition;

export const HYDROLOGY_EDITORIAL_CONTENT = {
  eyebrow: "Leitura das águas",
  title: "Como interpretar a situação hidrológica de Pelotas",
  answer:
    "A página reúne leituras de estações e contexto meteorológico para acompanhar a Lagoa dos Patos e sistemas relacionados. Cada estação possui localização, referência e horário próprios; por isso, valores de pontos diferentes não devem ser comparados como se fossem uma única régua.",
  facts: [
    "A tendência recente ajuda a identificar subida, estabilidade ou descida, mas não é uma previsão garantida do nível futuro.",
    "Vento, chuva, descargas fluviais e circulação da Lagoa dos Patos podem influenciar níveis em escalas e locais diferentes.",
    "Situações de inundação ou emergência devem ser avaliadas pelos órgãos responsáveis e pelos comunicados oficiais.",
  ],
  faqs: [
    {
      question: "O nível é igual em toda a Lagoa dos Patos?",
      answer:
        "Não. Vento, geometria da lagoa, afluentes e localização provocam diferenças entre estações. Cada leitura deve ser interpretada no ponto e na referência informados.",
    },
    {
      question: "Um nível em elevação significa que haverá inundação?",
      answer:
        "Não necessariamente. A elevação é um sinal de tendência, mas o impacto depende de cotas locais, duração, vento, chuva, drenagem e orientações oficiais.",
    },
    {
      question: "Qual é a relação entre tempo e nível da água?",
      answer:
        "Chuva contribui para vazões e volumes, enquanto ventos persistentes podem represar ou deslocar água na Lagoa dos Patos. Os efeitos variam conforme direção, intensidade e duração.",
    },
  ],
  relatedLinks: [
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal",
      description: "Veja a leitura local e a evolução das últimas horas.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Consulte alertas associados a chuva, vento e tempestades.",
    },
    {
      label: "Fontes e metodologia",
      href: "/metodologia",
      description: "Conheça as redes, referências e limites das integrações.",
    },
  ],
} satisfies EditorialContentDefinition;

export const LARANJAL_LEVEL_EDITORIAL_CONTENT = {
  eyebrow: "Telemetria no Laranjal",
  title: "O que significa a leitura do nível da Lagoa no Laranjal",
  answer:
    "A leitura representa o nível registrado pela Estação Laranjal no horário informado e segundo a referência publicada pela fonte. A evolução das últimas horas ajuda a identificar tendência local, mas não deve ser interpretada isoladamente como previsão de alagamento ou inundação.",
  facts: [
    "Telemetria pode sofrer atrasos, interrupções ou correções; a última atualização deve acompanhar qualquer leitura.",
    "Uma variação curta pode refletir vento, oscilação local ou ruído, por isso a sequência de leituras é mais informativa do que um ponto isolado.",
    "Em condição de risco, siga a Defesa Civil, autoridades municipais e comunicados oficiais.",
  ],
  faqs: [
    {
      question: "O que representa o número exibido para o Laranjal?",
      answer:
        "Ele representa a leitura da estação no referencial utilizado pela fonte. Não deve ser comparado diretamente com marcas físicas ou outras estações sem conhecer o mesmo datum e a mesma metodologia.",
    },
    {
      question: "Com que frequência o nível é atualizado?",
      answer:
        "A frequência depende da fonte e da disponibilidade da telemetria. O portal apresenta o horário da última leitura válida e informa quando os dados estão indisponíveis ou defasados.",
    },
    {
      question: "Um valor alto confirma inundação no Laranjal?",
      answer:
        "Não por si só. O impacto depende da referência local, da tendência, do vento, da drenagem e das condições em cada trecho. Utilize comunicados das autoridades para decisões de segurança.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas",
      description: "Compare a leitura local com a rede regional e o contexto meteorológico.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas",
      description: "Confira alertas vigentes de chuva, vento e tempestade.",
    },
    {
      label: "Câmeras do Laranjal",
      href: "/cameras-ao-vivo-pelotas",
      description: "Use observação visual como complemento, sem substituir a telemetria.",
    },
  ],
} satisfies EditorialContentDefinition;
