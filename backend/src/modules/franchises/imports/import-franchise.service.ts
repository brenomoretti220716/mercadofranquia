import { Injectable, Logger } from '@nestjs/common';
import { FranchiseService } from '../franchise.service';
import {
  CreateFranchiseType,
  ImportResultType,
} from '../schemas/create-franchise.schema';
import { UpdateFranchiseType } from '../schemas/update-franchise.schema';
import { CsvParserService } from './csv-parser.service';
import { translateCsvRecords } from './franchise-csv-translator';
import { FranchisePersistenceService } from './franchise-persistence.service';
import { FranchiseValidatorService } from './franchise-validator.service';
import { ImageProcessorService } from './image-processor.service';

@Injectable()
export class FranchiseImportService {
  private readonly logger = new Logger(FranchiseImportService.name);

  constructor(
    private readonly csvParser: CsvParserService,
    private readonly validator: FranchiseValidatorService,
    private readonly imageProcessor: ImageProcessorService,
    private readonly persistence: FranchisePersistenceService,
    private readonly franchiseService: FranchiseService,
  ) {}

  // Import de franquias
  async importFromCSV(csvContent: string): Promise<ImportResultType> {
    this.logger.log('Starting CSV import process');

    try {
      // 1. Parse CSV para array de objetos
      const rawRecords = this.csvParser.parseCSV(csvContent);
      const translatedRecords = translateCsvRecords(rawRecords);

      // 2. Validar e transformar cada record
      const { validRecords, errors } =
        this.validator.validateCreateRecords(translatedRecords);

      if (validRecords.length === 0) {
        return {
          total: rawRecords.length,
          success: 0,
          failed: errors.length,
          errors,
        };
      }

      // 3. Processar URLs de imagens
      const { processedRecords, downloadErrors } =
        await this.imageProcessor.processImageUrls<CreateFranchiseType>(
          validRecords,
          'franchises',
        );

      // 4. Salvar records válidos no banco
      const saveResults = await this.persistence.saveRecords(processedRecords);

      // 5. Compilar resultado final (incluindo erros de download)
      const allErrors = [
        ...errors,
        ...saveResults.errors,
        ...downloadErrors.map((err) => ({
          row: err.recordIndex + 1,
          data: { field: err.field, url: err.url },
          error: `Download error for ${err.field}: ${err.error}`,
        })),
      ];

      const result: ImportResultType = {
        total: rawRecords.length,
        success: saveResults.success,
        failed: allErrors.length,
        errors: allErrors,
      };

      this.logger.log(
        `Import completed: ${result.success}/${result.total} successful, ${downloadErrors.length} download errors`,
      );
      return result;
    } catch (error) {
      this.logger.error('CSV import failed', error);
      throw new Error(`Import failed: ${(error as Error).message}`);
    }
  }

