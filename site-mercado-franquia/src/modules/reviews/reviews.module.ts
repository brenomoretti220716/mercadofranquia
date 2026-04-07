import { Module } from '@nestjs/common';
import { GuardsModule } from '../auth/guards/guards.module';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { StatisticsModule } from '../statistics/statistics.module';
import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';
import { ReviewResponseController } from './review-response/review-response.controller';
import { ReviewResponseService } from './review-response/review-response.service';
import { ReviewController } from './reviews.controller';
import { ReviewService } from './reviews.service';

@Module({
  imports: [GuardsModule, UploadModule, PrismaModule, UsersModule, StatisticsModule],
  controllers: [ReviewController, ReviewResponseController],
  providers: [ReviewService, ReviewResponseService, PrismaService],
  exports: [ReviewService, ReviewResponseService],
})
export class ReviewsModule {}
