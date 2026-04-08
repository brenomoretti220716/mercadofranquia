import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from 'src/modules/database/prisma.service';
import { DOMParser as XmldomDOMParser } from '@xmldom/xmldom';

interface XmlElement {
  getElementsByTagName: (tag: string) => ArrayLike<XmlElement>;
  textContent?: string | null;
}

type DomParserLike = {
  parseFromString: (xml: string, mime: string) => unknown;
};

@Injectable()
export class SitemapReaderService {
  private readonly logger = new Logger(SitemapReaderService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async readSitemap(url: string): Promise<string> {
    this.logger.log(`Lendo sitemap: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'FranchiseBot/1.0',
          Accept: 'application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(800000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlContent = await response.text();

      this.logger.log(
        `Sitemap lido com sucesso. Tamanho: ${xmlContent.length} caracteres`,
      );

      return xmlContent;
    } catch (error) {
      this.logger.error(`Erro ao ler sitemap ${url}:`, error);
      throw new Error(`Não foi possível ler o sitemap de ${url}`);
    }
  }

  async readMultipleSitemaps(
    urls: string[],
  ): Promise<Array<{ url: string; content: string; error?: string }>> {
    this.logger.log(`Lendo ${urls.length} sitemaps em paralelo`);

    // Baixa todos os XMLs
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const content = await this.readSitemap(url);
          return { url, content };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erro desconhecido';
          this.logger.error(`Erro ao ler sitemap ${url}:`, errorMessage);
          return { url, content: '', error: errorMessage };
        }
      }),
    );

    if (results.some((r) => r.error)) {
      this.logger.error('Erro ao ler alguns sitemaps');
      return [];
    }

    // Filtra apenas os XMLs baixados com sucesso
    const xmls = results.filter((r) => r.content).map((r) => r.content);

    const mergedXml = this.mergeSitemapXmls(xmls);

    const urlElements = this.sitemapParser(mergedXml);

    const urlData = await Promise.all(
      urlElements.map(async (urlElement) => {
        const locNode = urlElement.getElementsByTagName('loc')[0];
        const lastmodNode = urlElement.getElementsByTagName('lastmod')[0];
        const url = locNode?.textContent;
        const correctedUrl = this.convertToNewUrlFormat(url ?? '');
        const lastmod = lastmodNode?.textContent;

        if (!correctedUrl || !lastmod) {
          return null;
        }

        // ✅ BUSCA MELHORADA: Primeiro busca por scrapedWebsite (preciso)
        // IMPORTANTE: Esta busca pode não encontrar franquias com ownerId se o scrapedWebsite
        // estiver vazio/null ou diferente. Isso pode causar duplicatas.
        const existingFranchise = await this.prismaService.franchise.findFirst({
          where: {
            scrapedWebsite: correctedUrl,
          },
          select: {
            id: true,
            name: true,
            ownerId: true,
            lastScrapedAt: true,
            scrapedWebsite: true,
          },
        });

        // ✅ VERIFICAÇÃO ADICIONAL: Se não encontrou por scrapedWebsite, verificar se há
        // franquias com ownerId que podem ter scrapedWebsite vazio/null/diferente
        // Isso previne criação de duplicatas quando a franquia tem dono mas scrapedWebsite inconsistente
        if (!existingFranchise) {
          // Tentar extrair o nome da franquia da URL para verificar se existe com ownerId
          // Exemplo: https://franquias.portaldofranchising.com.br/franquia/nome-da-franquia
          const urlParts = correctedUrl.split('/');
          const potentialFranchiseName = urlParts[urlParts.length - 1];

          // Se conseguimos extrair um nome da URL, verificar se há franquias com ownerId
          // que podem ser a mesma (isso é uma heurística, mas ajuda a prevenir duplicatas críticas)
          if (potentialFranchiseName && potentialFranchiseName.length > 3) {
            const franchiseWithOwner = await this.prismaService.franchise.findFirst({
              where: {
                ownerId: { not: null },
                // Note: MySQL não suporta mode: 'insensitive', então removemos para compatibilidade
                // A busca será case-sensitive, mas isso é aceitável como heurística preventiva
                name: {
                  contains: potentialFranchiseName,
                },
              },
              select: {
                id: true,
                name: true,
                ownerId: true,
                scrapedWebsite: true,
              },
            });

            if (franchiseWithOwner) {
              this.logger.warn(
                `⚠️  Potential duplicate detected: URL ${correctedUrl} might match existing franchise with owner (ID: ${franchiseWithOwner.id}, Name: ${franchiseWithOwner.name}, Owner: ${franchiseWithOwner.ownerId}). Current scrapedWebsite: ${franchiseWithOwner.scrapedWebsite || 'NULL'}. Skipping to prevent duplication.`,
              );
              return null;
            }
          }

          // Não encontrou nenhuma franquia existente, pode criar
          return {
            url: correctedUrl,
            lastmod,
            action: 'create',
          };
        }

        // ✅ FRANQUIA EXISTENTE ENCONTRADA: Verificar se tem ownerId
        if (existingFranchise.ownerId) {
          this.logger.debug(
            `Ignorando ${correctedUrl} porque já possui owner (${existingFranchise.ownerId}, ID: ${existingFranchise.id})`,
          );
          return null;
        }

        if (!existingFranchise.lastScrapedAt) {
          this.logger.debug(
            `Ignorando ${correctedUrl} porque não possui lastScrapedAt registrado`,
          );
          return null;
        }

        if (new Date(lastmod) > existingFranchise.lastScrapedAt) {
          return {
            url: correctedUrl,
            lastmod,
            action: 'update',
          };
        }

        return null;
      }),
    );

    const franchisesToProcess = urlData.filter((data) => data !== null);

    const jsonData = JSON.stringify(franchisesToProcess, null, 2);

    // Salva o XML combinado
    const dirPath = join(process.cwd(), 'data', 'sitemaps');
    await mkdir(dirPath, { recursive: true }); // Garante que o diretório existe

    const filePath = join(dirPath, 'merge-sitemap.json');
    await writeFile(filePath, jsonData, { encoding: 'utf-8' });

    this.logger.log(`Sitemap combinado salvo em: ${filePath}`);

    return results;
  }

  private mergeSitemapXmls(xmls: string[]): string {
    // Extrai o conteúdo entre <urlset>...</urlset> de cada XML
    const urlBlocks = xmls.map((xml) => {
      const match = xml.match(/<urlset[^>]*>([\s\S]*?)<\/urlset>/);
      return match ? match[1].trim() : '';
    });

    // Junta todos os blocos <url>...</url>
    const mergedContent = urlBlocks.join('\n');

    // Monta o novo XML
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${mergedContent}\n</urlset>`;
  }

  private isElement(value: unknown): value is XmlElement {
    return (
      typeof value === 'object' &&
      value !== null &&
      'getElementsByTagName' in value &&
      typeof (value as { getElementsByTagName?: unknown })
        .getElementsByTagName === 'function'
    );
  }

  private isDocumentLike(
    value: unknown,
  ): value is { getElementsByTagName: (tag: string) => ArrayLike<unknown> } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'getElementsByTagName' in value &&
      typeof (value as { getElementsByTagName?: unknown })
        .getElementsByTagName === 'function'
    );
  }

  private createDomParser(): DomParserLike {
    const ParserCtor = XmldomDOMParser as unknown;
    if (typeof ParserCtor !== 'function') {
      throw new Error('DOMParser is not available');
    }
    const Ctor = ParserCtor as new () => DomParserLike;
    return new Ctor();
  }

  private sitemapParser(xml: string): Array<XmlElement> {
    const parser = this.createDomParser();

    const doc = parser.parseFromString(xml, 'application/xml');
    if (!this.isDocumentLike(doc)) {
      return [];
    }

    const nodeList = doc.getElementsByTagName('url');
    const candidates = Array.from(nodeList);
    const elements = candidates.filter((n): n is XmlElement =>
      this.isElement(n),
    );

    return elements;
  }

  private convertToNewUrlFormat(url: string): string {
    if (url.includes('www.portaldofranchising.com.br')) {
      return url.replace(
        'https://www.portaldofranchising.com.br',
        'https://franquias.portaldofranchising.com.br',
      );
    }
    return url;
  }
}
