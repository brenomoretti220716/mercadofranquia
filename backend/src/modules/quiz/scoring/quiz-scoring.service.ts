import { Injectable } from '@nestjs/common';
import { Franchise } from '@prisma/client';
import { QuizAnswersDto } from '../schemas/create-quiz.schema';
import {
  INVESTMENT_ZONE_1_MULTIPLIER,
  INVESTMENT_ZONE_2_MULTIPLIER,
  INVESTMENT_ZONE_TOLERANCE,
  InvestmentZone,
  MAX_INVESTMENT_SCORE,
  MAX_PAYBACK_SCORE,
  MAX_REVENUE_SCORE,
  MAX_SEGMENT_SCORE,
  NEUTRAL_NETWORK_SCORE,
  NEUTRAL_PAYBACK_SCORE,
  NEUTRAL_REVENUE_SCORE,
} from './scoring.constants';
import {
  isSegmentFamilyMatch,
  isSubsegmentMatch,
  mapQuizSegmentToDbSegments,
} from './segment-matcher.util';

export interface FranchiseScoreBreakdown {
  segmentScore: number;
  investmentScore: number;
  paybackScore: number;
  revenueScore: number;
  networkScore: number;
  zone: InvestmentZone;
  confidence: number;
  finalScore: number;
}

export interface ScoredFranchise extends Franchise {
  score: FranchiseScoreBreakdown;
}

@Injectable()
export class QuizScoringService {
  classifyInvestmentZone(
    userCapitalMin: number,
    userCapitalMax: number,
    franchiseMin?: number | null,
    franchiseMax?: number | null,
  ): InvestmentZone {
    if (franchiseMin == null || franchiseMax == null) {
      return InvestmentZone.ZONE_1;
    }

    const overlaps =
      franchiseMin <= userCapitalMax && franchiseMax >= userCapitalMin;

    if (overlaps) {
      return InvestmentZone.ZONE_1;
    }

    const userMid = (userCapitalMin + userCapitalMax) / 2;
    const frMid = (franchiseMin + franchiseMax) / 2;
    const diff = Math.abs(frMid - userMid);
    const relativeDiff = diff / userMid;

    if (relativeDiff <= INVESTMENT_ZONE_TOLERANCE) {
      return InvestmentZone.ZONE_2;
    }

    return InvestmentZone.ZONE_3;
  }

  private mapAvailableCapital(answer: QuizAnswersDto['q20AvailableCapital']): {
    min: number;
    max: number;
  } {
    switch (answer) {
      case 'Até R$ 150 mil':
        return { min: 0, max: 150_000 };
      case 'R$ 150 mil a R$ 300 mil':
        return { min: 150_000, max: 300_000 };
      case 'R$ 300 mil a R$ 600 mil':
        return { min: 300_000, max: 600_000 };
      case 'R$ 600 mil a R$ 1 milhão':
        return { min: 600_000, max: 1_000_000 };
      case 'Acima de R$ 1 milhão':
      default:
        return { min: 1_000_000, max: 3_000_000 };
    }
  }

  private mapExpectedPayback(
    answer: QuizAnswersDto['q24ExpectedPayback'],
  ): number {
    switch (answer) {
      case 'Até 12 meses':
        return 12;
      case '12 a 24 meses':
        return 24;
      case '24 a 36 meses':
        return 36;
      case 'Acima de 36 meses':
      default:
        return 48;
    }
  }

  private mapDesiredWithdrawal(
    answer: QuizAnswersDto['q23DesiredMonthlyWithdrawal'],
  ): number {
    switch (answer) {
      case 'Até R$ 5 mil':
        return 5_000;
      case 'R$ 5 mil a R$ 10 mil':
        return 10_000;
      case 'R$ 10 mil a R$ 20 mil':
        return 20_000;
      case 'R$ 20 mil a R$ 40 mil':
        return 40_000;
      case 'Acima de R$ 40 mil':
      default:
        return 60_000;
    }
  }

