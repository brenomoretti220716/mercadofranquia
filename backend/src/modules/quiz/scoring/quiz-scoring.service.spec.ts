import { Franchise } from '@prisma/client';
import { QuizAnswersDto } from '../schemas/create-quiz.schema';
import { QuizScoringService } from './quiz-scoring.service';
import { InvestmentZone } from './scoring.constants';

const baseAnswers: QuizAnswersDto = {
  q1Stage: 'Pesquisa inicial',
  q2DecisionLevel: 5,
  q3PreferredSegments: ['Alimentação'],
  q4PreferredSubsegments: ['Serviços Médicos e Clínicas'],
  q5ExcludedSegments: [],
  q6PreferredModel: 'Loja',
  q7LeadershipExperience: 'Até 5 pessoas',
  q8SalesGoalsExperience: 'Já atuei sob metas',
  q9TeamSizeComfort: '4–10 colaboradores',
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
  q26State: 'SP',
  q27Cities: ['São Paulo'],
  q28HasCommercialPoint: 'Estou avaliando locais',
  q29LocationFlexibility: 'Avaliaria conforme oportunidade',
};

function createFranchise(overrides: Partial<Franchise> = {}): Franchise {
  const now = new Date();
  return {
    id: 'fr1',
    name: 'Franquia Teste',
    slug: null,
    headquarterState: 'SP',
    segment: 'Alimentação - Food Service',
    subsegment: 'Clínicas médicas',
    businessType: null,
    franchiseStartYear: 2020,
    abfSince: 2021,
    videoUrl: null,
    updatedAt: now,
    createdAt: now,
    contactId: null,
    ownerId: null,
    isActive: true,
    brandFoundationYear: 2010,
    description: null,
    detailedDescription: null,
    headquarter: null,
    isAbfAssociated: null,
    logoUrl: null,
    totalUnits: 80,
    totalUnitsInBrazil: 80,
    thumbnailUrl: null,
    lastScrapedAt: null,
    scrapedWebsite: null,
    calculationBaseAdFee: null,
    calculationBaseRoyaltie: null,
    galleryUrls: null,
    isReview: true,
    averageRating: 4.5,
    ratingSum: 0,
    reviewCount: 0,
    unitsEvolution: null,
    favoritesCount: 0,
    isSponsored: false,
    minimumInvestment: 250_000 as any,
    maximumInvestment: 300_000 as any,
    minimumReturnOnInvestment: 18,
    maximumReturnOnInvestment: 24,
    franchiseFee: 50_000 as any,
    averageMonthlyRevenue: 80_000 as any,
    royalties: 6 as any,
    advertisingFee: 2 as any,
    setupCapital: 100_000 as any,
    workingCapital: 80_000 as any,
    storeArea: 80,
    ...overrides,
  };
}

describe('QuizScoringService', () => {
  let service: QuizScoringService;

  beforeEach(() => {
    service = new QuizScoringService();
  });

  it('should classify investment zone correctly', () => {
    const zone1 = service.classifyInvestmentZone(
      150_000,
      300_000,
      200_000,
      280_000,
    );
    const zone2 = service.classifyInvestmentZone(
      100_000,
      110_000,
      120_000,
      130_000,
    );
    const zone3 = service.classifyInvestmentZone(
      150_000,
      300_000,
      500_000,
      700_000,
    );

    expect(zone1).toBe(InvestmentZone.ZONE_1);
    expect(zone2).toBe(InvestmentZone.ZONE_2);
    expect(zone3).toBe(InvestmentZone.ZONE_3);
  });

  it('should compute full score with all pillars present (close to PRD example)', () => {
    const answers = { ...baseAnswers };
    const franchise = createFranchise();

    const score = service.scoreFranchise(answers, franchise);

    expect(score.zone).toBe(InvestmentZone.ZONE_1);
    // With current subsegment matcher this franchise matches the segment but
    // not the specific subsegment, so segmentScore is 30 instead of 40.
    expect(score.segmentScore).toBe(30);
    expect(score.investmentScore).toBe(30);
    expect(score.paybackScore).toBe(15);
    expect(score.revenueScore).toBe(10);
    expect(score.networkScore).toBe(4);
    expect(score.confidence).toBeCloseTo(1);
    expect(score.finalScore).toBeCloseTo(89);
  });

  it('should apply neutral values when data is missing', () => {
    const answers = { ...baseAnswers };
    const franchise = createFranchise({
      minimumInvestment: null as any,
      maximumInvestment: null as any,
      minimumReturnOnInvestment: null,
      averageMonthlyRevenue: null as any,
      totalUnits: null,
    });

    const score = service.scoreFranchise(answers, franchise);

    expect(score.investmentScore).toBeGreaterThan(0); // neutral-ish
    expect(score.paybackScore).toBeGreaterThan(0);
    expect(score.revenueScore).toBeGreaterThan(0);
    expect(score.networkScore).toBeGreaterThan(0);
  });

  it('should filter franchises by segment gate and excluded segments', () => {
    const answers: QuizAnswersDto = {
      ...baseAnswers,
      q3PreferredSegments: ['Alimentação'],
      q5ExcludedSegments: ['Serviços automotivos'],
    };

    const f1 = createFranchise({
      id: '1',
      segment: 'Alimentação - Food Service',
    });
    const f2 = createFranchise({
      id: '2',
      segment: 'Serviços automotivos',
    });
    const f3 = createFranchise({
      id: '3',
      segment: 'Casa e Construção',
    });

    const filtered = service.filterBySegmentGate(answers, [f1, f2, f3]);

    const ids = filtered.map((f) => f.id);
    expect(ids).toContain('1');
    expect(ids).not.toContain('2');
    expect(ids).not.toContain('3');
  });

  it('should not filter by segment when user is open to all', () => {
    const answers: QuizAnswersDto = {
      ...baseAnswers,
      q3PreferredSegments: ['Alimentação'],
      q5ExcludedSegments: ['Estou aberto(a) a avaliar todos os segmentos'],
    };

    const f1 = createFranchise({
      id: '1',
      segment: 'Alimentação - Food Service',
    });
    const f2 = createFranchise({
      id: '2',
      segment: 'Serviços automotivos',
    });

    const filtered = service.filterBySegmentGate(answers, [f1, f2]);
    const ids = filtered.map((f) => f.id);

    expect(ids).toContain('1');
    expect(ids).toContain('2');
  });
});
