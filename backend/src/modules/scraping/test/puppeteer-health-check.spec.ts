import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Puppeteer Health Check', () => {
  let browser: Browser | undefined;

  afterEach(async () => {
    if (browser) {
      await browser.close();
      browser = undefined;
    }
  });

  describe('Environment Information', () => {
    it('should have environment variables configured', () => {
      console.log('📋 Informações do ambiente:');
      console.log('- Node version:', process.version);
      console.log('- Platform:', process.platform);
      console.log('- Architecture:', process.arch);
      console.log(
        '- PUPPETEER_EXECUTABLE_PATH:',
        process.env.PUPPETEER_EXECUTABLE_PATH || 'não definido',
      );
      console.log(
        '- PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:',
        process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'não definido',
      );

      // Basic environment checks
      expect(process.version).toBeTruthy();
      expect(process.platform).toBeTruthy();
      expect(process.arch).toBeTruthy();
    });
  });

  describe('Browser Initialization', () => {
    it('should launch Puppeteer browser successfully', async () => {
      console.log('🌐 Tentando inicializar o browser...');

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      expect(browser).toBeDefined();
      console.log('✅ Browser inicializado com sucesso!');
    }, 30000);

    it('should create a new page successfully', async () => {
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

      console.log('📄 Criando nova página...');
      const page: Page = await browser.newPage();
      expect(page).toBeDefined();
      console.log('✅ Página criada com sucesso!');
    }, 30000);
  });

  describe('Page Navigation', () => {
    beforeEach(async () => {
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
    });

    it('should navigate to example.com and extract content', async () => {
      if (!browser) {
        throw new Error('Browser not initialized');
      }
      const page: Page = await browser.newPage();

      console.log('🔍 Navegando para example.com...');
      await page.goto('https://example.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const title: string = await page.title();
      expect(title).toBeTruthy();
      console.log('✅ Título da página:', title);

      // Teste de extração de conteúdo
      const content = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasH1: !!document.querySelector('h1'),
          bodyText: document.body?.innerText?.slice(0, 100) + '...',
        };
      });

      expect(content.url).toContain('example.com');
      expect(content.title).toBeTruthy();
      expect(content.hasH1).toBe(true);

      console.log('📊 Conteúdo extraído:');
      console.log('- URL:', content.url);
      console.log('- Título:', content.title);
      console.log('- Tem H1:', content.hasH1);
      console.log('- Texto do body:', content.bodyText);
    }, 30000);

    it('should navigate to franchise portal website', async () => {
      if (!browser) {
        throw new Error('Browser not initialized');
      }
      const page: Page = await browser.newPage();

      console.log('🏪 Testando site de franquia real...');
      await page.goto('https://franquias.portaldofranchising.com.br/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const franchiseTitle: string = await page.title();
      expect(franchiseTitle).toBeTruthy();
      console.log('✅ Título do Portal do Franchising:', franchiseTitle);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should provide helpful error messages for missing Chromium', async () => {
      // This test documents the expected error handling behavior
      // It won't actually fail if Chromium is missing, but will log helpful info
      const originalExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

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
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error('Tipo do erro:', (error as Error).constructor.name);
        console.error('Mensagem:', errorMessage);

        if (errorMessage.includes('ENOENT') || errorMessage.includes('spawn')) {
          console.error('\n💡 Dicas para resolver:');
          console.error(
            '1. Verifique se o Chromium está instalado: apk add chromium',
          );
          console.error(
            '2. Defina PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser',
          );
          console.error('3. Defina PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true');
        }

        // Re-throw to fail the test if browser can't be launched
        throw error;
      }
    }, 30000);
  });
});
