import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { JwtPayload } from 'src/modules/auth/jwt.service';
import {
  QuizProfileSummaryResponseDto,
  QuizResultsResponseDto,
  QuizSubmissionResponseDto,
} from './dto/quiz.swagger.dto';
import { QuizService } from './quiz.service';
import {
  QuizAnswersDto,
  quizAnswersSchema,
} from './schemas/create-quiz.schema';

@ApiTags('quiz')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @ApiOperation({ summary: 'Obter o quiz do usuário atual' })
  @ApiResponse({
    status: 200,
    description: 'Quiz encontrado ou null',
    type: QuizSubmissionResponseDto,
  })
  async getMyQuiz(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<QuizSubmissionResponseDto | null> {
    const submission = await this.quizService.getUserSubmission(currentUser.id);

    if (!submission) {
      return null;
    }

    return {
      id: submission.id,
      userId: submission.userId,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Responder ou atualizar o quiz' })
  @ApiResponse({
    status: 201,
    description: 'Quiz salvo com sucesso',
    type: QuizSubmissionResponseDto,
  })
  async submitQuiz(
    @Body(new ZodValidationPipe(quizAnswersSchema)) data: QuizAnswersDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<QuizSubmissionResponseDto> {
    const submission = await this.quizService.saveSubmission(
      currentUser.id,
      data,
    );

    return {
      id: submission.id,
      userId: submission.userId,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar respostas do quiz (refazer)' })
  @ApiResponse({
    status: 200,
    description: 'Quiz atualizado com sucesso',
    type: QuizSubmissionResponseDto,
  })
  async updateQuiz(
    @Body(new ZodValidationPipe(quizAnswersSchema)) data: QuizAnswersDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<QuizSubmissionResponseDto> {
    const submission = await this.quizService.saveSubmission(
      currentUser.id,
      data,
    );

    return {
      id: submission.id,
      userId: submission.userId,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  @Get('results')
  @ApiOperation({ summary: 'Obter franquias ranqueadas pelo quiz do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Resultados do quiz',
    type: QuizResultsResponseDto,
  })
  async getResults(
    @CurrentUser() currentUser: JwtPayload,
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize: number,
  ): Promise<QuizResultsResponseDto> {
    const result = await this.quizService.getResults(
      currentUser.id,
      Number(page),
      Number(pageSize),
    );

    return {
      hasSubmission: result.hasSubmission,
      blocks: result.blocks.map((block) => ({
        label: block.label,
        zone: block.zone,
        pagination: block.pagination,
        franchises: block.franchises
          // ensure we only expose franchises that already have a slug
          .filter((franchise) => franchise.slug)
          .map((franchise) => ({
            id: franchise.id,
            slug: franchise.slug as string,
            name: franchise.name,
            segment: franchise.segment,
            subsegment: franchise.subsegment,
            minimumInvestment: franchise.minimumInvestment
              ? Number(franchise.minimumInvestment)
              : null,
            maximumInvestment: franchise.maximumInvestment
              ? Number(franchise.maximumInvestment)
              : null,
            averageMonthlyRevenue: franchise.averageMonthlyRevenue
              ? Number(franchise.averageMonthlyRevenue)
              : null,
            totalUnits:
              franchise.totalUnits !== null ? franchise.totalUnits : null,
            logoUrl: franchise.logoUrl,
            score: {
              segmentScore: franchise.score.segmentScore,
              investmentScore: franchise.score.investmentScore,
              paybackScore: franchise.score.paybackScore,
              revenueScore: franchise.score.revenueScore,
              networkScore: franchise.score.networkScore,
              zone: franchise.score.zone,
              confidence: franchise.score.confidence,
              finalScore: franchise.score.finalScore,
            },
          })),
      })),
    };
  }

  @Get('profile')
  @ApiOperation({
    summary:
      'Obter resumo das principais respostas do quiz que impactam os resultados',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo do perfil do quiz',
    type: QuizProfileSummaryResponseDto,
  })
  async getProfileSummary(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<QuizProfileSummaryResponseDto> {
    const summary = await this.quizService.getProfileSummary(currentUser.id);

    return {
      answers: summary.answers.map((answer) => ({
        key: answer.key,
        label: answer.label,
        value: answer.value,
      })),
    };
  }
}
