import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

@Injectable()
export class CsvParserService {
  parseCSV(csvContent: string): Record<string, unknown>[] {
    try {
      return parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ',',
      }) as Record<string, unknown>[];
    } catch (error) {
      throw new Error(`Failed to parse CSV: ${(error as Error).message}`);
    }
  }
}
