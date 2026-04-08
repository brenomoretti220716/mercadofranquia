import { Injectable, Logger } from '@nestjs/common';
import { DownloadService } from '../../download/download.service';
import { CreateFranchiseType } from '../schemas/create-franchise.schema';
import { UpdateFranchiseType } from '../schemas/update-franchise.schema';

interface ImageDownload {
  recordIndex: number;
  field: 'logoUrl' | 'thumbnailUrl' | 'galleryUrls';
  url: string;
  extraInfo?: {
    galleryIndex?: number; // Para identificar qual imagem da galeria
  };
}

interface ProcessImageResult<T> {
  processedRecords: T[];
  downloadErrors: Array<{
    recordIndex: number;
    field: string;
    url: string;
    error: string;
  }>;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private readonly downloadService: DownloadService) {}

  // ✅ MÉTODO PRIVADO - Verificar se é URL válida (COPIADO DO ORIGINAL)
  private isValidUrl(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  // ✅ MÉTODO PRIVADO - Parse das URLs da galeria
  private parseGalleryUrls(galleryUrls: string): string[] {
    if (!galleryUrls || typeof galleryUrls !== 'string') return [];

    try {
      const parsed: unknown = JSON.parse(galleryUrls);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (url: unknown): url is string =>
            typeof url === 'string' && this.isValidUrl(url),
        );
      }
      return [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.warn(`Erro ao fazer parse de galleryUrls: ${errorMessage}`);
      return [];
    }
  }

  // ✅ MÉTODO PRINCIPAL - Processar URLs de imagens (ADAPTADO DO ORIGINAL)
  async processImageUrls<T extends CreateFranchiseType | UpdateFranchiseType>(
    records: T[],
    folder: string = 'franchises',
  ): Promise<ProcessImageResult<T>> {
    const processedRecords = [...records] as T[];
    const downloadErrors: Array<{
      recordIndex: number;
      field: string;
      url: string;
      error: string;
    }> = [];

    // Coletar todas as URLs de imagens para download em lote
    const imageDownloads: ImageDownload[] = [];

    // Identificar URLs que precisam ser baixadas
    records.forEach((record, index) => {
      if (record.logoUrl && this.isValidUrl(record.logoUrl)) {
        imageDownloads.push({
          recordIndex: index,
          field: 'logoUrl',
          url: record.logoUrl,
        });
      }

      if (record.thumbnailUrl && this.isValidUrl(record.thumbnailUrl)) {
        imageDownloads.push({
          recordIndex: index,
          field: 'thumbnailUrl',
          url: record.thumbnailUrl,
        });
      }

      // Processar galleryUrls
      if (record.galleryUrls) {
        const galleryUrlsArray = this.parseGalleryUrls(record.galleryUrls);
        galleryUrlsArray.forEach((url, galleryIndex) => {
          imageDownloads.push({
            recordIndex: index,
            field: 'galleryUrls',
            url: url,
            extraInfo: {
              galleryIndex: galleryIndex,
            },
          });
        });
      }
    });

    if (imageDownloads.length === 0) {
      this.logger.log('Nenhuma URL de imagem encontrada para download');
      return { processedRecords, downloadErrors };
    }

    this.logger.log(`Iniciando download de ${imageDownloads.length} imagens`);

    // Processar downloads em lotes para evitar sobrecarga
    const BATCH_SIZE = 5; // Processar 5 imagens por vez
    const batches: Array<ImageDownload[]> = [];

    for (let i = 0; i < imageDownloads.length; i += BATCH_SIZE) {
      batches.push(imageDownloads.slice(i, i + BATCH_SIZE));
    }

    // Manter track das galleryUrls atualizadas por record
    const updatedGalleryUrls: Map<number, string[]> = new Map();

    // Inicializar o mapa com as galleryUrls existentes
    records.forEach((record, index) => {
      if (record.galleryUrls) {
        const existingUrls = this.parseGalleryUrls(record.galleryUrls);
        updatedGalleryUrls.set(index, [...existingUrls]);
      }
    });

    // Processar cada lote
    for (const [batchIndex, batch] of batches.entries()) {
      this.logger.log(
        `Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} imagens)`,
      );

      const batchPromises = batch.map(async (download) => {
        try {
          const localUrl = await this.downloadService.downloadImage(
            download.url,
            folder,
          );

          // Atualizar o record com a URL local
          if (
            download.field === 'galleryUrls' &&
            download.extraInfo?.galleryIndex !== undefined
          ) {
            // Para galleryUrls, atualizar o array específico
            const currentGalleryUrls =
              updatedGalleryUrls.get(download.recordIndex) || [];
            currentGalleryUrls[download.extraInfo.galleryIndex] = localUrl;
            updatedGalleryUrls.set(download.recordIndex, currentGalleryUrls);
          } else {
            // Para logoUrl e thumbnailUrl, atualizar diretamente
            const record = processedRecords[download.recordIndex] as Record<
              string,
              unknown
            >;
            record[download.field] = localUrl;
          }

          this.logger.debug(
            `✅ Download concluído: ${download.field} para record ${
              download.recordIndex + 1
            }${
              download.extraInfo?.galleryIndex !== undefined
                ? ` (gallery index ${download.extraInfo.galleryIndex})`
                : ''
            }`,
          );

          return { success: true, download };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erro desconhecido';

          downloadErrors.push({
            recordIndex: download.recordIndex,
            field: download.field,
            url: download.url,
            error: errorMessage,
          });

          this.logger.warn(
            `❌ Falha no download: ${download.field} para record ${
              download.recordIndex + 1
            }${
              download.extraInfo?.galleryIndex !== undefined
                ? ` (gallery index ${download.extraInfo.galleryIndex})`
                : ''
            } - ${errorMessage}`,
          );

          if (
            download.field === 'galleryUrls' &&
            download.extraInfo?.galleryIndex !== undefined
          ) {
            // Para galleryUrls, manter a URL original em caso de erro
            // (não fazemos nada aqui, mantém a URL original)
          } else {
            // Para logoUrl e thumbnailUrl, limpar em caso de erro
            const record = processedRecords[download.recordIndex] as Record<
              string,
              unknown
            >;
            record[download.field] = '';
          }

          return { success: false, download };
        }
      });

      // Aguardar conclusão do lote atual
      await Promise.allSettled(batchPromises);

      // Pequena pausa entre lotes para não sobrecarregar
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Atualizar os records com as galleryUrls processadas
    updatedGalleryUrls.forEach((urls, recordIndex) => {
      const record = processedRecords[recordIndex] as Record<string, any>;
      record.galleryUrls = JSON.stringify(urls);
    });

    const successfulDownloads = imageDownloads.length - downloadErrors.length;
    this.logger.log(
      `Download concluído: ${successfulDownloads}/${imageDownloads.length} imagens baixadas com sucesso`,
    );

    return { processedRecords, downloadErrors };
  }
}
