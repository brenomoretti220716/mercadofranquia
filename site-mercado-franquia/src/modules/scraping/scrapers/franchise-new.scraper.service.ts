import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { SegmentAiClassifierService } from '../../segments/segment-ai-classifier.service';
import { BrowserPoolService } from '../browser/browser-pool.service';
import { LlmService } from '../llm-models/groq.service';
import { FranchiseData } from '../schemas/franchise-schema';
import { FranchisePage } from '../scraping.service';
import {
  parseArea,
  parseInvestmentRange,
  parseMonetaryValue,
  parsePercentage,
  parseROIRange,
} from '../utils/numeric-parser.util';

interface AiFields {
  businessType: string | null;
  segment: string | null;
  subsegment: string | null;
  brandFoundationYear: string | null;
  franchiseStartYear: string | null;
  abfSince: string | null;
  isAbfAssociated: boolean;
}

@Injectable()
export class FranchiseNewScraper {
  private readonly logger = new Logger(FranchiseNewScraper.name);

  constructor(
    private readonly browserPool: BrowserPoolService,
    private readonly llmService: LlmService,
    private readonly segmentAiClassifier: SegmentAiClassifierService,
  ) {}

  async scrapePages(pages: FranchisePage[]): Promise<FranchiseData[]> {
    this.logger.log(
      `Iniciando scraping de ${pages.length} páginas franchise-new`,
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
      const html = await this.fetchPageContent(page.url);

      const $ = cheerio.load(html);

      // Extract and parse investment range
      const investmentRange = this.extractInvestmentRange($);

      // Extract and parse ROI range
      const roiRange = this.extractROIRange($);

      const franchiseData: FranchiseData = {
        // Dados da franquia
        name: this.extractFranchiseName($),
        headquarter: this.extractHeadquarterState($),
        storeArea: this.extractStoreArea($),
        totalUnits: this.extractTotalUnits($),
        description: this.extractDescription($),

        // Midias
        videoUrl: this.extractVideoUrl($),
        logoUrl: this.extractLogoUrl($),
        thumbnailUrl: this.extractThumbnailUrl($),
        galleryUrls: this.extractGalleryUrls($),

        // Investment Range (parsed to numeric)
        minimumInvestment: investmentRange.minimum,
        maximumInvestment: investmentRange.maximum,

        // Capital (parsed to numeric)
        setupCapital: this.extractSetupCapital($),
        workingCapital: this.extractWorkingCapital($),

        // ROI Range (parsed to months)
        minimumReturnOnInvestment: roiRange.minimum,
        maximumReturnOnInvestment: roiRange.maximum,

        // Revenue and fees (parsed to numeric)
        averageMonthlyRevenue: this.extractAverageMonthlyRevenue($),
        franchiseFee: this.extractFranchiseFee($),

        // Percentages (parsed to numeric)
        royalties: this.extractRoyalties($),
        advertisingFee: this.extractAdvertisingFee($),

        // Calculation bases (keep as strings)
        calculationBaseRoyaltie: this.extractCalculationBaseRoyaltie($),
        calculationBaseAdFee: this.extractCalculationBaseAdFee($),

        // Contato
        website: this.extractWebsite($),

        // Metadados
        scrapedWebsite: page.url,
        lastScrapedAt: new Date(page.lastmod),

        // IA (chama apenas uma vez) + classificação final de segmento/subsegmento
        ...(await (async () => {
          const ai = await this.extractAiFields($);
          const fullDescription = this.fullDescription($);
          const classified = await this.segmentAiClassifier.classify({
            rawSegment: ai?.segment ?? null,
            rawSubsegment: ai?.subsegment ?? null,
            description: fullDescription,
          });
          return {
            businessType: ai?.businessType ?? null,
            segment: classified.segment ?? ai?.segment ?? null,
            subsegment: classified.subsegment ?? ai?.subsegment ?? null,
            brandFoundationYear: ai?.brandFoundationYear ?? null,
            franchiseStartYear: ai?.franchiseStartYear ?? null,
            abfSince: ai?.abfSince ?? null,
            isAbfAssociated: ai?.isAbfAssociated ?? false,
          };
        })()),
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

  private getLojaTab($: cheerio.CheerioAPI) {
    return $('div.tab-content.Lojas').first();
  }

  private extractFranchiseName($: cheerio.CheerioAPI): string | null {
    return (
      $('h1.franchise-title')
        .first()
        .text()
        .trim()
        .replace('FRANQUIA ', '')
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || null
    );
  }

  private extractHeadquarterState($: cheerio.CheerioAPI): string | null {
    const lojaTab = this.getLojaTab($);
    const newState = lojaTab
      .find('p.title:contains("Sede")')
      .next()
      .text()
      .trim();

    return newState || null;
  }

  private extractStoreArea($: cheerio.CheerioAPI): number | null {
    const lojaTab = this.getLojaTab($);
    const areaText = lojaTab
      .find('p.title:contains("Área da loja")')
      .next()
      .text()
      .trim();

    return parseArea(areaText);
  }

  private extractTotalUnits($: cheerio.CheerioAPI): number | null {
    const unitsText = $('p:contains("Quantas unidades tem no Brasil?")')
      .next()
      .text();

    return unitsText ? parseInt(unitsText.replace('.', '')) : null;
  }

  private extractDescription($: cheerio.CheerioAPI): string | null {
    const description = $('h2:contains("Sobre a franquia")')
      .next()
      .text()
      .trim();

    return description || null;
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

  private extractLogoUrl($: cheerio.CheerioAPI): string | null {
    const logoUrl = $('div.logo-photo img').attr('data-src');
    return logoUrl || '';
  }

  private extractThumbnailUrl($: cheerio.CheerioAPI): string | null {
    const bannerUrl = $('img[class*="main-img lazyloading"]').attr('src');
    return bannerUrl || null;
  }

  private extractGalleryUrls($: cheerio.CheerioAPI): string | null {
    const galleryUrls: string[] = [];

    const carousel = $('div[class*="carousel-cell"]');

    let current = carousel.next();
    while (current.length) {
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

  /**
   * Extract investment range from the page
   * Returns both minimum and maximum investment values
   */
  private extractInvestmentRange($: cheerio.CheerioAPI): {
    minimum: number | null;
    maximum: number | null;
  } {
    const lojaTab = this.getLojaTab($);
    const investmentText = lojaTab
      .find('th:contains("Investimento total")')
      .next()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    return parseInvestmentRange(investmentText);
  }

  private extractSetupCapital($: cheerio.CheerioAPI): number | null {
    const lojaTab = this.getLojaTab($);
    const text = lojaTab
      .find('th:contains("Capital para instalação")')
      .next()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    return parseMonetaryValue(text);
  }

  private extractWorkingCapital($: cheerio.CheerioAPI): number | null {
    const lojaTab = this.getLojaTab($);
    const text = lojaTab
      .find('th:contains("Capital de giro")')
      .next()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    return parseMonetaryValue(text);
  }

  /**
   * Extract ROI range from the page
   * Returns both minimum and maximum ROI values in months
   */
  private extractROIRange($: cheerio.CheerioAPI): {
    minimum: number | null;
    maximum: number | null;
  } {
    const lojaTab = this.getLojaTab($);
    const roiText = lojaTab
      .find('p:contains("Retorno do investimento")')
      .next()
      .text()
      .trim();

    return parseROIRange(roiText);
  }

  private extractAverageMonthlyRevenue($: cheerio.CheerioAPI): number | null {
    const lojaTab = this.getLojaTab($);
    const text = lojaTab
      .find('p:contains("Faturamento médio mensal")')
      .next()
      .text()
      .trim();

    return parseMonetaryValue(text);
  }

  private extractFranchiseFee($: cheerio.CheerioAPI): number | null {
    const lojaTab = this.getLojaTab($);
    const text = lojaTab
      .find('th:contains("Taxa de franquia")')
      .next()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    return parseMonetaryValue(text);
  }

  private extractRoyalties($: cheerio.CheerioAPI): number | null {
    const lojaTab = this.getLojaTab($);

    const royRow = lojaTab
      .find('p.title:contains("ROYALTIES")')
      .closest('div.column-icon')
      .nextAll('div.row')
      .first();

    const royaltiesText = royRow
      .find('p.title:contains("Taxa")')
      .next('p.content')
      .text()
      .trim();

    return parsePercentage(royaltiesText);
  }

  private extractCalculationBaseRoyaltie($: cheerio.CheerioAPI): string | null {
    const lojaTab = this.getLojaTab($);

    const royRow = lojaTab
      .find('p.title:contains("ROYALTIES")')
      .closest('div.column-icon')
      .nextAll('div.row')
      .first();

    const base = royRow
      .find('p.title:contains("Base de cálculo")')
      .next('p.content')
      .text()
      .trim();

    return base || null;
  }

  private extractAdvertisingFee($: cheerio.CheerioAPI): number | null {
    const lojaTab = this.getLojaTab($);

    const adRow = lojaTab
      .find('p.title:contains("Taxa de propaganda")')
      .closest('div.column-icon')
      .nextAll('div.row')
      .first();

    const feeText = adRow
      .find('p.title:contains("Taxa")')
      .next('p.content')
      .text()
      .trim();

    return parsePercentage(feeText);
  }

  private extractCalculationBaseAdFee($: cheerio.CheerioAPI): string | null {
    const lojaTab = this.getLojaTab($);

    const adRow = lojaTab
      .find('p.title:contains("Taxa de propaganda")')
      .closest('div.column-icon')
      .nextAll('div.row')
      .first();

    const base = adRow
      .find('p.title:contains("Base de cálculo")')
      .next('p.content')
      .text()
      .trim();

    return base || null;
  }

  private extractWebsite($: cheerio.CheerioAPI): string | null {
    const siteLink = $('a:contains("Clique aqui para ver o site")').attr(
      'href',
    );

    if (!siteLink) return null;

    const cleanedLink = this.removeUtmParameters(siteLink);

    return cleanedLink;
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

  //IA

  private fullDescription($: cheerio.CheerioAPI): string | null {
    const descriptionFirstSection = $('h1:contains("FRANQUIA")');
    const descriptionFinalSection = $(
      'p:contains("Comunicado Importante ABF")',
    );

    const fullDescriptionText = descriptionFirstSection
      .nextUntil(descriptionFinalSection)
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    return fullDescriptionText || null;
  }

  private async extractAiFields($: cheerio.CheerioAPI): Promise<AiFields> {
    try {
      const fullDescription = this.fullDescription($);

      const prompt = `Analise a descrição da franquia abaixo e retorne APENAS um objeto JSON válido com as seguintes chaves. Não inclua texto explicativo, não use markdown, retorne diretamente o JSON começando com { e terminando com }.

Chaves obrigatórias:
- businessType (string ou null)
- segment (string ou null)
- subsegment (string ou null)
- brandFoundationYear (string ou null)
- franchiseStartYear (string ou null)
- abfSince (string ou null)
- isAbfAssociated (boolean)

Exemplo de formato esperado:
{"businessType":"Comercio varejista","segment":"Alimentos","subsegment":"Doces","brandFoundationYear":"2025","franchiseStartYear":"2025","abfSince":"2025","isAbfAssociated":true}

Descrição da franquia:
${fullDescription}

Retorne APENAS o JSON, sem texto adicional.`;

      const response = await this.llmService.ask(prompt);
      this.logger.log(`Resposta IA: ${response}`);

      // Função para extrair JSON de uma string que pode conter texto adicional
      const extractJson = (text: string): string => {
        // Remove markdown code blocks
        const cleaned = text
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();

        // Tenta encontrar JSON entre chaves {}
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return jsonMatch[0];
        }

        // Se não encontrou, tenta parse direto (pode já ser JSON puro)
        return cleaned;
      };

      const jsonString = extractJson(response);

      try {
        const jsonResponse = JSON.parse(jsonString) as AiFields;
        return jsonResponse;
      } catch (parseError) {
        this.logger.error(
          `Erro ao fazer parse do JSON. Resposta recebida: ${response.substring(0, 200)}`,
        );
        throw parseError;
      }
    } catch (error) {
      this.logger.error(`Erro ao extrair campos IA:`, error);
      return {
        businessType: null,
        segment: null,
        subsegment: null,
        brandFoundationYear: null,
        franchiseStartYear: null,
        abfSince: null,
        isAbfAssociated: false,
      };
    }
  }
}
