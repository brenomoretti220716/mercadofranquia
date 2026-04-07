import { Injectable, Logger } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  baseCreateFranchiseSchema,
  CreateFranchiseType,
  ImportResultType,
} from '../schemas/create-franchise.schema';
import {
  baseUpdateFranchiseSchema,
  UpdateFranchiseType,
} from '../schemas/update-franchise.schema';

@Injectable()
export class FranchiseValidatorService {
  private readonly logger = new Logger(FranchiseValidatorService.name);

  validateCreateRecords(rawRecords: Record<string, unknown>[]) {
    const validRecords: CreateFranchiseType[] = [];
    const errors: ImportResultType['errors'] = [];

    for (const [index, record] of rawRecords.entries()) {
      try {
        const validatedRecord = baseCreateFranchiseSchema.parse(record);
        validRecords.push(validatedRecord);
      } catch (error) {
        this.handleValidationError(error, index, record, errors);
      }
    }

    return { validRecords, errors };
  }

  validateUpdateRecords(rawRecords: Record<string, unknown>[]) {
    const validRecords: UpdateFranchiseType[] = [];
    const errors: ImportResultType['errors'] = [];
    this.logger.log(`Validating ${rawRecords.length} update records`);

    for (const [index, record] of rawRecords.entries()) {
      try {
        this.logger.debug(
          `Raw record ${index + 1}:`,
          JSON.stringify(record, null, 2),
        );

        if (Object.keys(record).length === 0) {
          throw new Error('At least one field must be provided for update');
        }

        const validatedRecord = baseUpdateFranchiseSchema.parse(record);
        validRecords.push(validatedRecord);
        this.logger.debug(
          `Validated record ${index + 1}:`,
          JSON.stringify(validatedRecord, null, 2),
        );
      } catch (error) {
        this.logger.error(
          `Error validating update record ${index + 1}:`,
          error,
        );
        this.handleValidationError(error, index, record, errors);
      }
    }

    return { validRecords, errors };
  }

  private handleValidationError(
    error: unknown,
    index: number,
    record: Record<string, unknown>,
    errors: ImportResultType['errors'],
  ) {
    if (error instanceof ZodError) {
      errors.push({
        row: index + 1,
        data: record,
        error: error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      });
    } else {
      errors.push({
        row: index + 1,
        data: record,
        error: (error as Error).message,
      });
    }
  }
}
