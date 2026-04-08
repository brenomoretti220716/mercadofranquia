import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { SegmentAiClassifierService } from '../../segments/segment-ai-classifier.service';
import { BrowserPoolService } from '../browser/browser-pool.service';
import { FranchiseData } from '../schemas/franchise-schema';
import { FranchisePage } from '../scraping.service';
import { parseInvestmentRange } from '../utils/numeric-parser.util';

@Injectable()
export class FranchiseOldScraper {
  private readonly logger = new Logger(FranchiseOldScraper.name);

  constructor(
    private readonly browserPool: BrowserPoolService,
    private readonly segmentAiClassifier: SegmentAiClassifierService,
  ) {}

  async scrapePages(pages: FranchisePage[]): Promise<FranchiseData[]> {
    this.logger.log(
      `Iniciando scraping de ${pages.length} páginas franchise-old`,
    );

    const results: FranchiseData[] = [];

    for (const page of pages) {
      try {
        this.logger.debug(`Processando: ${page.url}`);
        const franchiseData = await this.scrapeSinglePage(page);
        if (franchiseData) {
          results.push(franchiseData);
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao processar ${page.url}:`, error);
      }
    }

    this.logger.log(
      `Scraping concluído. ${results.length}/${pages.length} páginas processadas com sucesso`,
    );
    return results;
  }

  private async scrapeSinglePage(
    page: FranchisePage,
  ): Promise<FranchiseData | null> {
    try {
      // Utiliza Puppeteer para renderizar a página completa (incluindo JS) e obter o HTML resultante
      const html = await this.fetchPageContent(page.url);

      const $ = cheerio.load(html);

      // Extrai todos os dados
      // Extract and parse investment range
      const investmentRange = this.extractInvestmentRange($);

      const rawSegment = this.extractSegment($);
      const rawSubsegment = this.extractSubsegment($);
      const description = this.extractDescription($);
      const classified = await this.segmentAiClassifier.classify({
        rawSegment,
        rawSubsegment,
        description,
      });

      const franchiseData: FranchiseData = {
        name: this.extractFranchiseName($),
        businessType: this.extractBusinessType($),
        segment: classified.segment ?? rawSegment,
        subsegment: classified.subsegment ?? rawSubsegment,
        description,

        // Midias
        logoUrl: this.extractLogoUrl($),
        videoUrl: this.extractVideoUrl($),
        galleryUrls: this.extractGalleryUrls($),

        // Investment Range (parsed to numeric)
        minimumInvestment: investmentRange.minimum,
        maximumInvestment: investmentRange.maximum,

        // Informações da empresa
        brandFoundationYear: this.extractBrandFoundationYear($),
        franchiseStartYear: this.extractFranchiseStartYear($),
        headquarter: this.extractHeadquarterState($),
        totalUnits: this.extractTotalUnits($),
        isAbfAssociated: this.extractAbfAssociation($),
        abfSince: this.extractAbfSince($),

        // Contato
        email: this.extractEmail($),
        phone: this.extractPhone($),
        website: this.extractWebsite($),

        // Metadados
        scrapedWebsite: page.url,
        lastScrapedAt: new Date(page.lastmod),
      };

      this.logger.log(`✅ Extraído: ${franchiseData.name}`);
      return franchiseData;
    } catch (error) {
      this.logger.error(`Erro ao processar ${page.url}:`, error);
      return null;
    }
  }

  private async fetchPageContent(url: string): Promise<string> {
    return this.browserPool.withPage(async (page) => {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      );

      page.setDefaultNavigationTimeout(45_000);
      page.setDefaultTimeout(45_000);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      } catch (err) {
        this.logger.warn(
          `Primeira tentativa de navegação falhou: ${(err as Error).message}`,
        );
        await page.goto(url, { waitUntil: 'networkidle2' });
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      return page.content();
    });
  }

  private extractFranchiseName($: cheerio.CheerioAPI): string | null {
    return (
      $('h1:contains("Franquia")')
        .first()
        .text()
        .trim()
        .replace('Franquia ', '') || null
    );
  }

  private extractBusinessType($: cheerio.CheerioAPI): string | null {
    return $('p:contains("Tipo de Negócio")').next().text().trim() || null;
  }

  private extractSegment($: cheerio.CheerioAPI): string | null {
    const segmentText = $('p:contains("Segmento de atuação")')
      .next()
      .text()
      .trim();
    return segmentText || null;
  }

  private extractSubsegment($: cheerio.CheerioAPI): string | null {
    const subsegmentText = $('p:contains("Subsegmento primário")')
      .next()
      .text()
      .trim();

    return subsegmentText || null;
  }

  private extractDescription($: cheerio.CheerioAPI): string | null {
    const description = $('h3:contains("Sobre a franquia")')
      .next()
      .text()
      .trim();

    return description || null;
  }

  /**
   * Extract investment range from the old layout page
   * Returns both minimum and maximum investment values
   */
  private extractInvestmentRange($: cheerio.CheerioAPI): {
    minimum: number | null;
    maximum: number | null;
  } {
    const investmentText = $('h5:contains("VALOR DE INVESTIMENTO")')
      .next()
      .text()
      .trim();

    return parseInvestmentRange(investmentText);
  }

  private extractBrandFoundationYear($: cheerio.CheerioAPI): string | null {
    const foundationP = $('p:contains("Fundação:")').text().trim();

    const match = foundationP.match(/\s*(\d{4})/);

    return match ? match[1] : null;
  }

  private extractFranchiseStartYear($: cheerio.CheerioAPI): string | null {
    const franchiseStartLi = $('p:contains("Início da franquia")');

    const franchiseStartText = franchiseStartLi.text();

    const match = franchiseStartText.match(/:\s*(\d{4})/);

    return match ? match[1] : null;
  }

  private extractHeadquarterState($: cheerio.CheerioAPI): string | null {
    const stateText = $('p:contains("ESTADO SEDE")').text();

    const match = stateText.match(/ESTADO SEDE\s+(.+)/);

    return match ? match[1].trim() : null;
  }

  private extractTotalUnits($: cheerio.CheerioAPI): number {
    const unitsText = $('p:contains("NÚMERO DE UNIDADES")').text();

    const match = unitsText.match(/NÚMERO DE UNIDADES\s+(\d+)/);

    return match ? parseInt(match[1]) : 0;
  }

  private extractAbfAssociation($: cheerio.CheerioAPI): boolean {
    if (this.extractAbfSince($) === '') {
      return false;
    }
    return true;
  }

  private extractAbfSince($: cheerio.CheerioAPI): string | null {
    const abfElement = $('p:contains("Associada ABF desde:")');

    const match = abfElement.text().match(/desde:\s*(\d{4})/);

    return match ? match[1] : null;
  }

  private extractEmail($: cheerio.CheerioAPI): string | null {
    const emailText = $('a[href^="mailto:"]').attr('href');
    const match = emailText?.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    );
    return match ? match[1] : null;
  }

  private extractPhone($: cheerio.CheerioAPI): string | null {
    const phoneLink = $('a[href^="tel:"]').attr('href');

    const match = phoneLink?.match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);

    return match ? match[0] : null;
  }

  private extractWebsite($: cheerio.CheerioAPI): string | null {
    const siteLink = $('a:contains("Acesse o site, clique aqui")').attr('href');

    if (!siteLink) return null;

    const cleanedLink = this.removeUtmParameters(siteLink);

    return cleanedLink || null;
  }

  private removeUtmParameters(url: string): string {
    try {
      const urlObj = new URL(url);

      const paramsToDelete: string[] = [];
      for (const [key] of urlObj.searchParams) {
        if (key.toLowerCase().startsWith('utm')) {
          paramsToDelete.push(key);
        }
      }

      paramsToDelete.forEach((param) => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  private extractLogoUrl($: cheerio.CheerioAPI): string | null {
    const logoUrl = $('img[class*="logo-non-advertiser"]').attr('src');
    return logoUrl || null;
  }

  private extractGalleryUrls($: cheerio.CheerioAPI): string | null {
    const galleryUrls: string[] = [];

    const startHeading = $('h3:contains("Sobre a franquia")').first();
    if (startHeading.length === 0) {
      return null;
    }

    const endHeading = startHeading
      .nextAll('div[class*="container-salmon"]')
      .first();

    let current = startHeading.next();
    while (
      current.length &&
      (endHeading.length === 0 || !current.is(endHeading))
    ) {
      current.find('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !galleryUrls.includes(src)) {
          galleryUrls.push(src);
        }
      });
      current = current.next();
    }

    return galleryUrls.length > 0 ? JSON.stringify(galleryUrls) : null;
  }

  private extractVideoUrl($: cheerio.CheerioAPI): string | null {
    const videoUrls: string[] = [];

    const videoUrl = $('lite-youtube[videoid]');

    videoUrl.each((i, el) => {
      const videoId = $(el).attr('videoid');
      if (videoId) {
        videoUrls.push(`https://www.youtube.com/watch?v=${videoId}`);
      }
    });

    return videoUrls.length > 0 ? JSON.stringify(videoUrls) : null;
  }
}
