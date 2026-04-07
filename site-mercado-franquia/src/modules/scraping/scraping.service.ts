import { Injectable, Logger } from '@nestjs/common';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../database/prisma.service';
import { FranchiseImportService } from '../franchises/imports/import-franchise.service';
import { ImportResultType } from '../franchises/schemas/create-franchise.schema';
import { FranchiseData } from './schemas/franchise-schema';
import { FranchiseNewScraper } from './scrapers/franchise-new.scraper.service';
import { FranchiseOldScraper } from './scrapers/franchise-old.scraper.service';
import { SitemapParserService } from './sitemap/sitemap-parser.service';
import { SitemapReaderService } from './sitemap/sitemap-reader.service';
import { CsvGeneratorService } from './storage/csv-generator.service';

export interface FranchisePage {
  url: string;
  lastmod: string;
  action: 'create' | 'update';
  pageType: 'franchise-new' | 'franchise-old';
  franchiseName?: string;
  hasModal?: boolean;
  hasInvestmentInfo?: boolean;
  hasDetailedTabs?: boolean;
  finalUrl?: string;
  redirected?: boolean;
}

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    private readonly sitemapReader: SitemapReaderService,
    private readonly sitemapParser: SitemapParserService,
    private readonly franchiseOldScraper: FranchiseOldScraper,
    private readonly franchiseNewScraper: FranchiseNewScraper,
    private readonly csvGenerator: CsvGeneratorService,
    private readonly importService: FranchiseImportService,
    private readonly prisma: PrismaService,
  ) {}

  private ensureScrapingEnabled(): void {
    if (process.env.PUBLIC_ENVIRONMENT === 'development') {
      this.logger.warn(
        'Scraping attempt blocked because PUBLIC_ENVIRONMENT is set to development',
      );
      throw new Error('Scraping is currently disabled by configuration');
    }
  }

  async sitemapStart() {
    this.ensureScrapingEnabled();

    const sitemapUrls = [
      'https://www.portaldofranchising.com.br/post-sitemap.xml',
      'https://www.portaldofranchising.com.br/post-sitemap2.xml',
    ];

    await this.sitemapReader.readMultipleSitemaps(sitemapUrls);
    await this.sitemapParser.parseSitemap();
  }

  async processDetectedPages(): Promise<void> {
    this.ensureScrapingEnabled();

    this.logger.log('Iniciando processamento de sitemaps...');

    await this.sitemapStart();

    this.logger.log('Iniciando processamento das páginas detectadas...');

    try {
      const filePath = join(
        process.cwd(),
        'data',
        'sitemaps',
        'franchise-analysis.json',
      );

      const fileContent = await readFile(filePath, { encoding: 'utf8' });

      const analysisData = JSON.parse(fileContent) as {
        results: FranchisePage[];
      };

      const franchisePages = analysisData.results;
      this.logger.log(
        `Total de páginas para processar: ${franchisePages.length}`,
      );

      const pagesByType = this.groupPagesByType(franchisePages);

      for (const [pageType, pages] of Object.entries(pagesByType)) {
        if (pages.length > 0) {
          await this.processPagesByType(
            pageType as FranchisePage['pageType'],
            pages,
          );
        }
      }

      this.logger.log('Processamento concluído!');
    } catch (error) {
      this.logger.error('Erro ao processar páginas detectadas:', error);
      throw error;
    }
  }

  private groupPagesByType(
    pages: FranchisePage[],
  ): Record<string, FranchisePage[]> {
    return pages.reduce(
      (groups, page) => {
        const type = page.pageType;

        if (!groups[type]) {
          groups[type] = [];
        }

        groups[type].push(page);
        return groups;
      },
      {} as Record<string, FranchisePage[]>,
    );
  }

  private async processPagesByType(
    pageType: FranchisePage['pageType'],
    pages: FranchisePage[],
  ): Promise<void> {
    switch (pageType) {
      case 'franchise-new': {
        const results = await this.franchiseNewScraper.scrapePages(pages);

        this.logger.log(
          `✅ FranchiseNewScraper processou ${results.length} páginas`,
        );

        await this.generateCsvsByAction(results, pages);
        break;
      }

      case 'franchise-old': {
        const results = await this.franchiseOldScraper.scrapePages(pages);

        this.logger.log(
          `✅ FranchiseOldScraper processou ${results.length} páginas`,
        );

        await this.generateCsvsByAction(results, pages);
        break;
      }

      default:
        this.logger.warn(`Tipo de página desconhecido: ${pageType as string}`);
        break;
    }
  }

  private async generateCsvsByAction(
    results: FranchiseData[],
    pages: FranchisePage[],
  ): Promise<void> {
    const urlToAction = new Map<string, 'create' | 'update'>();

    pages.forEach((page) => {
      urlToAction.set(page.url, page.action);
    });

    const createResults: FranchiseData[] = [];
    const updateResults: FranchiseData[] = [];

    results.forEach((result) => {
      if (result?.scrapedWebsite) {
        const action = urlToAction.get(result?.scrapedWebsite);

        if (action === 'create') {
          createResults.push(result);
        } else if (action === 'update') {
          updateResults.push(result);
        }
      }
    });

    if (createResults.length > 0) {
      await this.csvGenerator.generateCsvFromScrapedData(
        createResults,
        'create',
        { filename: `franchise-create.csv` },
      );
    }

    if (updateResults.length > 0) {
      await this.csvGenerator.generateCsvFromScrapedData(
        updateResults,
        'update',
        { filename: `franchise-update.csv` },
      );
    }

    await this.importCsvFile('data/exports/franchise-create.csv', 'create');
    await this.importCsvFile('data/exports/franchise-update.csv', 'update');
  }

  private async importCsvFile(
    filePath: string,
    type: 'create' | 'update',
  ): Promise<void> {
    try {
      const csvContent = await readFile(filePath, { encoding: 'utf8' });

      if (type === 'create') {
        this.logger.log(`🔄 Importando CSV CREATE: ${filePath}`);

        const result = await this.importService.importFromCSV(csvContent);

        this.logger.log(
          `✅ Import CREATE concluído: ${result.success}/${result.total} sucessos, ${result.failed} falhas`,
        );

        await unlink(filePath);

        if (result.errors.length > 0) {
          this.logger.warn(`⚠️ Erros de import:`, result.errors.slice(0, 3)); // Mostrar apenas os primeiros 3
        }
      } else {
        this.logger.log(`🔄 Importando CSV UPDATE: ${filePath}`);

        await this.importService.updateFromScraping(csvContent);

        this.logger.log(`✅ Import UPDATE concluído: ${filePath}`);

        await unlink(filePath);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao importar CSV ${filePath}:`, error);
      throw error;
    }
  }

  async updateFranchiseById(franchiseId: string): Promise<ImportResultType> {
    this.ensureScrapingEnabled();

    this.logger.log(
      `Iniciando atualização por ID via scraping: ${franchiseId}`,
    );

    const franchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseId },
    });

    if (!franchise) {
      throw new Error(`Franchise not found with id ${franchiseId}`);
    }

    if (!franchise.scrapedWebsite) {
      throw new Error(
        `Franchise ${franchiseId} does not have scrapedWebsite to fetch data from`,
      );
    }

    const url = franchise.scrapedWebsite;

    const pageType = await this.sitemapParser.detectSinglePageType(url);

    const page: FranchisePage = {
      url,
      lastmod: new Date().toISOString(),
      action: 'update',
      pageType,
    };

    let scraped: FranchiseData[] = [];

    if (pageType === 'franchise-new') {
      scraped = await this.franchiseNewScraper.scrapePages([page]);
    } else {
      scraped = await this.franchiseOldScraper.scrapePages([page]);
    }

    if (!scraped || scraped.length === 0) {
      throw new Error(
        `No data scraped for franchise ${franchiseId} at ${url} (pageType: ${pageType})`,
      );
    }

    const filename = `franchise-update-${franchiseId}.csv`;
    const csvPath = await this.csvGenerator.generateCsvFromScrapedData(
      scraped,
      'update',
      { filename },
    );

    const csvContent = await readFile(csvPath, { encoding: 'utf8' });
    this.logger.log(`CSV content: ${JSON.stringify(csvContent)}`);
    const result = await this.importService.updateFromScraping(csvContent);

    this.logger.log(
      `Atualização por ID concluída: ${result.success}/${result.total} sucesso(s) para ${franchiseId}`,
    );

    await unlink(csvPath);

    return result;
  }
}
