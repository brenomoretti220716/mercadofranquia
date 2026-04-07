import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import { BrowserPoolService } from '../browser/browser-pool.service';

jest.mock('puppeteer');

describe('BrowserPoolService', () => {
  let service: BrowserPoolService;
  let browserMock: jest.Mocked<Browser>;
  let pageMock: jest.Mocked<Page>;
  let launchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    pageMock = {
      close: jest.fn(async () => {}),
    } as unknown as jest.Mocked<Page>;

    browserMock = {
      newPage: jest.fn(async () => pageMock),
      close: jest.fn(async () => {}),
      on: jest.fn(),
      process: jest.fn().mockReturnValue({ kill: jest.fn() } as any),
      connected: true as any,
    } as unknown as jest.Mocked<Browser>;

    launchMock = puppeteer.launch as unknown as jest.Mock;
    launchMock.mockImplementation(async () => browserMock);

    service = new BrowserPoolService();
  });

  it('should reuse the same browser instance for multiple pages', async () => {
    const results = await Promise.all([
      service.withPage(async () => 'ok-1'),
      service.withPage(async () => 'ok-2'),
    ]);

    expect(results).toEqual(['ok-1', 'ok-2']);

    // Only one browser.launch, multiple newPage calls
    expect(launchMock).toHaveBeenCalledTimes(1);
    expect(browserMock.newPage).toHaveBeenCalledTimes(2);
    expect(pageMock.close).toHaveBeenCalledTimes(2);
  });

  it('should always close the page even when the callback throws', async () => {
    await expect(
      service.withPage(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(browserMock.newPage).toHaveBeenCalledTimes(1);
    expect(pageMock.close).toHaveBeenCalledTimes(1);
  });

  it('should limit concurrent pages using the internal semaphore', async () => {
    let active = 0;
    let maxActive = 0;

    (browserMock.newPage as jest.Mock).mockImplementation(async () => {
      active += 1;
      if (active > maxActive) {
        maxActive = active;
      }
      return pageMock;
    });

    (pageMock.close as jest.Mock).mockImplementation(async () => {
      active -= 1;
    });

    const tasks = Array.from({ length: 10 }).map((_, index) =>
      service.withPage(async () => {
        // Simula algum trabalho assíncrono na página
        await new Promise((resolve) => setTimeout(resolve, 10 + index));
        return index;
      }),
    );

    const results = await Promise.all(tasks);

    expect(results).toHaveLength(10);
    // MAX_CONCURRENT_PAGES = 3 dentro do serviço
    expect(maxActive).toBeLessThanOrEqual(3);
  });
});
