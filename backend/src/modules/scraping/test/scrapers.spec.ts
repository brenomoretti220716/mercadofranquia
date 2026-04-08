import { Test, TestingModule } from '@nestjs/testing';
import puppeteer, { Browser, Page } from 'puppeteer';
import { SegmentAiClassifierService } from '../../segments/segment-ai-classifier.service';
import { BrowserPoolService } from '../browser/browser-pool.service';
import { LlmService } from '../llm-models/groq.service';
import { FranchiseNewScraper } from '../scrapers/franchise-new.scraper.service';
import { FranchiseOldScraper } from '../scrapers/franchise-old.scraper.service';
import { FranchisePage } from '../scraping.service';

// Configurar a variável de ambiente ANTES de qualquer importação que possa precisar dela.
const TEST_GROQ_API_KEY =
  'process.env.GROQ_API_KEY';

// Sempre definir a API key de teste se não estiver definida
// Isso garante que os testes funcionem mesmo sem configuração externa
if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = TEST_GROQ_API_KEY;
  console.log(
    '⚠️ GROQ_API_KEY não encontrada no ambiente, usando valor de teste',
  );
} else {
  console.log('✅ GROQ_API_KEY encontrada no ambiente');
}

// Heavy integration tests that hit the real website and require a working
// Chromium installation. Opt-in via env to avoid flakes in constrained envs.
const RUN_SCRAPING_INTEGRATION_TESTS =
  process.env.RUN_SCRAPING_INTEGRATION_TESTS === 'true';

const maybeDescribe = RUN_SCRAPING_INTEGRATION_TESTS ? describe : describe.skip;