  async updateFromCSV(
    franchiseId: string,
    csvContent: string,
  ): Promise<ImportResultType> {
    this.logger.log(
      `Starting CSV update process for franchise ID: ${franchiseId}`,
    );

    try {
      this.logger.log(`CSV content length: ${csvContent.length}`);

      // 1. Parse CSV para array de objetos
      this.logger.log('Step 1: Parsing CSV content...');
      const rawRecords = this.csvParser.parseCSV(csvContent);
      const translatedRecords = translateCsvRecords(rawRecords);
      this.logger.log(`Parsed ${rawRecords.length} raw records`);

      // 2. Validar que há apenas uma linha de dados
      if (rawRecords.length === 0) {
        this.logger.error('CSV file is empty or has no data rows');
        throw new Error('CSV file is empty or has no data rows');
      }

      if (rawRecords.length > 1) {
        this.logger.error(`Too many rows found: ${rawRecords.length}`);
        throw new Error(
          `CSV update only supports single row updates. Found ${rawRecords.length} rows. Please provide only one row with update data.`,
        );
      }

      this.logger.log('Step 2: Row count validation passed');

      // 3. Validar e transformar o record
      this.logger.log('Step 3: Validating records...');
      const { validRecords, errors } =
        this.validator.validateUpdateRecords(translatedRecords);

      this.logger.log(
        `Validation result: ${validRecords.length} valid, ${errors.length} errors`,
      );

      if (errors.length > 0) {
        this.logger.error(
          'Validation errors:',
          JSON.stringify(errors, null, 2),
        );
      }

      if (validRecords.length === 0) {
        this.logger.error('No valid records after validation');
        return {
          total: rawRecords.length,
          success: 0,
          failed: errors.length,
          errors,
        };
      }

      // 4. Processar URLs de imagens
      this.logger.log('Step 4: Processing image URLs...');
      const { processedRecords, downloadErrors } =
        await this.imageProcessor.processImageUrls<UpdateFranchiseType>(
          validRecords,
          'franchises',
        );

      this.logger.log(
        `Image processing result: ${processedRecords.length} processed, ${downloadErrors.length} download errors`,
      );

      // 5. Atualizar record válido no banco
      this.logger.log('Step 5: Updating record in database...');
      const updateResults = await this.updateSingleRecord(
        franchiseId,
        processedRecords[0],
      );

      this.logger.log(
        `Update result: ${updateResults.success} success, ${updateResults.errors.length} errors`,
      );

      // 6. Compilar resultado final (incluindo erros de download)
      const allErrors = [
        ...errors,
        ...updateResults.errors,
        ...downloadErrors.map((err) => ({
          row: err.recordIndex + 1,
          data: { field: err.field, url: err.url },
          error: `Download error for ${err.field}: ${err.error}`,
        })),
      ];

      const result: ImportResultType = {
        total: rawRecords.length,
        success: updateResults.success,
        failed: allErrors.length,
        errors: allErrors,
      };

      this.logger.log(
        `Update completed: ${result.success}/${result.total} successful for franchise ${franchiseId}, ${downloadErrors.length} download errors`,
      );

      this.logger.log('Final result:', JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      this.logger.error('CSV update failed with error:', error);
      this.logger.error('Error stack:', (error as Error).stack);
      throw new Error(`Update failed: ${(error as Error).message}`);
    }
  }

  // Atualizar record único
  private async updateSingleRecord(
    franchiseId: string,
    record: UpdateFranchiseType,
  ): Promise<{ success: number; errors: ImportResultType['errors'] }> {
    try {
      this.logger.log(
        `Attempting to update franchise ${franchiseId} with data:`,
        JSON.stringify(record, null, 2),
      );

      await this.persistence.updateSingleRecord(franchiseId, record);

      this.logger.log(`Successfully updated franchise ${franchiseId}`);

      return {
        success: 1,
        errors: [],
      };
    } catch (error) {
      this.logger.error(`Failed to update franchise ${franchiseId}:`, error);

      return {
        success: 0,
        errors: [
          {
            row: 1,
            data: record,
            error: `Database error: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  async updateFromScraping(csvContent: string): Promise<ImportResultType> {
    this.logger.log('Starting CSV scraping update process');

    try {
      // 1. Parse CSV para array de objetos
      const rawRecords = this.csvParser.parseCSV(csvContent);
      const translatedRecords = translateCsvRecords(rawRecords);
      this.logger.log(`Parsed ${rawRecords.length} raw records from scraping`);

      // 2. Validar e transformar cada record
      const { validRecords, errors } =
        this.validator.validateUpdateRecords(translatedRecords);

      this.logger.log(
        `Validation result: ${validRecords.length} valid, ${errors.length} errors`,
      );

      if (validRecords.length === 0) {
        return {
          total: rawRecords.length,
          success: 0,
          failed: errors.length,
          errors,
        };
      }

      // 3. Processar URLs de imagens
      const { processedRecords, downloadErrors } =
        await this.imageProcessor.processImageUrls<UpdateFranchiseType>(
          validRecords,
          'franchises',
        );

      this.logger.log(
        `Image processing result: ${processedRecords.length} processed, ${downloadErrors.length} download errors`,
      );

      // 4. Atualizar records válidos no banco usando scrapedWebsite como identificador
      const updateResults =
        await this.updateMultipleRecordsByScrapedWebsite(processedRecords);

      this.logger.log(
        `Update result: ${updateResults.success} success, ${updateResults.errors.length} errors`,
      );

      // 5. Compilar resultado final (incluindo erros de download)
      const allErrors = [
        ...errors,
        ...updateResults.errors,
        ...downloadErrors.map((err) => ({
          row: err.recordIndex + 1,
          data: { field: err.field, url: err.url },
          error: `Download error for ${err.field}: ${err.error}`,
        })),
      ];

      const result: ImportResultType = {
        total: rawRecords.length,
        success: updateResults.success,
        failed: allErrors.length,
        errors: allErrors,
      };

      this.logger.log(
        `Scraping update completed: ${result.success}/${result.total} successful, ${downloadErrors.length} download errors`,
      );

      return result;
    } catch (error) {
      this.logger.error('CSV scraping update failed', error);
      throw new Error(`Scraping update failed: ${(error as Error).message}`);
    }
  }

  // Atualizar múltiplos records usando scrapedWebsite como identificador
  private async updateMultipleRecordsByScrapedWebsite(
    records: UpdateFranchiseType[],
  ): Promise<{ success: number; errors: ImportResultType['errors'] }> {
    let success = 0;
    const errors: ImportResultType['errors'] = [];

    for (const [index, record] of records.entries()) {
      try {
        // Verificar se o record tem scrapedWebsite
        if (!record.scrapedWebsite) {
          errors.push({
            row: index + 1,
            data: record,
            error:
              'scrapedWebsite is required to identify franchise for update',
          });
          continue;
        }

        this.logger.log(
          `Attempting to update franchise with scrapedWebsite: ${record.scrapedWebsite}`,
        );

        await this.persistence.updateRecordByScrapedWebsite(
          record.scrapedWebsite,
          record,
        );

        success++;
        this.logger.log(
          `Successfully updated franchise with scrapedWebsite: ${record.scrapedWebsite}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to update franchise with scrapedWebsite ${record.scrapedWebsite}:`,
          error,
        );

        errors.push({
          row: index + 1,
          data: record,
          error: `Update error: ${(error as Error).message}`,
        });
      }
    }

    return { success, errors };
  }
}
