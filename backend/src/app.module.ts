import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AbfSegmentsModule } from './modules/abf-segments/abf-segments.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from './modules/cache/cache.module';
import { PrismaModule } from './modules/database/prisma.module';
import { EmailModule } from './modules/email/email.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { FranchisesModule } from './modules/franchises/franchises.module';
import { NewsModule } from './modules/news/news.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { RankingBigNumbersModule } from './modules/ranking-big-numbers/ranking-big-numbers.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    CacheModule,
    UsersModule,
    PrismaModule,
    AuthModule,
    EmailModule,
    NewsModule,
    UploadModule,
    FranchisesModule,
    FavoritesModule,
    QuizModule,
    RankingBigNumbersModule,
    ReviewsModule,
    SegmentsModule,
    ScrapingModule,
    StatisticsModule,
    NotificationsModule,
    AbfSegmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
