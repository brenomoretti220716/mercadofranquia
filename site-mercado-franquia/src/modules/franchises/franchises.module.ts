import { Module } from '@nestjs/common';
import { GuardsModule } from '../auth/guards/guards.module';
import { PrismaModule } from '../database/prisma.module';
import { DownloadModule } from '../download/download.module';
import { EmailModule } from '../email/email.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { UploadModule } from '../upload/upload.module';
import { FranchiseController } from './franchise.controller';
import { FranchiseMonthlyUnitsService } from './franchise-monthly-units.service';
import { FranchiseService } from './franchise.service';
import { CsvParserService } from './imports/csv-parser.service';
import { FranchisePersistenceService } from './imports/franchise-persistence.service';
import { FranchiseValidatorService } from './imports/franchise-validator.service';
import { ImageProcessorService } from './imports/image-processor.service';
import { FranchiseImportController } from './imports/import-franchise.controller';
import { FranchiseImportService } from './imports/import-franchise.service';
import { FranchiseMonthlyUnitsSchedulerService } from './schedulers/franchise-monthly-units-scheduler.service';
import { BusinessModelController } from './business-models/business-model.controller';
import { BusinessModelService } from './business-models/business-model.service';

@Module({
  exports: [FranchiseImportService, FranchiseMonthlyUnitsService],
  imports: [
    GuardsModule,
    UploadModule,
    PrismaModule,
    EmailModule,
    UploadModule,
    DownloadModule,
    StatisticsModule,
  ],
  controllers: [
    FranchiseController,
    FranchiseImportController,
    BusinessModelController,
  ],
  providers: [
    FranchiseImportService,
    FranchiseService,
    FranchiseMonthlyUnitsService,
    FranchiseMonthlyUnitsSchedulerService,
    CsvParserService,
    FranchisePersistenceService,
    ImageProcessorService,
    FranchiseValidatorService,
    BusinessModelService,
  ],
})
export class FranchisesModule {}