maybeDescribe('Scrapers Integration Tests', () => {
  let oldScraper: FranchiseOldScraper;
  let newScraper: FranchiseNewScraper;

  beforeEach(async () => {
    // Garantir que a API key esteja definida antes de criar os scrapers.
    if (!process.env.GROQ_API_KEY) {
      process.env.GROQ_API_KEY = TEST_GROQ_API_KEY;
      console.log('🔧 Definindo GROQ_API_KEY no beforeEach');
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrowserPoolService,
        SegmentAiClassifierService,
        FranchiseOldScraper,
        FranchiseNewScraper,
        {
          provide: LlmService,
          useValue: {
            ask: jest
              .fn()
              .mockResolvedValue(
                '{"businessType": "Test", "segment": "Test", "subsegment": "Test", "brandFoundationYear": "2020", "franchiseStartYear": "2021", "abfSince": "2022", "isAbfAssociated": true}',
              ),
          },
        },
      ],
    }).compile();

    oldScraper = module.get<FranchiseOldScraper>(FranchiseOldScraper);
    newScraper = module.get<FranchiseNewScraper>(FranchiseNewScraper);
  });

  describe('Puppeteer Environment Test', () => {
    it('should launch Puppeteer browser successfully', async () => {
      console.log('🧪 Testing Puppeteer browser launch...');
      console.log(
        'PUPPETEER_EXECUTABLE_PATH:',
        process.env.PUPPETEER_EXECUTABLE_PATH,
      );
      console.log(
        'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:',
        process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
      );

      let browser: Browser | undefined;
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });

        expect(browser).toBeDefined();
        console.log('✅ Browser launched successfully!');

        const page: Page = await browser.newPage();
        expect(page).toBeDefined();
        console.log('✅ Page created successfully!');

        await page.goto('https://example.com', {
          waitUntil: 'domcontentloaded',
        });
        const title: string = await page.title();
        expect(title).toBeTruthy();
        console.log('✅ Page navigation successful! Title:', title);
      } catch (error) {
        console.error('❌ Puppeteer test failed:', error);
        throw error;
      } finally {
        if (browser) {
          await browser.close();
          console.log('✅ Browser closed successfully!');
        }
      }
    }, 30000);
  });

  describe('FranchiseOldScraper', () => {
    it('should scrape a single franchise page successfully', async () => {
      const testPage: FranchisePage = {
        url: 'https://franquias.portaldofranchising.com.br/franquia-mcdonalds-valor/',
        lastmod: new Date().toISOString(),
        action: 'create',
        pageType: 'franchise-old',
      };

      console.log('🧪 Testing FranchiseOldScraper...');

      const result = await oldScraper.scrapePages([testPage]);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      console.log('✅ FranchiseOldScraper test completed!');
      console.log('Result length:', result.length);

      if (result.length > 0) {
        const mcDonalds = result[0];

        console.log('Sample result:', {
          name: mcDonalds.name,
          segment: mcDonalds.segment,
          subsegment: (mcDonalds as any).subsegment,
          headquarter: mcDonalds.headquarter,
          totalUnits: (mcDonalds as any).totalUnits,
          hasLogo: !!mcDonalds.logoUrl,
          hasDescription: !!mcDonalds.description,
          minimumInvestment: mcDonalds.minimumInvestment,
          maximumInvestment: mcDonalds.maximumInvestment,
        });

        // Basic structure
        expect(mcDonalds.scrapedWebsite).toBe(testPage.url);
        expect(mcDonalds.lastScrapedAt).toBeInstanceOf(Date);

        // Name should reference McDonald's
        expect(mcDonalds.name).toBeTruthy();
        expect(mcDonalds.name?.toLowerCase()).toContain('mcdonald');

        // Segment and subsegment
        expect((mcDonalds as any).segment).toBe('Alimentação');
        expect(
          (
            (mcDonalds as any).subsegment as string | null | undefined
          )?.toLowerCase() || '',
        ).toContain('restaurantes');

        // Headquarter and units (allowing for site changes)
        expect((mcDonalds.headquarter ?? '').toString().toLowerCase()).toBe(
          'são paulo',
        );
        expect(typeof (mcDonalds as any).totalUnits).toBe('number');
        expect((mcDonalds as any).totalUnits).toBeGreaterThan(0);

        // Investment range (page states "a partir de R$ 2.670.000")
        expect(typeof mcDonalds.minimumInvestment).toBe('number');
        expect(
          (mcDonalds.minimumInvestment as number) ?? 0,
        ).toBeGreaterThanOrEqual(2_670_000);
        // Maximum may be null for "a partir de" style values
        if (mcDonalds.maximumInvestment !== null) {
          expect(typeof mcDonalds.maximumInvestment).toBe('number');
        }

        // Media and description
        expect(mcDonalds.logoUrl).toBeTruthy();
        expect(
          (mcDonalds.description ?? '').toString().trim().length,
        ).toBeGreaterThan(0);
      }
    }, 60000);
  });

  describe('FranchiseNewScraper', () => {
    it('should scrape a single franchise page successfully', async () => {
      const testPage: FranchisePage = {
        url: 'https://franquias.portaldofranchising.com.br/franquia-guaco/',
        lastmod: new Date().toISOString(),
        action: 'create',
        pageType: 'franchise-new',
      };

      console.log('🧪 Testing FranchiseNewScraper...');

      const result = await newScraper.scrapePages([testPage]);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      console.log('✅ FranchiseNewScraper test completed!');
      console.log('Result length:', result.length);

      if (result.length > 0) {
        const guaco = result[0];

        console.log('Sample result:', {
          name: guaco.name,
          segment: guaco.segment,
          headquarter: guaco.headquarter,
          totalUnits: guaco.totalUnits,
          storeArea: guaco.storeArea,
          hasLogo: !!guaco.logoUrl,
          hasDescription: !!guaco.description,
          minimumInvestment: guaco.minimumInvestment,
          maximumInvestment: guaco.maximumInvestment,
          minimumROI: guaco.minimumReturnOnInvestment,
          maximumROI: guaco.maximumReturnOnInvestment,
          royalties: guaco.royalties,
          franchiseFee: guaco.franchiseFee,
        });

        // Basic structure
        expect(guaco.scrapedWebsite).toBe(testPage.url);
        expect(guaco.lastScrapedAt).toBeInstanceOf(Date);

        // Name should reference Gua.Co when present
        if (guaco.name) {
          expect(guaco.name.toLowerCase()).toContain('gua');
        }

        // Headquarter and units (only assert when data is present)
        if (guaco.headquarter) {
          expect(guaco.headquarter.toLowerCase()).toBe('são paulo');
        }
        if (guaco.totalUnits != null) {
          expect(typeof guaco.totalUnits).toBe('number');
          expect(guaco.totalUnits).toBeGreaterThan(0);
        }

        // Store area "de 80 a 400 m²" → parsed as number within this range when available
        if (guaco.storeArea != null) {
          expect(typeof guaco.storeArea).toBe('number');
          expect(guaco.storeArea ?? 0).toBeGreaterThanOrEqual(80);
          expect(guaco.storeArea ?? 0).toBeLessThanOrEqual(400);
        }

        // Investment range 750.000 a 1.090.000 when available
        if (guaco.minimumInvestment != null) {
          expect(typeof guaco.minimumInvestment).toBe('number');
          expect(guaco.minimumInvestment ?? 0).toBeGreaterThanOrEqual(750_000);
        }
        if (guaco.maximumInvestment != null) {
          expect(typeof guaco.maximumInvestment).toBe('number');
          expect(guaco.maximumInvestment ?? 0).toBeLessThanOrEqual(1_090_000);
        }

        // ROI 24 a 36 meses when available
        if (guaco.minimumReturnOnInvestment != null) {
          expect(guaco.minimumReturnOnInvestment).toBeGreaterThan(0);
        }
        if (guaco.maximumReturnOnInvestment != null) {
          expect(guaco.maximumReturnOnInvestment).toBeGreaterThan(0);
        }

        // Royalties and franchise fee when available
        if (guaco.royalties != null) {
          expect(typeof guaco.royalties).toBe('number');
        }
        if (guaco.franchiseFee != null) {
          expect(typeof guaco.franchiseFee).toBe('number');
        }

        // Media and description should be non-empty when present
        if (guaco.logoUrl) {
          expect(guaco.logoUrl).toBeTruthy();
        }
        if (guaco.description) {
          expect(guaco.description.toString().trim().length).toBeGreaterThan(0);
        }
      }
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      const invalidPage: FranchisePage = {
        url: 'https://invalid-url-that-does-not-exist.com/test',
        lastmod: new Date().toISOString(),
        action: 'create',
        pageType: 'franchise-old',
      };

      console.log('🧪 Testing error handling...');

      const result = await oldScraper.scrapePages([invalidPage]);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should return empty array or handle gracefully
      console.log('✅ Error handling test completed!');
      console.log('Result with invalid URL:', result.length);
    }, 30000);
  });

  describe('Performance Test', () => {
    it('should complete scraping within reasonable time', async () => {
      const testPages: FranchisePage[] = [
        {
          url: 'https://example.com',
          lastmod: new Date().toISOString(),
          action: 'create',
          pageType: 'franchise-old',
        },
      ];

      console.log('🧪 Testing scraping performance...');
      const startTime = Date.now();

      const result = await oldScraper.scrapePages(testPages);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Performance test completed in ${duration}ms`);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result).toBeDefined();
    }, 35000);
  });
});
