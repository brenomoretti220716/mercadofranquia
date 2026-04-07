import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--no-zygote',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-first-run',
];

const MAX_CONCURRENT_PAGES = 3;
const PAGE_CLOSE_TIMEOUT_MS = 8_000;
const BROWSER_CLOSE_TIMEOUT_MS = 10_000;

class Semaphore {
  private readonly queue: Array<() => void> = [];
  private running = 0;

  constructor(private readonly max: number) {}

  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const attempt = () => {
        if (this.running < this.max) {
          this.running++;
          resolve(() => {
            this.running--;
            const next = this.queue.shift();
            if (next) next();
          });
        } else {
          this.queue.push(attempt);
        }
      };
      attempt();
    });
  }

  get activeCount(): number {
    return this.running;
  }

  get pendingCount(): number {
    return this.queue.length;
  }
}

@Injectable()
export class BrowserPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserPoolService.name);
  private browser: Browser | null = null;
  private launchPromise: Promise<Browser> | null = null;
  private readonly semaphore = new Semaphore(MAX_CONCURRENT_PAGES);

  async onModuleInit(): Promise<void> {
    await this.getBrowser();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeBrowser();
  }

  /**
   * Acquires a semaphore slot, creates a fresh page, runs fn, then always
   * closes the page with a hard timeout to prevent zombie Chromium children.
   */
  async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    this.logger.debug(
      `Browser pool — active: ${this.semaphore.activeCount}, queued: ${this.semaphore.pendingCount}`,
    );

    const release = await this.semaphore.acquire();
    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      return await fn(page);
    } finally {
      if (page) {
        await this.closePage(page);
      }
      release();
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    if (!this.launchPromise) {
      this.launchPromise = this.launchBrowser().finally(() => {
        this.launchPromise = null;
      });
    }

    return this.launchPromise;
  }

  private async launchBrowser(): Promise<Browser> {
    this.logger.log('Launching shared Chromium instance...');

    const browser = await puppeteer.launch({
      headless: true,
      args: BROWSER_ARGS,
    });

    browser.on('disconnected', () => {
      this.logger.warn('Browser disconnected — will relaunch on next request.');
      this.browser = null;
    });

    this.browser = browser;
    this.logger.log('Chromium ready.');
    return browser;
  }

  private async closeBrowser(): Promise<void> {
    const browser = this.browser;
    this.browser = null;

    if (!browser) return;

    try {
      await Promise.race([
        browser.close(),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error('browser.close() timed out')),
            BROWSER_CLOSE_TIMEOUT_MS,
          ),
        ),
      ]);
      this.logger.log('Browser closed cleanly.');
    } catch (err) {
      this.logger.error(
        `browser.close() failed — sending SIGKILL: ${(err as Error).message}`,
      );
      try {
        browser.process()?.kill('SIGKILL');
      } catch {
        // ignore — process may already be gone
      }
    }
  }

  private async closePage(page: Page): Promise<void> {
    try {
      await Promise.race([
        page.close(),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error('page.close() timed out')),
            PAGE_CLOSE_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (err) {
      this.logger.warn(
        `page.close() failed or timed out: ${(err as Error).message}`,
      );
    }
  }
}
