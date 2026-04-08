import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FranchiseMonthlyUnitsService } from '../franchise-monthly-units.service';

@Injectable()
export class FranchiseMonthlyUnitsSchedulerService {
  private readonly logger = new Logger(
    FranchiseMonthlyUnitsSchedulerService.name,
  );

  constructor(
    private readonly franchiseMonthlyUnitsService: FranchiseMonthlyUnitsService,
  ) {}

  @Cron('0 0 5 1 * *')
  async handleMonthlyUnitsUpdate() {
    this.logger.log('Monthly units update scheduler triggered');

    try {
      const result =
        await this.franchiseMonthlyUnitsService.processMonthlyUnitsUpdate();

      this.logger.log(
        `Monthly units update completed successfully: ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error('Error in monthly units update scheduler:', error);
    }
  }
}
