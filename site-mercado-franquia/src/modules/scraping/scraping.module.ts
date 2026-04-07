import { Module } from '@nestjs/common';
import { GuardsModule } from '../auth/guards/guards.module';
import { PrismaModule } from '../database/prisma.module';
import { FranchisesModule } from '../franchises/franchises.module';
import { BrowserPoolService } from './browser/browser-pool.service';
import { LlmService } from './llm-models/groq.service';
import { ModelRotator } from './llm-models/rotator.service';
import { ScrapingSchedulerService } from './schedulers/scraping-scheduler.service';
import { FranchiseNewScraper } from './scrapers/franchise-new.scraper.service';
import { FranchiseOldScraper } from './scrapers/franchise-old.scraper.service';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { SitemapParserService } from './sitemap/sitemap-parser.service';
import { SitemapReaderService } from './sitemap/sitemap-reader.service';
import { CsvGeneratorService } from './storage/csv-generator.service';

@Module({
  controllers: [ScrapingController],
  providers: [
    BrowserPoolService,
    SitemapReaderService,
    SitemapParserService,
    LlmService,
    ModelRotator,
    ScrapingService,
    ScrapingSchedulerService,
    FranchiseOldScraper,
    FranchiseNewScraper,
    CsvGeneratorService,
  ],
  exports: [ScrapingService],
  imports: [PrismaModule, FranchisesModule, GuardsModule],
})
export class ScrapingModule {}
