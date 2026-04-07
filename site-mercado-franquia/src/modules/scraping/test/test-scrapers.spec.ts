import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
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

maybeDescribe('Scrapers Direct Tests', () => {
  let oldScraper: FranchiseOldScraper;
  let newScraper: FranchiseNewScraper;
  let originalGroqApiKey: string | undefined;

  beforeAll(() => {
    // Salvar o valor original da variável de ambiente
    originalGroqApiKey = process.env.GROQ_API_KEY;

    // Garantir que a variável esteja definida
    if (!process.env.GROQ_API_KEY) {
      process.env.GROQ_API_KEY = TEST_GROQ_API_KEY;
    }

    // Verificar se está realmente definida
    console.log(
      '🔍 GROQ_API_KEY configurada:',
      process.env.GROQ_API_KEY ? 'SIM' : 'NÃO',
    );
    console.log(
      '📝 Primeiros caracteres:',
      process.env.GROQ_API_KEY
        ? process.env.GROQ_API_KEY.substring(0, 10) + '...'
        : 'undefined',
    );
  });

  afterAll(() => {
    // Restaurar o valor original
    if (originalGroqApiKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalGroqApiKey;
    }
  });

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

  describe('FranchiseOldScraper Direct Test', () => {
    const oldScraperPage: FranchisePage = {
      url: 'https://franquias.portaldofranchising.com.br/franquia-mcdonalds-valor/',
      lastmod: new Date().toISOString(),
      action: 'create',
      pageType: 'franchise-old',
    };

    it('should scrape franchise page and extract data', async () => {
      console.log('🔍 Testando FranchiseOldScraper...');
      console.log('URL:', oldScraperPage.url);

      const startTime = Date.now();
      const oldResults = await oldScraper.scrapePages([oldScraperPage]);
      const duration = Date.now() - startTime;

      expect(oldResults).toBeDefined();
      expect(Array.isArray(oldResults)).toBe(true);
      expect(oldResults.length).toBeGreaterThan(0);

      console.log(`✅ FranchiseOldScraper concluído em ${duration}ms`);
      console.log('Resultados encontrados:', oldResults.length);

      if (oldResults.length > 0) {
        const mcDonalds = oldResults[0];
        expect(mcDonalds).toBeDefined();

        console.log('📊 Dados extraídos:');
        console.log('- Nome:', mcDonalds.name || 'não encontrado');
        console.log(
          '- Segmento:',
          (mcDonalds as any).segment || 'não encontrado',
        );
        console.log(
          '- Descrição:',
          mcDonalds.description
            ? `${mcDonalds.description.slice(0, 100)}...`
            : 'não encontrado',
        );
        console.log('- Logo URL:', mcDonalds.logoUrl || 'não encontrado');
        console.log('- Website:', mcDonalds.website || 'não encontrado');
        console.log(
          '- Investimento Mínimo:',
          mcDonalds.minimumInvestment || 'não encontrado',
        );
        console.log(
          '- Investimento Máximo:',
          mcDonalds.maximumInvestment || 'não encontrado',
        );

        // Basic structure against FranchiseData
        expect(mcDonalds.scrapedWebsite).toBe(oldScraperPage.url);
        expect(mcDonalds.lastScrapedAt).toBeInstanceOf(Date);

        // Required fields / types
        expect(mcDonalds.name).toBeTruthy();
        expect(mcDonalds.name?.toLowerCase()).toContain('mcdonald');

        expect((mcDonalds as any).segment).toBe('Alimentação');
        expect(
          (
            (mcDonalds as any).subsegment as string | null | undefined
          )?.toLowerCase() || '',
        ).toContain('restaurantes');

        expect((mcDonalds.headquarter ?? '').toString().toLowerCase()).toBe(
          'são paulo',
        );
        expect(typeof (mcDonalds as any).totalUnits).toBe('number');
        expect((mcDonalds as any).totalUnits).toBeGreaterThan(0);

        // Investment range
        expect(typeof mcDonalds.minimumInvestment).toBe('number');
        expect(
          (mcDonalds.minimumInvestment as number) ?? 0,
        ).toBeGreaterThanOrEqual(2_670_000);
        if (mcDonalds.maximumInvestment !== null) {
          expect(typeof mcDonalds.maximumInvestment).toBe('number');
        }

        // Media and contact
        expect(mcDonalds.logoUrl).toBeTruthy();
        expect(
          (mcDonalds.description ?? '').toString().trim().length,
        ).toBeGreaterThan(0);
        if (mcDonalds.email) {
          expect(mcDonalds.email).toContain('@');
        }
        if (mcDonalds.website) {
          expect(mcDonalds.website.startsWith('http')).toBe(true);
        }
      } else {
        console.log('⚠️ Nenhum resultado encontrado');
      }
    }, 60000);

    it('should complete scraping within reasonable time', async () => {
      const startTime = Date.now();
      await oldScraper.scrapePages([oldScraperPage]);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
      console.log(`✅ Scraping concluído em ${duration}ms`);
    }, 70000);
  });

  describe('FranchiseNewScraper Direct Test', () => {
    const newScraperPage: FranchisePage = {
      url: 'https://franquias.portaldofranchising.com.br/franquia-guaco/',
      lastmod: new Date().toISOString(),
      action: 'create',
      pageType: 'franchise-new',
    };

    it('should scrape franchise page and extract data', async () => {
      console.log('🔍 Testando FranchiseNewScraper...');
      console.log('URL:', newScraperPage.url);

      const startTime = Date.now();
      const newResults = await newScraper.scrapePages([newScraperPage]);
      const duration = Date.now() - startTime;

      expect(newResults).toBeDefined();
      expect(Array.isArray(newResults)).toBe(true);
      expect(newResults.length).toBeGreaterThan(0);

      console.log(`✅ FranchiseNewScraper concluído em ${duration}ms`);
      console.log('Resultados encontrados:', newResults.length);

      if (newResults.length > 0) {
        const guaco = newResults[0];
        expect(guaco).toBeDefined();

        console.log('📊 Dados extraídos:');
        console.log('- Nome:', guaco.name || 'não encontrado');
        console.log('- Segmento:', guaco.segment || 'não encontrado');
        console.log(
          '- Descrição:',
          guaco.description
            ? `${guaco.description.slice(0, 100)}...`
            : 'não encontrado',
        );
        console.log('- Logo URL:', guaco.logoUrl || 'não encontrado');
        console.log('- Website:', guaco.website || 'não encontrado');
        console.log(
          '- Investimento Mínimo:',
          guaco.minimumInvestment || 'não encontrado',
        );
        console.log(
          '- Investimento Máximo:',
          guaco.maximumInvestment || 'não encontrado',
        );
        console.log(
          '- ROI Mínimo (meses):',
          guaco.minimumReturnOnInvestment || 'não encontrado',
        );
        console.log(
          '- ROI Máximo (meses):',
          guaco.maximumReturnOnInvestment || 'não encontrado',
        );

        // Basic structure against FranchiseData
        expect(guaco.scrapedWebsite).toBe(newScraperPage.url);
        expect(guaco.lastScrapedAt).toBeInstanceOf(Date);

        // Required fields / types when present
        if (guaco.name) {
          expect(guaco.name.toLowerCase()).toContain('gua');
        }

        if (guaco.headquarter) {
          expect(guaco.headquarter.toLowerCase()).toBe('são paulo');
        }
        if (guaco.totalUnits != null) {
          expect(typeof guaco.totalUnits).toBe('number');
          expect(guaco.totalUnits).toBeGreaterThan(0);
        }

        // Store area in the range 80–400 m² when present
        if (guaco.storeArea != null) {
          expect(typeof guaco.storeArea).toBe('number');
          expect(guaco.storeArea ?? 0).toBeGreaterThanOrEqual(80);
          expect(guaco.storeArea ?? 0).toBeLessThanOrEqual(400);
        }

        // Investment range when present
        if (guaco.minimumInvestment != null) {
          expect(typeof guaco.minimumInvestment).toBe('number');
          expect(guaco.minimumInvestment ?? 0).toBeGreaterThanOrEqual(750_000);
        }
        if (guaco.maximumInvestment != null) {
          expect(typeof guaco.maximumInvestment).toBe('number');
          expect(guaco.maximumInvestment ?? 0).toBeLessThanOrEqual(1_090_000);
        }

        // ROI 24 to 36 months when present
        if (guaco.minimumReturnOnInvestment != null) {
          expect(guaco.minimumReturnOnInvestment).toBeGreaterThan(0);
        }
        if (guaco.maximumReturnOnInvestment != null) {
          expect(guaco.maximumReturnOnInvestment).toBeGreaterThan(0);
        }

        // Royalties and fees when present
        if (guaco.royalties != null) {
          expect(typeof guaco.royalties).toBe('number');
        }
        if (guaco.franchiseFee != null) {
          expect(typeof guaco.franchiseFee).toBe('number');
        }

        // Media and contact when present
        if (guaco.logoUrl) {
          expect(guaco.logoUrl).toBeTruthy();
        }
        if (guaco.description) {
          expect(guaco.description.toString().trim().length).toBeGreaterThan(0);
        }
        if (guaco.website) {
          expect(guaco.website.startsWith('http')).toBe(true);
        }
      } else {
        console.log('⚠️ Nenhum resultado encontrado');
      }
    }, 60000);

    it('should complete scraping within reasonable time', async () => {
      const startTime = Date.now();
      await newScraper.scrapePages([newScraperPage]);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
      console.log(`✅ Scraping concluído em ${duration}ms`);
    }, 70000);
  });

  describe('Scrapers Comparison', () => {
    it('should extract similar data from both scrapers', async () => {
      const oldPage: FranchisePage = {
        url: 'https://franquias.portaldofranchising.com.br/franquia-mcdonalds-valor/',
        lastmod: new Date().toISOString(),
        action: 'create',
        pageType: 'franchise-old',
      };

      const newPage: FranchisePage = {
        url: 'https://franquias.portaldofranchising.com.br/franquia-guaco/',
        lastmod: new Date().toISOString(),
        action: 'create',
        pageType: 'franchise-new',
      };

      const [oldResults, newResults] = await Promise.all([
        oldScraper.scrapePages([oldPage]),
        newScraper.scrapePages([newPage]),
      ]);

      expect(oldResults).toBeDefined();
      expect(newResults).toBeDefined();
      expect(Array.isArray(oldResults)).toBe(true);
      expect(Array.isArray(newResults)).toBe(true);
      expect(oldResults.length).toBeGreaterThan(0);
      expect(newResults.length).toBeGreaterThan(0);

      console.log('📊 Comparação dos scrapers:');
      console.log('- OldScraper resultados:', oldResults.length);
      console.log('- NewScraper resultados:', newResults.length);

      if (oldResults.length > 0 && newResults.length > 0) {
        const oldResult = oldResults[0];
        const newResult = newResults[0];

        console.log('- OldScraper nome:', oldResult.name);
        console.log('- NewScraper nome:', newResult.name);

        // Ensure both scrapers are extracting consistent core structures
        expect(oldResult.scrapedWebsite).toBe(oldPage.url);
        expect(newResult.scrapedWebsite).toBe(newPage.url);
        expect(oldResult.lastScrapedAt).toBeInstanceOf(Date);
        expect(newResult.lastScrapedAt).toBeInstanceOf(Date);

        // Both should have numeric investments and non-empty descriptions when present
        if (oldResult.minimumInvestment != null) {
          expect(typeof oldResult.minimumInvestment).toBe('number');
        }
        if (newResult.minimumInvestment != null) {
          expect(typeof newResult.minimumInvestment).toBe('number');
        }
        if (oldResult.description) {
          expect(
            oldResult.description.toString().trim().length,
          ).toBeGreaterThan(0);
        }
        if (newResult.description) {
          expect(
            newResult.description.toString().trim().length,
          ).toBeGreaterThan(0);
        }
      }
    }, 120000);
  });
});
