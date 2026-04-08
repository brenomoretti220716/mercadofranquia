import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizSubmission } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { QuizAnswersDto } from './schemas/create-quiz.schema';
import {
  QuizScoringService,
  ScoredFranchise,
} from './scoring/quiz-scoring.service';
import { InvestmentZone } from './scoring/scoring.constants';

export interface QuizProfileAnswer {
  key: string;
  label: string;
  value: string;
}

export interface QuizProfileSummaryResponse {
  answers: QuizProfileAnswer[];
}

export interface QuizResultsPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QuizResultsBlock {
  label: 'mais_compativeis' | 'proximas_do_seu_perfil';
  zone: InvestmentZone;
  franchises: ScoredFranchise[];
  pagination: QuizResultsPagination;
}

export interface QuizResultsResponse {
  hasSubmission: boolean;
  blocks: QuizResultsBlock[];
}

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: QuizScoringService,
  ) {}

  async getUserSubmission(userId: string): Promise<QuizSubmission | null> {
    return this.prisma.quizSubmission.findUnique({
      where: { userId },
    });
  }

  async saveSubmission(
    userId: string,
    answers: QuizAnswersDto,
  ): Promise<QuizSubmission> {
    const payload = JSON.stringify(answers);

    return this.prisma.quizSubmission.upsert({
      where: { userId },
      update: { answers: payload },
      create: { userId, answers: payload },
    });
  }

  async getResults(
    userId: string,
    page = 1,
    pageSize = 10,
  ): Promise<QuizResultsResponse> {
    const submission = await this.getUserSubmission(userId);

    if (!submission) {
      throw new NotFoundException(
        'Nenhum quiz encontrado para o usuário informado.',
      );
    }

    const answers: QuizAnswersDto = JSON.parse(
      submission.answers,
    ) as QuizAnswersDto;

    const franchises = await this.prisma.franchise.findMany({
      where: {
        isActive: true,
      },
    });

    const gatedBySegment = this.scoringService.filterBySegmentGate(
      answers,
      franchises,
    );

    const scored: ScoredFranchise[] = gatedBySegment.map((franchise) => ({
      ...franchise,
      score: this.scoringService.scoreFranchise(answers, franchise),
    }));

    const zone1 = scored.filter((f) => f.score.zone === InvestmentZone.ZONE_1);
    const zone2 = scored.filter((f) => f.score.zone === InvestmentZone.ZONE_2);
    const zone3 = scored.filter((f) => f.score.zone === InvestmentZone.ZONE_3);

    zone1.sort((a, b) => b.score.finalScore - a.score.finalScore);
    zone2.sort((a, b) => b.score.finalScore - a.score.finalScore);
    zone3.sort((a, b) => b.score.finalScore - a.score.finalScore);

    // Fallback: if no franchises land in the two main investment zones,
    // surface Zone 3 options as "próximas do seu perfil" instead of
    // returning an empty result set.
    const finalZone1 = zone1;
    let finalZone2 = zone2;
    if (
      finalZone1.length === 0 &&
      finalZone2.length === 0 &&
      zone3.length > 0
    ) {
      finalZone2 = zone3;
    }

    const MAX_RESULTS_PER_ZONE = 200;

    const paginateZone = (
      items: ScoredFranchise[],
    ): { paginated: ScoredFranchise[]; pagination: QuizResultsPagination } => {
      const limited = items.slice(0, MAX_RESULTS_PER_ZONE);
      const total = limited.length;
      const safePageSize = pageSize > 0 ? pageSize : 10;
      const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);
      const currentPage = page < 1 ? 1 : page > totalPages ? totalPages : page;
      const startIndex = (currentPage - 1) * safePageSize;
      const endIndex = startIndex + safePageSize;

      return {
        paginated: limited.slice(startIndex, endIndex),
        pagination: {
          total,
          page: currentPage,
          pageSize: safePageSize,
          totalPages,
        },
      };
    };

    const zone1Paginated = paginateZone(finalZone1);
    const zone2Paginated = paginateZone(finalZone2);

    const result: QuizResultsResponse = {
      hasSubmission: true,
      blocks: [
        {
          label: 'mais_compativeis',
          zone: InvestmentZone.ZONE_1,
          franchises: zone1Paginated.paginated,
          pagination: zone1Paginated.pagination,
        },
        {
          label: 'proximas_do_seu_perfil',
          zone: InvestmentZone.ZONE_2,
          franchises: zone2Paginated.paginated,
          pagination: zone2Paginated.pagination,
        },
      ],
    };

    return result;
  }

  async getProfileSummary(userId: string): Promise<QuizProfileSummaryResponse> {
    const submission = await this.getUserSubmission(userId);

    if (!submission) {
      throw new NotFoundException(
        'Nenhum quiz encontrado para o usuário informado.',
      );
    }

    const answers: QuizAnswersDto = JSON.parse(
      submission.answers,
    ) as QuizAnswersDto;

    const mappedAnswers: QuizProfileAnswer[] = [
      {
        key: 'availableCapital',
        label: 'Capital disponível',
        value: answers.q20AvailableCapital,
      },
      {
        key: 'desiredMonthlyWithdrawal',
        label: 'Retirada mensal desejada',
        value: answers.q23DesiredMonthlyWithdrawal,
      },
      {
        key: 'expectedPayback',
        label: 'Payback esperado',
        value: answers.q24ExpectedPayback,
      },
      {
        key: 'preferredSegments',
        label: 'Segmentos de interesse',
        value: answers.q3PreferredSegments.join(', '),
      },
      {
        key: 'preferredSubsegments',
        label: 'Subsegmentos de interesse',
        value: answers.q4PreferredSubsegments.join(', '),
      },
    ];

    return {
      answers: mappedAnswers,
    };
  }
}
