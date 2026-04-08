import { type QuizSegmentKey } from '@/src/data/quiz-segments'
import { z } from 'zod'

export const QuizFormSchema = z
  .object({
    // Etapa 1 — Seu momento
    q1Stage: z.enum(
      [
        'Pesquisa inicial',
        'Avaliando marcas',
        'Conversando com franqueadoras',
        'Decisão avançada',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q2DecisionLevel: z
      .number({
        required_error: 'Informe um número de 0 a 10',
        invalid_type_error: 'Informe um número de 0 a 10',
      })
      .min(0, { message: 'O mínimo é 0' })
      .max(10, { message: 'O máximo é 10' }),

    // Etapa 2 — Áreas de interesse
    q3PreferredSegments: z
      .array(z.custom<QuizSegmentKey>())
      .min(1, { message: 'Selecione pelo menos 1 segmento' })
      .max(2, { message: 'Selecione no máximo 2 segmentos' }),

    q4PreferredSubsegments: z
      .array(z.string())
      .max(2, { message: 'Selecione no máximo 2 subsegmentos' }),

    q5ExcludedSegments: z.array(z.string()).optional().default([]),

    q6PreferredModel: z.enum(
      ['Home Based', 'Loja', 'Quiosque', 'Outro', 'Ainda não definido'] as [
        string,
        ...string[],
      ],
      { required_error: 'Selecione uma opção' },
    ),

    // Etapa 3 — Capacidade operacional
    q7LeadershipExperience: z.enum(
      [
        'Nunca liderei equipe',
        'Até 5 pessoas',
        '6 a 15 pessoas',
        'Mais de 15 pessoas',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q8SalesGoalsExperience: z.enum(
      ['Nenhuma', 'Já atuei sob metas', 'Já liderei metas'] as [
        string,
        ...string[],
      ],
      { required_error: 'Selecione uma opção' },
    ),
    q9TeamSizeComfort: z.enum(
      ['1–3 colaboradores', '4–10 colaboradores', '10+ colaboradores'] as [
        string,
        ...string[],
      ],
      { required_error: 'Selecione uma opção' },
    ),
    q10StandardizationComfort: z.enum(
      [
        'Prefiro autonomia total',
        'Aceito com flexibilidade',
        'Não tenho problema com padrão rigoroso',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q11TrainingWillingness: z.enum(
      [
        'Sim, totalmente',
        'Sim, se for essencial',
        'Prefiro aprender na prática',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q12PressureReaction: z.enum(
      [
        'Evito risco',
        'Mantenho controle, mas fico desconfortável',
        'Tomo decisões com calma e estratégia',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),

    // Etapa 4 — Visão do negócio
    q13InvolvementLevel: z.enum(
      ['Operação integral', 'Gestão estratégica', 'Apenas investidor'] as [
        string,
        ...string[],
      ],
      { required_error: 'Selecione uma opção' },
    ),
    q14GrowthPlan: z.enum(
      [
        'Operar apenas 1 unidade',
        'Expandir para 2–3 unidades',
        'Construir operação regional',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q15IdealFranchiseDescription: z
      .string()
      .max(5000, { message: 'Descrição muito longa' })
      .optional()
      .default(''),

    // Etapa 5 — Perfil investidor
    q16InvestorProfile: z.enum(
      ['Conservador', 'Moderado', 'Agressivo'] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q17PrioritiesRanking: z
      .array(
        z.enum([
          'Rentabilidade',
          'Segurança',
          'Marca',
          'Escalabilidade',
          'Simplicidade operacional',
        ] as [string, ...string[]]),
      )
      .length(5, { message: 'Ordene todas as 5 prioridades' })
      .refine(
        (items) => new Set(items).size === items.length,
        'Cada prioridade deve aparecer apenas uma vez',
      ),
    q18MaturationTolerance: z.enum(
      [
        'Considera inviável',
        'Avaliaria conforme projeção',
        'Está preparado',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q19UnderperformanceReaction: z.enum(
      [
        'Ajustaria expectativa',
        'Buscaria outro modelo',
        'Só investiria se atingir a meta',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),

    // Etapa 6 — Viabilidade financeira
    q20AvailableCapital: z.enum(
      [
        'Até R$ 150 mil',
        'R$ 150 mil a R$ 300 mil',
        'R$ 300 mil a R$ 600 mil',
        'R$ 600 mil a R$ 1 milhão',
        'Acima de R$ 1 milhão',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q21FinancialReserve: z.enum(
      [
        'Menos de 3 meses',
        '3 a 6 meses',
        '6 a 12 meses',
        'Acima de 12 meses',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q22FinancingPercentage: z.enum(
      ['0%', 'Até 30%', '30% a 60%', 'Acima de 60%'] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q23DesiredMonthlyWithdrawal: z.enum(
      [
        'Até R$ 5 mil',
        'R$ 5 mil a R$ 10 mil',
        'R$ 10 mil a R$ 20 mil',
        'R$ 20 mil a R$ 40 mil',
        'Acima de R$ 40 mil',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q24ExpectedPayback: z.enum(
      [
        'Até 12 meses',
        '12 a 24 meses',
        '24 a 36 meses',
        'Acima de 36 meses',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
    q25DependsOnFranchiseIncome: z.enum(
      [
        'Sim, imediatamente',
        'Em até 6 meses',
        'Em até 12 meses',
        'Não tenho essa pressão',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),

    // Etapa 7 — Localização
    q26State: z
      .string({ required_error: 'Selecione um estado' })
      .min(1, { message: 'Selecione um estado' }),
    q27Cities: z.preprocess(
      (val) =>
        Array.isArray(val)
          ? (val as string[]).filter(
              (s) => typeof s === 'string' && s.trim().length > 0,
            )
          : val,
      z
        .array(
          z
            .string()
            .min(1, { message: 'Cidade não pode ser vazia' })
            .max(100, { message: 'Nome de cidade muito longo' }),
        )
        .min(1, { message: 'Informe pelo menos uma cidade' }),
    ),
    q28HasCommercialPoint: z.enum(
      ['Sim', 'Estou avaliando locais', 'Ainda não comecei'] as [
        string,
        ...string[],
      ],
      { required_error: 'Selecione uma opção' },
    ),
    q29LocationFlexibility: z.enum(
      [
        'Sim',
        'Apenas na cidade escolhida',
        'Avaliaria conforme oportunidade',
      ] as [string, ...string[]],
      { required_error: 'Selecione uma opção' },
    ),
  })
  .refine(
    (data) => {
      if (data.q3PreferredSegments.length === 0) return true
      return data.q4PreferredSubsegments.length >= 1
    },
    {
      message: 'Selecione pelo menos 1 subsegmento nos segmentos escolhidos',
      path: ['q4PreferredSubsegments'],
    },
  )

export type QuizFormValues = z.infer<typeof QuizFormSchema>

export type QuizStep =
  | 'momento'
  | 'interesses'
  | 'operacional'
  | 'visao'
  | 'investidor'
  | 'financeiro'
  | 'localizacao'

export const defaultQuizValues: QuizFormValues = {
  q1Stage: 'Pesquisa inicial',
  q2DecisionLevel: 5,
  q3PreferredSegments: [],
  q4PreferredSubsegments: [],
  q5ExcludedSegments: [],
  q6PreferredModel: 'Ainda não definido',
  q7LeadershipExperience: 'Nunca liderei equipe',
  q8SalesGoalsExperience: 'Nenhuma',
  q9TeamSizeComfort: '1–3 colaboradores',
  q10StandardizationComfort: 'Aceito com flexibilidade',
  q11TrainingWillingness: 'Sim, totalmente',
  q12PressureReaction: 'Evito risco',
  q13InvolvementLevel: 'Operação integral',
  q14GrowthPlan: 'Operar apenas 1 unidade',
  q15IdealFranchiseDescription: '',
  q16InvestorProfile: 'Moderado',
  q17PrioritiesRanking: [
    'Rentabilidade',
    'Segurança',
    'Marca',
    'Escalabilidade',
    'Simplicidade operacional',
  ],
  q18MaturationTolerance: 'Avaliaria conforme projeção',
  q19UnderperformanceReaction: 'Ajustaria expectativa',
  q20AvailableCapital: 'R$ 150 mil a R$ 300 mil',
  q21FinancialReserve: '3 a 6 meses',
  q22FinancingPercentage: 'Até 30%',
  q23DesiredMonthlyWithdrawal: 'R$ 10 mil a R$ 20 mil',
  q24ExpectedPayback: '24 a 36 meses',
  q25DependsOnFranchiseIncome: 'Não tenho essa pressão',
  q26State: '',
  q27Cities: [''],
  q28HasCommercialPoint: 'Estou avaliando locais',
  q29LocationFlexibility: 'Avaliaria conforme oportunidade',
}