  private calculateSegmentScore(
    answers: QuizAnswersDto,
    franchise: Franchise,
  ): number {
    const selectedSegments = answers.q3PreferredSegments;
    const selectedSubsegments = answers.q4PreferredSubsegments;

    if (!franchise.segment) {
      return 0;
    }

    const dbSegment = franchise.segment;
    const mappedSegments = selectedSegments.flatMap(mapQuizSegmentToDbSegments);
    const segmentMatch = mappedSegments.some(
      (seg) => seg.toLowerCase() === dbSegment.toLowerCase(),
    );

    let segmentScore = 0;

    if (segmentMatch) {
      segmentScore += 30;
    }

    if (franchise.subsegment && selectedSubsegments.length > 0) {
      const subsegmentMatch = selectedSubsegments.some((quizSubsegment) =>
        isSubsegmentMatch(quizSubsegment, franchise.subsegment!),
      );

      if (subsegmentMatch) {
        segmentScore += 10;
      }
    }

    return Math.min(segmentScore, MAX_SEGMENT_SCORE);
  }

  private calculateInvestmentScore(
    userCapitalRange: { min: number; max: number },
    franchise: Franchise,
  ): number {
    const minInv = franchise.minimumInvestment
      ? Number(franchise.minimumInvestment)
      : undefined;
    const maxInv = franchise.maximumInvestment
      ? Number(franchise.maximumInvestment)
      : undefined;

    if (minInv == null || maxInv == null) {
      return Math.round(MAX_INVESTMENT_SCORE * 0.5);
    }

    const overlaps =
      minInv <= userCapitalRange.max && maxInv >= userCapitalRange.min;

    if (overlaps) {
      return MAX_INVESTMENT_SCORE;
    }

    const userMid =
      (userCapitalRange.min + userCapitalRange.max) / 2 || userCapitalRange.max;
    const frMid = (minInv + maxInv) / 2;
    const diff = Math.abs(frMid - userMid);
    const relativeDiff = diff / userMid;

    if (relativeDiff <= INVESTMENT_ZONE_TOLERANCE) {
      return 20;
    }

    if (relativeDiff <= INVESTMENT_ZONE_TOLERANCE * 2) {
      return 10;
    }

    return 0;
  }

  private calculatePaybackScore(
    expectedPaybackMonths: number,
    franchise: Franchise,
  ): number {
    const minRoi = franchise.minimumReturnOnInvestment;

    if (minRoi == null) {
      return NEUTRAL_PAYBACK_SCORE;
    }

    if (minRoi <= expectedPaybackMonths) {
      return MAX_PAYBACK_SCORE;
    }

    const diff = minRoi - expectedPaybackMonths;
    const relativeDiff = diff / expectedPaybackMonths;

    if (relativeDiff <= 0.2) {
      return 10;
    }

    if (relativeDiff <= 0.5) {
      return 5;
    }

    return 0;
  }

  private calculateRevenueScore(
    desiredWithdrawal: number,
    franchise: Franchise,
  ): number {
    const avgRevenue = franchise.averageMonthlyRevenue
      ? Number(franchise.averageMonthlyRevenue)
      : undefined;

    if (avgRevenue == null) {
      return NEUTRAL_REVENUE_SCORE;
    }

    if (avgRevenue >= desiredWithdrawal * 4) {
      return MAX_REVENUE_SCORE;
    }

    if (avgRevenue >= desiredWithdrawal * 2) {
      return 5;
    }

    return 0;
  }

  private calculateNetworkScore(franchise: Franchise): number {
    const units = franchise.totalUnits ?? 0;

    if (units >= 200) {
      return 5;
    }

    if (units >= 50) {
      return 4;
    }

    if (units >= 10) {
      return 3;
    }

    if (units > 0) {
      return 2;
    }

    return NEUTRAL_NETWORK_SCORE;
  }

