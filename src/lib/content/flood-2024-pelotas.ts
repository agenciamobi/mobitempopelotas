export type Flood2024Stage =
  | "centro-norte"
  | "rios"
  | "guaiba"
  | "lagoa"
  | "pelotas"
  | "estuario"
  | "retorno";

export type Flood2024TimelineItem = {
  date: string;
  title: string;
  stage: Flood2024Stage;
  stageLabel: string;
  paragraphs: string[];
  highlight?: string;
};

export const FLOOD_2024_HYDROLOGICAL_PATH = [
  "Centro e Norte do RS",
  "Taquari, Caí, Sinos, Jacuí e outros rios",
  "Guaíba — Porto Alegre",
  "Lagoa dos Patos",
  "Itapuã",
  "Arambaré",
  "São Lourenço do Sul",
  "Pelotas — Laranjal",
  "São José do Norte e Rio Grande",
  "Oceano Atlântico",
] as const;

export const FLOOD_2024_TIMELINE: Flood2024TimelineItem[] = [
  {
    date: "26 de abril de 2024",
    title: "Começam os primeiros alertas meteorológicos",
    stage: "centro-norte",
    stageLabel: "Centro e Norte do RS",
    paragraphs: [
      "O INMET já indicava a possibilidade de volumes significativos de chuva no Rio Grande do Sul. Nos dias seguintes, uma configuração atmosférica persistente manteria instabilidades sobre o Estado.",
      "Em 29 de abril foi emitido o primeiro aviso vermelho, com previsão de acumulados superiores a 100 milímetros em 24 horas em extensa área gaúcha.",
    ],
  },
  {
    date: "28 de abril a 2 de maio",
    title: "Chuva excepcional atinge o Centro e o Norte do Estado",
    stage: "centro-norte",
    stageLabel: "Centro e Norte do RS",
    paragraphs: [
      "Os maiores volumes de precipitação se concentram principalmente nas bacias que alimentam o sistema do Guaíba.",
      "Em partes do Rio Grande do Sul, os acumulados atingiram centenas de milímetros em poucos dias. Posteriormente, estudos caracterizariam a chuva de 2024 como excepcional tanto pela intensidade quanto pela enorme área atingida.",
      "Rios começam a subir rapidamente e várias cidades registram enchentes e enxurradas. Para Pelotas, entretanto, o principal efeito ainda estava por vir.",
    ],
  },
  {
    date: "1º e 2 de maio",
    title: "O desastre se consolida no Rio Grande do Sul",
    stage: "rios",
    stageLabel: "Rios da Bacia do Guaíba",
    paragraphs: [
      "Santa Maria registra 213,6 mm em um único dia em 1º de maio, recorde da estação em 112 anos. No dia seguinte, Caxias do Sul registra 266,2 mm.",
      "O volume recebido por rios como Taquari, Caí, Sinos e Jacuí avança em direção à Região Metropolitana e ao Guaíba.",
      "Em 2 de maio, Pelotas já inicia ações preventivas. A Prefeitura alerta que as águas que inundavam as regiões Norte e Centro poderiam alcançar posteriormente a Lagoa dos Patos depois de passarem pelo Guaíba.",
    ],
  },
  {
    date: "3 de maio",
    title: "Pelotas entra em preparação para a cheia",
    stage: "guaiba",
    stageLabel: "Guaíba → Lagoa dos Patos",
    paragraphs: [
      "A Defesa Civil Estadual alerta para a possível elevação da Lagoa dos Patos em razão da água proveniente da Região Metropolitana.",
      "Pelotas começa a preparar abrigos e acompanhar regiões vulneráveis como Colônia Z3, Pontal da Barra, Laranjal e áreas próximas ao Canal São Gonçalo.",
      "Famílias da Z3 começam preventivamente a retirar móveis de suas residências.",
    ],
  },
  {
    date: "5 de maio",
    title: "Guaíba atinge nível histórico",
    stage: "guaiba",
    stageLabel: "Guaíba — Porto Alegre",
    paragraphs: [
      "Às 5h30, a estação Cais Mauá registra 5,35 metros no Guaíba, superando o recorde histórico associado à enchente de 1941.",
      "A partir daquele momento, uma questão passa a ser fundamental para o sul do Estado: para onde iria todo aquele volume de água? A resposta era a Lagoa dos Patos.",
    ],
    highlight: "5,35 m no Cais Mauá às 5h30",
  },
  {
    date: "7 de maio",
    title: "ANA alerta para uma cheia histórica na Lagoa dos Patos",
    stage: "lagoa",
    stageLabel: "Lagoa dos Patos",
    paragraphs: [
      "A Agência Nacional de Águas passa a destacar o monitoramento de Arambaré, São Lourenço do Sul, Pelotas e Rio Grande.",
      "Naquele momento, a ANA já alertava que a cheia na Lagoa dos Patos e nas regiões de Pelotas e Rio Grande poderia superar tanto o evento de 2023 quanto o grande evento histórico de 1941.",
      "O problema de Porto Alegre começava claramente a se transformar em um problema para toda a Lagoa.",
    ],
  },
  {
    date: "8 de maio",
    title: "A ameaça chega ao Laranjal",
    stage: "pelotas",
    stageLabel: "Pelotas e Laranjal",
    paragraphs: [
      "O Cemaden registra a Lagoa dos Patos em 2,15 metros em Pelotas e aponta probabilidade muito alta de inundação severa em municípios do entorno e da foz da Lagoa, incluindo Pelotas.",
      "O órgão destaca que vento, maré, nível da Lagoa e vazões das demais bacias poderiam alterar significativamente o comportamento da cheia.",
      "No Laranjal, a situação já se agrava. A região da Nova Prata, no Valverde, entra em processo de evacuação.",
      "A UBS Laranjal é atingida pela água e precisa ser fechada. Posteriormente, seria constatado que a inundação chegou a aproximadamente 70 centímetros dentro da unidade.",
      "Nesse mesmo dia é estruturada a Sala de Situação Municipal, no 9º Batalhão de Infantaria Motorizado.",
    ],
  },
  {
    date: "9 de maio",
    title: "Evacuações aumentam no Valverde",
    stage: "pelotas",
    stageLabel: "Pelotas — Laranjal",
    paragraphs: [
      "A Defesa Civil realiza a retirada de moradores da rua Nova Prata, no balneário Valverde.",
      "A ação envolveu cerca de 60 moradores de 15 residências situadas em área considerada de alto risco de inundação. A água continuava avançando.",
    ],
  },
  {
    date: "10 de maio",
    title: "Valverde é tomado pela água",
    stage: "pelotas",
    stageLabel: "Laranjal e Canal São Gonçalo",
    paragraphs: [
      "O Laranjal entra em uma das fases mais dramáticas da enchente.",
      "Desde a madrugada, Corpo de Bombeiros, Defesa Civil e Exército atuam no resgate de moradores e animais ilhados no balneário Valverde. Em alguns pontos, a profundidade da água se aproxima de 1,5 metro.",
      "Ao meio-dia, o Canal São Gonçalo chega a 2,72 metros, após subir 36 centímetros em aproximadamente 24 horas.",
      "Ventos de leste e sudeste dificultavam o escoamento da Lagoa dos Patos em direção ao oceano e favoreciam o represamento e deslocamento das águas.",
    ],
    highlight: "Canal São Gonçalo: 2,72 m ao meio-dia",
  },
  {
    date: "11 de maio",
    title: "UFPel prevê a chegada do grande volume do Guaíba",
    stage: "lagoa",
    stageLabel: "Lagoa dos Patos → Pelotas",
    paragraphs: [
      "Modelagens desenvolvidas por pesquisadores da UFPel indicam que o maior volume de água proveniente do sistema do Guaíba deveria atingir Pelotas principalmente entre 13 e 15 de maio.",
      "Os pesquisadores fazem uma distinção importante em relação às enchentes violentas observadas na Serra: em Pelotas, devido ao relevo extremamente plano, a água tenderia a avançar lentamente, como uma grande lâmina, espalhando-se pelas áreas mais baixas.",
    ],
  },
  {
    date: "12 de maio",
    title: "Canal São Gonçalo iguala a enchente de 1941",
    stage: "pelotas",
    stageLabel: "Canal São Gonçalo",
    paragraphs: [
      "Às 19h, a régua do Porto de Pelotas registra 2,88 metros.",
      "Era exatamente a marca associada à histórica enchente de 1941, ocorrida 83 anos antes.",
      "Áreas próximas ao canal entram em alerta máximo e a Prefeitura reforça a necessidade de evacuação. Naquele momento, vento, chuva e maré ainda influenciavam fortemente a dinâmica das águas.",
    ],
    highlight: "2,88 m — mesma marca de referência de 1941",
  },
  {
    date: "13 a 15 de maio",
    title: "Chega o grande volume vindo do norte da Lagoa",
    stage: "pelotas",
    stageLabel: "Lagoa dos Patos → Pelotas",
    paragraphs: [
      "É o período apontado pelas simulações da UFPel para a chegada de parte importante do volume proveniente do Guaíba.",
      "A cheia já afeta diretamente os balneários Valverde e Santo Antônio, a Colônia Z3 e outras regiões baixas de Pelotas.",
      "A enchente deixa de ser apenas consequência dos ventos ou das chuvas locais. A própria Lagoa dos Patos encontra-se excepcionalmente cheia.",
    ],
  },
  {
    date: "15 de maio",
    title: "O recorde de 1941 é superado",
    stage: "pelotas",
    stageLabel: "Canal São Gonçalo",
    paragraphs: [
      "Às 21h, o Canal São Gonçalo registra 2,89 metros.",
      "Pela primeira vez naquele evento, a medição ultrapassa oficialmente a referência de 2,88 metros de 1941.",
      "Especialistas apontam que o grande volume acumulado na Lagoa dos Patos passou a produzir elevação mesmo sem necessidade de chuva ou vento forte.",
      "A enorme quantidade de água que chegava pelo sistema Guaíba–Lagoa não conseguia ser eliminada com a mesma velocidade pela saída em Rio Grande.",
    ],
    highlight: "2,89 m no Canal São Gonçalo às 21h",
  },
  {
    date: "16 de maio",
    title: "São Gonçalo supera os três metros",
    stage: "estuario",
    stageLabel: "São Gonçalo ↔ estuário de Rio Grande",
    paragraphs: [
      "Durante a madrugada, o Canal São Gonçalo chega pela primeira vez a 3,00 metros. Ao meio-dia, atinge 3,02 metros.",
      "Pelotas entra em um cenário hidrológico sem precedentes nos registros utilizados durante a emergência.",
      "Pesquisadores observam ainda uma situação atípica no estuário: o nível da maré permanecia elevado havia mais de 36 horas.",
      "A dificuldade de saída pelo estuário de Rio Grande contribuía para um efeito de empilhamento das águas na Lagoa dos Patos, que por sua vez dificultava o escoamento do Canal São Gonçalo.",
    ],
    highlight: "3,02 m no Canal São Gonçalo ao meio-dia",
  },
  {
    date: "17 a 21 de maio",
    title: "A água permanece em níveis extremamente altos",
    stage: "lagoa",
    stageLabel: "Lagoa dos Patos e São Gonçalo",
    paragraphs: [
      "Não ocorre uma rápida normalização.",
      "A Lagoa dos Patos funciona como um enorme reservatório natural e a retirada de todo o volume acumulado exige tempo.",
      "Em 21 de maio, Lagoa e São Gonçalo apresentavam relativa estabilização, porém ainda em níveis elevados. A previsão de novas chuvas e mudanças na direção dos ventos mantinha Pelotas em alerta.",
    ],
  },
  {
    date: "22 a 24 de maio",
    title: "Nova chuva agrava a crise",
    stage: "pelotas",
    stageLabel: "Pelotas",
    paragraphs: [
      "Pelotas volta a receber volumes muito elevados de precipitação.",
      "Entre quarta-feira, dia 22, e a manhã do dia 24, pluviômetros registram acumulados entre aproximadamente 130 e 160 milímetros, chegando a 167 mm em uma estação do Sanep.",
      "O solo já estava saturado, os mananciais estavam altos e o sistema de drenagem operava sob enorme pressão. Novas áreas urbanas passam para a classificação de risco máximo.",
      "A enchente entra em uma segunda fase crítica.",
    ],
  },
  {
    date: "26 de maio",
    title: "Novo máximo histórico do Canal São Gonçalo",
    stage: "pelotas",
    stageLabel: "Canal São Gonçalo",
    paragraphs: [
      "Quando parecia que o pior nível do canal já havia sido alcançado, ocorre um novo recorde.",
      "O São Gonçalo chega a 3,04 metros. Era o maior valor já registrado pela régua utilizada pela Prefeitura durante o evento.",
      "Mais de três semanas após o primeiro alerta para Pelotas, a cidade ainda enfrentava uma situação hidrológica extrema.",
    ],
    highlight: "3,04 m — maior valor registrado pela régua usada na emergência",
  },
  {
    date: "Final de maio",
    title: "A enchente continua",
    stage: "pelotas",
    stageLabel: "Pelotas e Laranjal",
    paragraphs: [
      "Em 29 de maio, uma vistoria pelas áreas afetadas identifica o balneário Valverde como uma das regiões mais atingidas pelo avanço da Lagoa dos Patos.",
      "No dia 30, mesmo após o período mais crítico, os níveis continuavam muito elevados: Canal São Gonçalo em 2,89 m e Lagoa dos Patos no Trapiche em 2,30 m.",
      "A redução era lenta.",
    ],
  },
  {
    date: "1º de junho",
    title: "Ainda não era possível retirar toda a água do Laranjal",
    stage: "retorno",
    stageLabel: "Laranjal — drenagem ainda limitada",
    paragraphs: [
      "Mesmo com a diminuição gradual da cheia, o Laranjal continuava com grandes áreas inundadas.",
      "Na manhã de 1º de junho, a medição da Lagoa dos Patos no Trapiche chegou a 2,43 metros.",
      "O nível externo ainda dificultava o bombeamento da água acumulada dentro dos balneários.",
    ],
  },
  {
    date: "2 de junho",
    title: "Finalmente começa uma drenagem mais efetiva",
    stage: "retorno",
    stageLabel: "Laranjal — início da drenagem",
    paragraphs: [
      "Com a Lagoa dos Patos recuando para aproximadamente 2,21 metros, torna-se possível retomar a operação da casa de bombas do Pontal da Barra.",
      "Bombas adicionais são instaladas para retirar a água acumulada nos balneários Santo Antônio e Valverde.",
      "O problema deixava lentamente de ser a entrada de água da Lagoa e passava a ser retirar a água que havia permanecido represada dentro do bairro.",
    ],
  },
  {
    date: "6 de junho",
    title: "Termina a fase mais crítica da operação",
    stage: "retorno",
    stageLabel: "Pelotas — transição para reconstrução",
    paragraphs: [
      "Após 28 dias, são encerradas as atividades coletivas da Sala de Situação Municipal.",
      "Os níveis dos mananciais estavam em processo de redução e Pelotas entrava oficialmente em uma nova etapa: a reconstrução.",
      "Mesmo assim, Laranjal e áreas adjacentes permaneciam marcados em vermelho no mapa de risco porque ainda havia locais onde moradores não conseguiam retornar para casa.",
    ],
    highlight: "28 dias de operação da Sala de Situação Municipal",
  },
  {
    date: "7 de junho",
    title: "Famílias começam a voltar ao Laranjal",
    stage: "retorno",
    stageLabel: "Laranjal — retorno gradual",
    paragraphs: [
      "A drenagem apresenta resultados mais expressivos nos balneários.",
      "Famílias começam a retornar às residências e realizar a limpeza dos imóveis.",
      "O Pontal da Barra permanecia como uma das últimas regiões do Laranjal ainda com água acumulada, exigindo operação específica de drenagem.",
    ],
  },
  {
    date: "Junho de 2024",
    title: "Começa a reconstrução",
    stage: "retorno",
    stageLabel: "Reconstrução",
    paragraphs: [
      "A crise imediata perde força, mas as consequências permanecem.",
      "Casas, estabelecimentos, equipamentos públicos, estradas e sistemas urbanos precisavam ser recuperados.",
      "Milhares de moradores afetados passam a ser cadastrados para programas de auxílio e reconstrução. Até 6 de junho, Pelotas já havia encaminhado mais de 3,7 mil registros ao Auxílio Reconstrução, inicialmente com forte presença de moradores da Z3, Valverde e Santo Antônio.",
    ],
  },
  {
    date: "1º de julho",
    title: "UBS Laranjal volta a funcionar",
    stage: "retorno",
    stageLabel: "Laranjal — recuperação",
    paragraphs: [
      "Após permanecer fechada por 54 dias, a Unidade Básica de Saúde do Laranjal reabre.",
      "A enchente havia deixado aproximadamente 70 centímetros de água dentro do prédio e afetado móveis, equipamentos e a rede elétrica.",
      "A reabertura torna-se um dos marcos locais da recuperação do bairro.",
    ],
    highlight: "54 dias até a reabertura da UBS Laranjal",
  },
];

export const FLOOD_2024_SOURCE_ORGANIZATIONS = [
  "Agência Nacional de Águas e Saneamento Básico (ANA)",
  "Serviço Geológico do Brasil (SGB)",
  "Cemaden",
  "INMET",
  "Universidade Federal de Pelotas (UFPel)",
  "Prefeitura Municipal de Pelotas",
  "Defesa Civil",
] as const;
