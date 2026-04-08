import { Module } from '@nestjs/common';
import { GuardsModule } from '../auth/guards/guards.module';
import { PrismaModule } from '../database/prisma.module';
import { AbfSegmentsController } from './abf-segments.controller';
import { AbfSegmentsService } from './abf-segments.service';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [AbfSegmentsController],
  providers: [AbfSegmentsService],
  exports: [AbfSegmentsService],
})
export class AbfSegmentsModule {}
