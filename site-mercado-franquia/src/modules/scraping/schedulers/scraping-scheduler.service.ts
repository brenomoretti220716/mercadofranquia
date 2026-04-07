import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScrapingService } from '../scraping.service';

@Injectable()
export class ScrapingSchedulerService {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleCron() {
    if (process.env.PUBLIC_ENVIRONMENT === 'development') {
      return;
    }

    await this.scrapingService.processDetectedPages();
  }
}
