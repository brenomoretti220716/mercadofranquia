import { InvestmentZone } from '../scoring/scoring.constants';

export class QuizSubmissionResponseDto {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class QuizFranchiseScoreBreakdownDto {
  segmentScore: number;
  investmentScore: number;
  paybackScore: number;
  revenueScore: number;
  networkScore: number;
  zone: InvestmentZone;
  confidence: number;
  finalScore: number;
}

export class QuizFranchiseResultDto {
  id: string;
  name: string;
  slug: string;
  segment: string | null;
  subsegment: string | null;
  minimumInvestment: number | null;
  maximumInvestment: number | null;
  averageMonthlyRevenue: number | null;
  totalUnits: number | null;
  logoUrl: string | null;
  score: QuizFranchiseScoreBreakdownDto;
}

export class QuizResultsPaginationDto {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class QuizResultsBlockDto {
  label: 'mais_compativeis' | 'proximas_do_seu_perfil';
  zone: InvestmentZone;
  franchises: QuizFranchiseResultDto[];
  pagination: QuizResultsPaginationDto;
}

export class QuizResultsResponseDto {
  hasSubmission: boolean;
  blocks: QuizResultsBlockDto[];
}

export class QuizProfileAnswerDto {
  /**
   * Stable key that identifies this answer within the quiz.
   * Example: "availableCapital", "expectedPayback", "preferredSegments".
   */
  key: string;

  /**
   * Human-readable label shown in the UI.
   * Example: "Capital disponível", "Payback desejado".
   */
  label: string;

  /**
   * Human-readable value as answered or normalized.
   * Example: "R$ 150 mil a R$ 300 mil", "12 a 24 meses".
   */
  value: string;
}

export class QuizProfileSummaryResponseDto {
  /**
   * Ordered list of the main quiz answers that directly impact the results.
   */
  answers: QuizProfileAnswerDto[];
}
