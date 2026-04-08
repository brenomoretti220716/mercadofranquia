import { Module } from '@nestjs/common';
import { GuardsModule } from '../auth/guards/guards.module';
import { PrismaModule } from '../database/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';
import { NewsCommentController } from './comments/news-comment.controller';
import { NewsCommentService } from './comments/news-comment.service';
import { NewsController } from './controllers/news.controller';
import { NewsService } from './services/news.service';

@Module({
  imports: [GuardsModule, UploadModule, PrismaModule, UsersModule],
  controllers: [NewsController, NewsCommentController],
  providers: [NewsService, NewsCommentService],
  exports: [NewsService, NewsCommentService],
})
export class NewsModule {}
