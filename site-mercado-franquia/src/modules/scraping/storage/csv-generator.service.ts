import { Injectable, Logger } from '@nestjs/common';
import { Stringifier, stringify } from 'csv-stringify';
import * as fs from 'fs';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { FranchiseData } from '../schemas/franchise-schema';
export interface CsvWriteOptions {
  batchSize?: number;
  outputDir?: string;
  filename?: string;
}

type ScrapedFranchiseData = FranchiseData;

@Injectable()
export class CsvGeneratorService {
  private readonly logger = new Logger(CsvGeneratorService.name);
  private readonly DEFAULT_BATCH_SIZE = 100;

  private csvStringifier: Stringifier | null = null;
  private writeStream: fs.WriteStream | null = null;
  private totalProcessed = 0;

  async generateCsvFromScrapedData(
    data: ScrapedFranchiseData[],
    actionType: 'create' | 'update',
    options: CsvWriteOptions = {},
  ): Promise<string> {
    const config = {
      batchSize: options.batchSize || this.DEFAULT_BATCH_SIZE,
      outputDir: options.outputDir || join(process.cwd(), 'data', 'exports'),
      filename: options.filename || `scraped-franchises-${actionType}.csv`,
    };

    this.logger.log(
      `🚀 Iniciando CSV ${actionType.toUpperCase()}: ${data.length} registros, lotes de ${config.batchSize}`,
    );

    try {
      // 1. Preparar diretório
      await mkdir(config.outputDir, { recursive: true });

      // 2. Gerar arquivo
      const filePath = await this.generateSingleFile(
        data,
        config.outputDir,
        config.filename,
        config.batchSize,
      );

      return filePath;
    } catch (error) {
      this.logger.error('❌ Erro no CSV:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * 📄 Gera um único arquivo CSV
   */
  private async generateSingleFile(
    data: ScrapedFranchiseData[],
    outputDir: string,
    filename: string,
    batchSize: number,
  ): Promise<string> {
    const filePath = join(outputDir, filename);

    // Inicializar streams
    await this.initializeStreams(filePath);

    // Processar em batches
    const mappedData = data.map((item) => this.mapToFranchiseSchema(item));
    await this.processBatches(mappedData, batchSize);

    // Finalizar
    await this.finalizeStreams();

    this.logger.log(
      `✅ Arquivo criado: ${filename} (${this.totalProcessed} registros)`,
    );
    return filePath;
  }

  /**
   * 🔧 Inicializa os streams (CSV + File)
   */
  private async initializeStreams(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.writeStream = fs.createWriteStream(filePath, { flags: 'w' });

        this.csvStringifier = stringify({
          header: true,
          columns: this.getCsvColumns(),
          delimiter: ',',
          quoted_string: false,
        });

        // Conectar stream
        this.csvStringifier.pipe(this.writeStream);

        this.writeStream.on('error', reject);
        this.writeStream.on('ready', () => {
          this.totalProcessed = 0;
          resolve();
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private cleanerForCsv(value: string | undefined | null): string {
    if (!value) return '';

    return value
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private mapToFranchiseSchema(
    data: ScrapedFranchiseData,
  ): Record<string, any> {
    const initialFields = {
      name: this.cleanerForCsv(data.name),
      headquarter: this.cleanerForCsv(data.headquarter),
      storeArea: this.cleanerForCsv(data.storeArea?.toString()),
      totalUnits: data.totalUnits?.toString() || '',
      description: this.cleanerForCsv(data.description),
    };

    const mediaFields = {
      logoUrl: this.cleanerForCsv(data.logoUrl),
      videoUrl: this.cleanerForCsv(data.videoUrl),
      thumbnailUrl: this.cleanerForCsv(data.thumbnailUrl),
      galleryUrls: this.cleanerForCsv(data.galleryUrls),
    };

    const investmentFields = {
      minimumInvestment: this.cleanerForCsv(data.minimumInvestment?.toString()),
      maximumInvestment: this.cleanerForCsv(data.maximumInvestment?.toString()),
      setupCapital: this.cleanerForCsv(data.setupCapital?.toString()),
      workingCapital: this.cleanerForCsv(data.workingCapital?.toString()),
    };

    const revenueFields = {
      averageMonthlyRevenue: this.cleanerForCsv(
        data.averageMonthlyRevenue?.toString(),
      ),
      minimumReturnOnInvestment: this.cleanerForCsv(
        data.minimumReturnOnInvestment?.toString(),
      ),
      maximumReturnOnInvestment: this.cleanerForCsv(
        data.maximumReturnOnInvestment?.toString(),
      ),
    };

    const taxFields = {
      royalties: this.cleanerForCsv(data.royalties?.toString()),
      calculationBaseRoyaltie: this.cleanerForCsv(
        data.calculationBaseRoyaltie?.toString(),
      ),
      franchiseFee: this.cleanerForCsv(data.franchiseFee?.toString()),
      advertisingFee: this.cleanerForCsv(data.advertisingFee?.toString()),
      calculationBaseAdFee: this.cleanerForCsv(
        data.calculationBaseAdFee?.toString(),
      ),
    };

    const contactFields = {
      email: this.cleanerForCsv(data.email),
      phone: this.cleanerForCsv(data.phone),
      website: this.cleanerForCsv(data.website),
    };

    const metadataFields = {
      scrapedWebsite: this.cleanerForCsv(data.scrapedWebsite),
      lastScrapedAt:
        data.lastScrapedAt?.toISOString() || new Date().toISOString(),
    };

    const aiFields = {
      businessType: this.cleanerForCsv(data.businessType),
      segment: this.cleanerForCsv(data.segment),
      subsegment: this.cleanerForCsv(data.subsegment),
      brandFoundationYear: this.cleanerForCsv(data.brandFoundationYear),
      franchiseStartYear: this.cleanerForCsv(data.franchiseStartYear),
      abfSince: this.cleanerForCsv(data.abfSince),
      isAbfAssociated: this.cleanerForCsv(
        data.isAbfAssociated ? 'true' : 'false',
      ),
    };

    return {
      ...initialFields,
      ...mediaFields,
      ...investmentFields,
      ...revenueFields,
      ...taxFields,
      ...contactFields,
      ...metadataFields,
      ...aiFields,
    };
  }
  /**
   * 🔄 Processa dados em lotes (otimização de memória)
   */
  private async processBatches(
    data: Record<string, any>[],
    batchSize: number,
  ): Promise<void> {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await this.processBatch(batch);

      this.logger.debug(
        `📦 Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} processado`,
      );
    }
  }

  private async processBatch(batch: Record<string, any>[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.csvStringifier) {
        reject(new Error('CSV stringifier não inicializado'));
        return;
      }

      let processed = 0;

      const onData = () => {
        processed++;
        if (processed === batch.length) {
          this.totalProcessed += batch.length;
          resolve();
        }
      };

      // Listeners temporários
      this.csvStringifier.on('data', onData);
      this.csvStringifier.on('error', reject);

      // Escrever lote
      batch.forEach((record) => {
        this.csvStringifier!.write(record);
      });

      // Cleanup listeners
      setTimeout(() => {
        this.csvStringifier?.removeListener('data', onData);
        this.csvStringifier?.removeListener('error', reject);
      }, 100);
    });
  }

  private async finalizeStreams(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.csvStringifier || !this.writeStream) {
        resolve();
        return;
      }

      this.writeStream.on('finish', resolve);
      this.writeStream.on('error', reject);

      this.csvStringifier.end();
    });
  }

  private cleanup(): void {
    try {
      this.csvStringifier?.destroy();
      this.writeStream?.destroy();
    } catch (error) {
      this.logger.warn('Erro na limpeza:', error);
    } finally {
      this.csvStringifier = null;
      this.writeStream = null;
      this.totalProcessed = 0;
    }
  }

  private getCsvColumns(): string[] {
    return [
      'name',
      'description',
      'businessType',
      'segment',
      'subsegment',
      'minimumInvestment',
      'totalInvestment',
      'setupCapital',
      'workingCapital',
      'storeArea',
      'totalUnits',
      'totalUnitsInBrazil',
      'brandFoundationYear',
      'franchiseStartYear',
      'abfSince',
      'isAbfAssociated',
      'headquarterState',
      'headquarter',
      'averageMonthlyRevenue',
      'returnOnInvestment',
      'royalties',
      'calculationBaseRoyaltie',
      'franchiseFee',
      'advertisingFee',
      'calculationBaseAdFee',
      'logoUrl',
      'thumbnailUrl',
      'galleryUrls',
      'videoUrl',
      'phone',
      'email',
      'website',
      'rankingPosition',
      'lastScrapedAt',
      'scrapedWebsite',
    ];
  }

  async deleteDirectory(path: string) {
    await rm(path, { recursive: true, force: true });
  }
}
