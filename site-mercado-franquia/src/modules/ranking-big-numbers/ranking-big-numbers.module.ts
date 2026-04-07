import { Module } from '@nestjs/common';
import { GuardsModule } from '../auth/guards/guards.module';
import { PrismaModule } from '../database/prisma.module';
import { RankingBigNumbersController } from './ranking-big-numbers.controller';
import { RankingBigNumbersService } from './ranking-big-numbers.service';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [RankingBigNumbersController],
  providers: [RankingBigNumbersService],
  exports: [RankingBigNumbersService],
})
export class RankingBigNumbersModule {}
