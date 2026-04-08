import { z } from 'zod';

/**
 * Quiz submission schema.
 * Mirrors the 29 questions defined in quiz-prd.md.
 */
export const quizAnswersSchema = z.object({
  // Etapa 1 — Seu momento
  q1Stage: z.enum([
    'Pesquisa inicial',
    'Avaliando marcas',
    'Conversando com franqueadoras',
    'Decisão avançada',
  ]),
  q2DecisionLevel: z
    .number()
    .min(0, 'O nível mínimo é 0')
    .max(10, 'O nível máximo é 10'),

  // Etapa 2 — Áreas de interesse
  q3PreferredSegments: z
    .array(z.string())
    .min(1, 'Escolha pelo menos 1 segmento')
    .max(2, 'Você pode escolher no máximo 2 segmentos'),

  q4PreferredSubsegments: z
    .array(z.string())
    .min(1, 'Escolha pelo menos 1 subsegmento')
    .max(2, 'Você pode escolher no máximo 2 subsegmentos'),

  q5ExcludedSegments: z.array(z.string()).optional(),

  q6PreferredModel: z.enum([
    'Home Based',
    'Loja',
    'Quiosque',
    'Outro',
    'Ainda não definido',
  ]),

  // Etapa 3 — Capacidade operacional
  q7LeadershipExperience: z.enum([
    'Nunca liderei equipe',
    'Até 5 pessoas',
    '6 a 15 pessoas',
    'Mais de 15 pessoas',
  ]),

  q8SalesGoalsExperience: z.enum([
    'Nenhuma',
    'Já atuei sob metas',
    'Já liderei metas',
  ]),

  q9TeamSizeComfort: z.enum([
    '1–3 colaboradores',
    '4–10 colaboradores',
    '10+ colaboradores',
  ]),

  q10StandardizationComfort: z.enum([
    'Prefiro autonomia total',
    'Aceito com flexibilidade',
    'Não tenho problema com padrão rigoroso',
  ]),

  q11TrainingWillingness: z.enum([
    'Sim, totalmente',
    'Sim, se for essencial',
    'Prefiro aprender na prática',
  ]),

  q12PressureReaction: z.enum([
    'Evito risco',
    'Mantenho controle, mas fico desconfortável',
    'Tomo decisões com calma e estratégia',
  ]),

  // Etapa 4 — Visão do negócio
  q13InvolvementLevel: z.enum([
    'Operação integral',
    'Gestão estratégica',
    'Apenas investidor',
  ]),

  q14GrowthPlan: z.enum([
    'Operar apenas 1 unidade',
    'Expandir para 2–3 unidades',
    'Construir operação regional',
  ]),

  q15IdealFranchiseDescription: z
    .string()
    .min(0)
    .max(5000, 'Descrição muito longa'),

  // Etapa 5 — Perfil investidor
  q16InvestorProfile: z.enum(['Conservador', 'Moderado', 'Agressivo']),

  q17PrioritiesRanking: z
    .array(
      z.enum([
        'Rentabilidade',
        'Segurança',
        'Marca',
        'Escalabilidade',
        'Simplicidade operacional',
      ]),
    )
    .length(5, 'Você deve ordenar todos os 5 itens')
    .refine(
      (items) => new Set(items).size === items.length,
      'Cada prioridade deve aparecer apenas uma vez',
    ),

  q18MaturationTolerance: z.enum([
    'Considera inviável',
    'Avaliaria conforme projeção',
    'Está preparado',
  ]),

  q19UnderperformanceReaction: z.enum([
    'Ajustaria expectativa',
    'Buscaria outro modelo',
    'Só investiria se atingir a meta',
  ]),

  // Etapa 6 — Viabilidade financeira
  q20AvailableCapital: z.enum([
    'Até R$ 150 mil',
    'R$ 150 mil a R$ 300 mil',
    'R$ 300 mil a R$ 600 mil',
    'R$ 600 mil a R$ 1 milhão',
    'Acima de R$ 1 milhão',
  ]),

  q21FinancialReserve: z.enum([
    'Menos de 3 meses',
    '3 a 6 meses',
    '6 a 12 meses',
    'Acima de 12 meses',
  ]),

  q22FinancingPercentage: z.enum(['0%', 'Até 30%', '30% a 60%', 'Acima de 60%']),

  q23DesiredMonthlyWithdrawal: z.enum([
    'Até R$ 5 mil',
    'R$ 5 mil a R$ 10 mil',
    'R$ 10 mil a R$ 20 mil',
    'R$ 20 mil a R$ 40 mil',
    'Acima de R$ 40 mil',
  ]),

  q24ExpectedPayback: z.enum([
    'Até 12 meses',
    '12 a 24 meses',
    '24 a 36 meses',
    'Acima de 36 meses',
  ]),

  q25DependsOnFranchiseIncome: z.enum([
    'Sim, imediatamente',
    'Em até 6 meses',
    'Em até 12 meses',
    'Não tenho essa pressão',
  ]),

  // Etapa 7 — Localização
  q26State: z.string().min(1, 'Estado é obrigatório'),

  q27Cities: z
    .array(z.string().min(1, 'Cidade não pode ser vazia'))
    .min(1, 'Informe pelo menos uma cidade'),

  q28HasCommercialPoint: z.enum([
    'Sim',
    'Estou avaliando locais',
    'Ainda não comecei',
  ]),

  q29LocationFlexibility: z.enum([
    'Sim',
    'Apenas na cidade escolhida',
    'Avaliaria conforme oportunidade',
  ]),
});

export type QuizAnswersDto = z.infer<typeof quizAnswersSchema>;

