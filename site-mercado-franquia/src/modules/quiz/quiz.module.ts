import { Module } from '@nestjs/common';
import { GuardsModule } from '../auth/guards/guards.module';
import { PrismaModule } from '../database/prisma.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizScoringService } from './scoring/quiz-scoring.service';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [QuizController],
  providers: [QuizService, QuizScoringService],
  exports: [QuizService],
})
export class QuizModule {}

