import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface SitemapLink {
  url: string;
  lastmod: string;
  action: 'create' | 'update';
}

interface FranchisePage {
  url: string;
  lastmod: string;
  action: 'create' | 'update';
  pageType:
    | 'franchise-new'
    | 'franchise-old'
    | 'not-franchise'
    | 'redirected'
    | 'error';
  franchiseName?: string;
  hasModal?: boolean;
  hasInvestmentInfo?: boolean;
  hasDetailedTabs?: boolean;
  finalUrl?: string;
  redirected?: boolean;
}

@Injectable()
export class SitemapParserService {
  private readonly logger = new Logger(SitemapParserService.name);

  async parseSitemap(): Promise<FranchisePage[]> {
    this.logger.log('Iniciando análise do sitemap...');

    // Lê o arquivo JSON com os links
    const filePath = join(
      process.cwd(),
      'data',
      'sitemaps',
      'merge-sitemap.json',
    );
    const fileContent = await readFile(filePath, { encoding: 'utf8' });
    const links: SitemapLink[] = JSON.parse(fileContent) as SitemapLink[];

    this.logger.log(`Total de links encontrados: ${links.length}`);

    // Filtra apenas URLs que podem ser de franquia
    const potentialFranchiseLinks = links.filter(
      (link) =>
        link?.url &&
        typeof link.url === 'string' &&
        link.url.includes('/franquia-') &&
        !link.url.includes('/blog/') &&
        !link.url.includes('/noticia-'),
    );

    this.logger.log(
      `Links potenciais de franquia: ${potentialFranchiseLinks.length}`,
    );

    // Processa cada link em pool de concorrência limitada
    const results: FranchisePage[] = [];
    const CONCURRENCY = 20;

    for (
      let start = 0;
      start < potentialFranchiseLinks.length;
      start += CONCURRENCY
    ) {
      const slice = potentialFranchiseLinks.slice(start, start + CONCURRENCY);

      await Promise.allSettled(
        slice.map(async (link) => {
          try {
            const pageAnalysis = await this.detectPageType(link.url);
            results.push({
              url: link.url,
              lastmod: link.lastmod,
              action: link.action,
              ...pageAnalysis,
            });
          } catch (error) {
            this.logger.error(`Erro ao processar ${link.url}:`, error);
            results.push({
              url: link.url,
              lastmod: link.lastmod,
              action: link.action,
              pageType: 'error',
            });
          }
        }),
      );

      // Pausa curta entre lotes para não sobrecarregar o servidor
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.logger.log(`Análise concluída. Resultados brutos: ${results.length}`);

    // Filtra apenas franquias válidas (remove errors e redirected)
    const validFranchises = results.filter(
      (result) =>
        result.pageType !== 'error' && result.pageType !== 'redirected',
    );

    this.logger.log(`Franquias válidas: ${validFranchises.length}`);

    // Salva os resultados
    await this.saveResults(validFranchises);

    return validFranchises;
  }

  private async detectPageType(
    url: string,
  ): Promise<Omit<FranchisePage, 'url' | 'lastmod' | 'action'>> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FranchiseBot/1.0',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(100000),
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const finalUrl = response.url;
      const wasRedirected = finalUrl !== url;

      if (wasRedirected && this.isListingPage(html, finalUrl)) {
        return {
          pageType: 'redirected',
          finalUrl,
          redirected: true,
        };
      }

      if (!this.isFranchisePage(html)) {
        return {
          pageType: 'not-franchise',
          finalUrl: wasRedirected ? finalUrl : undefined,
          redirected: wasRedirected,
        };
      }

      const franchiseName = this.extractFranchiseName(html);

      const isNewModel = this.isNewModel(html);

      let pageType: FranchisePage['pageType'];

      if (isNewModel) {
        pageType = 'franchise-new';
      } else {
        pageType = 'franchise-old';
      }

      return {
        pageType,
        franchiseName,
        hasModal: isNewModel,
        hasInvestmentInfo:
          html.includes('Investimento total') ||
          html.includes('Taxa de franquia'),
        hasDetailedTabs: isNewModel,
        finalUrl: wasRedirected ? finalUrl : undefined,
        redirected: wasRedirected,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao analisar página: ${errorMessage}`);
    }
  }

  private isListingPage(html: string, finalUrl: string): boolean {
    const listingIndicators = [
      // URLs típicas de listagem
      /\/franquias-de-[a-z-]+\//i,
      /\/guia-de-franquias/i,
      /\/franquias\?/i,

      // Títulos de páginas de listagem
      /Franquias de [A-Z]/i,
      /Guia de Franquias/i,
      /<h1[^>]*>.*?Franquias de.*?<\/h1>/i,

      // Elementos típicos de listagem
      /Ordenar por/i,
      /Encontre aqui as melhores franquias/i,
      /Filtrar por/i,

      // Múltiplos cards de franquias
      /class="card.*?franchise.*?"/gi,
      /Investimento Total \(R\$\)/gi,

      // Controles de busca/filtro
      /ícone investimento/i,
      /ícone alvo/i,
      /BUSCAR/i,

      // Breadcrumb ou navegação
      /Home.*?Franquias.*?Alimentação/i,
    ];

    // Verifica URL
    if (
      listingIndicators.slice(0, 3).some((pattern) => pattern.test(finalUrl))
    ) {
      return true;
    }

    // Conta quantos indicadores estão presentes no HTML
    const matchCount = listingIndicators
      .slice(3)
      .filter((pattern) => pattern.test(html)).length;

    // Se tem 3 ou mais indicadores, é provavelmente uma página de listagem
    return matchCount >= 3;
  }

  private isFranchisePage(html: string): boolean {
    // Verifica indicadores de que é uma página de franquia
    const indicators = [
      /FRANQUIA\s+[A-Z\s]+/i,
      /Taxa de franquia/i,
      /Investimento total/i,
      /Retorno do investimento/i,
      /ABF.*Associação Brasileira de Franchising/i,
      /Sede/i,
      /Número total de unidades/i,
      /franquia-[a-z-]+/i, // URL pattern
    ];

    return indicators.some((pattern) => pattern.test(html));
  }

  private extractFranchiseName(html: string): string {
    // Tenta extrair o nome da franquia do título
    const titleMatch = html.match(/<title[^>]*>.*?FRANQUIA\s+([^<|]+)/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Tenta extrair do h1
    const h1Match = html.match(/<h1[^>]*>.*?FRANQUIA\s+([^<]+)/i);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Tenta extrair do padrão # FRANQUIA NOME
    const headerMatch = html.match(/# FRANQUIA\s+([A-Z\s]+)/i);
    if (headerMatch) {
      return headerMatch[1].trim();
    }

    // Extrai da URL como fallback
    const urlMatch = html.match(/franquia-([^/]+)/);
    if (urlMatch) {
      return urlMatch[1].replace(/-/g, ' ').toUpperCase();
    }

    return 'Nome não identificado';
  }

  private isNewModel(html: string): boolean {
    // Detecta modelo novo pela presença do modal específico

    const modalMatch = html.match(
      /<div[^>]*id=["']first-container-form["'][^>]*>/i,
    );
    if (!modalMatch) {
      return false;
    }

    return true;
  }

  private async saveResults(results: FranchisePage[]): Promise<void> {
    const filePath = join(
      process.cwd(),
      'data',
      'sitemaps',
      'franchise-analysis.json',
    );

    // Cria um resumo dos resultados (apenas franquias válidas)
    const summary = {
      total: results.length,
      byType: {
        'franchise-new': results.filter((r) => r.pageType === 'franchise-new')
          .length,
        'franchise-old': results.filter((r) => r.pageType === 'franchise-old')
          .length,
        'not-franchise': results.filter((r) => r.pageType === 'not-franchise')
          .length,
      },
      timestamp: new Date().toISOString(),
      results,
    };

    const { writeFile } = await import('fs/promises');
    await writeFile(filePath, JSON.stringify(summary, null, 2), {
      encoding: 'utf8',
    });

    this.logger.log(`Resultados salvos em: ${filePath}`);
    this.logger.log(`Resumo: ${JSON.stringify(summary.byType, null, 2)}`);
  }

  async detectSinglePageType(
    url: string,
  ): Promise<'franchise-new' | 'franchise-old'> {
    try {
      const analysis = await this.detectPageType(url);
      if (analysis.pageType === 'franchise-new') {
        return 'franchise-new';
      }
      if (analysis.pageType === 'franchise-old') {
        return 'franchise-old';
      }
      return 'franchise-old';
    } catch {
      return 'franchise-old';
    }
  }
}