  scoreFranchise(
    answers: QuizAnswersDto,
    franchise: Franchise,
  ): FranchiseScoreBreakdown {
    const userCapitalRange = this.mapAvailableCapital(
      answers.q20AvailableCapital,
    );
    const expectedPayback = this.mapExpectedPayback(answers.q24ExpectedPayback);
    const desiredWithdrawal = this.mapDesiredWithdrawal(
      answers.q23DesiredMonthlyWithdrawal,
    );

    const minInv = franchise.minimumInvestment
      ? Number(franchise.minimumInvestment)
      : undefined;
    const maxInv = franchise.maximumInvestment
      ? Number(franchise.maximumInvestment)
      : undefined;

    const zone = this.classifyInvestmentZone(
      userCapitalRange.min,
      userCapitalRange.max,
      minInv,
      maxInv,
    );

    const segmentScore = this.calculateSegmentScore(answers, franchise);
    const investmentScore = this.calculateInvestmentScore(
      userCapitalRange,
      franchise,
    );
    const paybackScore = this.calculatePaybackScore(expectedPayback, franchise);
    const revenueScore = this.calculateRevenueScore(
      desiredWithdrawal,
      franchise,
    );
    const networkScore = this.calculateNetworkScore(franchise);

    const filledPillars = [
      segmentScore > 0,
      investmentScore > 0,
      paybackScore !== NEUTRAL_PAYBACK_SCORE,
      revenueScore !== NEUTRAL_REVENUE_SCORE,
      networkScore !== NEUTRAL_NETWORK_SCORE,
    ].filter(Boolean).length;

    const confidence = filledPillars / 5;

    const baseScore =
      segmentScore +
      investmentScore +
      paybackScore +
      revenueScore +
      networkScore;

    let multiplier = 1;
    if (zone === InvestmentZone.ZONE_1) {
      multiplier = INVESTMENT_ZONE_1_MULTIPLIER;
    } else if (zone === InvestmentZone.ZONE_2) {
      multiplier = INVESTMENT_ZONE_2_MULTIPLIER;
    }

    const finalScore = baseScore * multiplier * confidence;

    return {
      segmentScore,
      investmentScore,
      paybackScore,
      revenueScore,
      networkScore,
      zone,
      confidence,
      finalScore,
    };
  }

  filterBySegmentGate(
    answers: QuizAnswersDto,
    franchises: Franchise[],
  ): Franchise[] {
    const excluded = answers.q5ExcludedSegments ?? [];
    const openToAll = excluded.includes(
      'Estou aberto(a) a avaliar todos os segmentos',
    );

    if (openToAll) {
      return franchises;
    }

    const selectedSegments = answers.q3PreferredSegments;

    if (!selectedSegments.length) {
      return franchises;
    }

    return franchises.filter((franchise) => {
      if (!franchise.segment) return false;
      const seg = franchise.segment;

      // Explicitly honor excluded segments (both exact and family matches)
      const isExplicitlyExcluded = excluded
        .flatMap(mapQuizSegmentToDbSegments)
        .some((ex) => ex.toLowerCase() === seg.toLowerCase());
      if (isExplicitlyExcluded) return false;

      const isExcludedByFamily = excluded.some((ex) =>
        isSegmentFamilyMatch(ex, seg),
      );
      if (isExcludedByFamily) return false;

      // Prefer explicit mapped matches first
      const isExplicitlyAllowed = selectedSegments
        .flatMap(mapQuizSegmentToDbSegments)
        .some((allowed) => allowed.toLowerCase() === seg.toLowerCase());
      if (isExplicitlyAllowed) return true;

      // Fallback: family-based match for segments with naming variations
      return selectedSegments.some((pref) => isSegmentFamilyMatch(pref, seg));
    });
  }

  /**
   * Applies the \"limitador de topo\" rules from the PRD.
   */
  enforceTopLimiters(scored: ScoredFranchise[]): {
    top: ScoredFranchise[];
    others: ScoredFranchise[];
  } {
    const sorted = [...scored].sort(
      (a, b) => b.score.finalScore - a.score.finalScore,
    );

    const withRequiredInvestmentAndSegment = (franchise: ScoredFranchise) =>
      franchise.segment &&
      franchise.minimumInvestment != null &&
      franchise.maximumInvestment != null;

    const topEligible = sorted.filter(withRequiredInvestmentAndSegment);

    const topTen = topEligible.slice(0, 10);
    const remaining = sorted.filter((f) => !topTen.includes(f));

    return {
      top: topTen,
      others: remaining,
    };
  }
}
