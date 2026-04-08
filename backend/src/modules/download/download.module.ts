import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../database/prisma.module';
// import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}
