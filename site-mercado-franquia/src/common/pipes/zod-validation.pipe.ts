import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform<T>(value: unknown): T {
    try {
      // Handle null/undefined by defaulting to empty object for multipart/form-data
      const valueToValidate =
        value === null || value === undefined ? {} : value;

      // Debug logging for multipart/form-data issues
      if (
        value === null ||
        value === undefined ||
        (typeof value === 'object' && Object.keys(value).length === 0)
      ) {
        console.log('=== ZOD VALIDATION PIPE DEBUG ===');
        console.log('Original value:', value);
        console.log('Value to validate:', valueToValidate);
        console.log('Value type:', typeof value);
        console.log('Value is null:', value === null);
        console.log('Value is undefined:', value === undefined);
        console.log(
          'Value keys:',
          typeof value === 'object' ? Object.keys(value || {}) : 'N/A',
        );
        console.log('================================');
      }

      // Use a generic type parameter to properly type the return value
      return this.schema.parse(valueToValidate) as T;
    } catch (error) {
      console.log('Zod validation error:', error); // Debug log
      console.log('Value that failed validation:', value);

      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      // Handle other types of errors
      throw new BadRequestException({
        message: 'Validation failed',
        error: 'Unknown validation error',
      });
    }
  }
}
