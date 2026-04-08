import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DownloadService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
    this.baseUrl = this.configService.get('API_URL') || '';

    void this.ensureDownloadDirectory();
  }

  private async ensureDownloadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'downloads'), {
        recursive: true,
      });
    }
  }

  /**
   * Valida se a URL é válida
   */
  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new BadRequestException(
          'Apenas URLs HTTP e HTTPS são permitidas',
        );
      }
    } catch (error) {
      console.error('Error validating URL:', error);
      throw new BadRequestException('URL inválida');
    }
  }

  /**
   * Valida se o arquivo baixado é uma imagem válida
   */
  private validateImageBuffer(buffer: Buffer, contentType?: string): void {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (contentType && !allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        'Apenas arquivos JPEG, PNG, GIF e WebP são permitidos',
      );
    }

    if (buffer.length > maxSize) {
      throw new BadRequestException('O arquivo deve ter no máximo 5MB');
    }

    // Verificar assinatura do arquivo (magic numbers) para imagens binárias
    const signatures = {
      jpeg: [0xff, 0xd8, 0xff],
      png: [0x89, 0x50, 0x4e, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
    };

    // SVG: validação textual
    const isSvg =
      contentType === 'image/svg+xml' ||
      buffer.slice(0, 200).toString('utf8').includes('<svg');

    const isValidImage =
      isSvg ||
      Object.values(signatures).some((signature) =>
        signature.every((byte, index) => buffer[index] === byte),
      );

    if (!isValidImage) {
      throw new BadRequestException('Arquivo não é uma imagem válida');
    }
  }

  /**
   * Gera um nome único para o arquivo baseado na URL
   */
  private generateFileName(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const originalName = path.basename(parsedUrl.pathname);
      const extension = path.extname(originalName) || '.jpg'; // default para .jpg se não tiver extensão
      const uniqueName = `${uuidv4()}${extension}`;
      return uniqueName;
    } catch {
      return `${uuidv4()}.jpg`;
    }
  }

  /**
   * Faz o download do arquivo da URL
   */
  private async downloadFromUrl(
    url: string,
  ): Promise<{ buffer: Buffer; contentType?: string }> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;

      const request = client.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Seguir redirecionamentos
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.downloadFromUrl(redirectUrl).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(
            new BadRequestException(
              `Erro ao baixar arquivo: ${response.statusCode}`,
            ),
          );
          return;
        }

        const chunks: Buffer[] = [];
        const contentType = response.headers['content-type'];

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ buffer, contentType });
        });

        response.on('error', (error) => {
          reject(
            new BadRequestException(`Erro ao baixar arquivo: ${error.message}`),
          );
        });
      });

      request.on('error', (error) => {
        reject(new BadRequestException(`Erro na requisição: ${error.message}`));
      });

      // Timeout de 30 segundos
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new BadRequestException('Timeout ao baixar arquivo'));
      });
    });
  }

  /**
   * Download de imagem a partir de URL e salva localmente
   */
  async downloadImage(
    imageUrl: string,
    folder: string = 'downloads',
  ): Promise<string> {
    try {
      // Validar URL
      this.validateUrl(imageUrl);

      // Fazer download
      const { buffer, contentType } = await this.downloadFromUrl(imageUrl);

      // Validar imagem
      this.validateImageBuffer(buffer, contentType);

      // Gerar nome único
      const fileName = this.generateFileName(imageUrl);
      const folderPath = path.join(this.uploadPath, folder);
      const filePath = path.join(folderPath, fileName);

      // Garantir que a pasta existe
      await fs.mkdir(folderPath, { recursive: true });

      await fs.writeFile(filePath, buffer);

      const publicUrl = `${this.baseUrl}/uploads/${folder}/${fileName}`;
      return publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no download:', errorMessage);
      throw new BadRequestException('Erro ao fazer download da imagem');
    }
  }

  /**
   * Download múltiplas imagens
   */
  async downloadMultipleImages(
    imageUrls: string[],
    folder: string = 'downloads',
  ): Promise<string[]> {
    const downloadPromises = imageUrls.map((url) =>
      this.downloadImage(url, folder),
    );
    return Promise.all(downloadPromises);
  }

  /**
   * Download múltiplas imagens com tratamento de erros individuais
   */
  async downloadMultipleImagesWithErrorHandling(
    imageUrls: string[],
    folder: string = 'downloads',
  ): Promise<
    Array<{ url: string; success: boolean; result?: string; error?: string }>
  > {
    const downloadPromises = imageUrls.map(async (url) => {
      try {
        const result = await this.downloadImage(url, folder);
        return { url, success: true, result };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        return { url, success: false, error: errorMessage };
      }
    });

    return Promise.all(downloadPromises);
  }

  /**
   * Verifica se uma URL é uma imagem válida sem fazer download
   */
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      this.validateUrl(url);

      return new Promise((resolve) => {
        const client = url.startsWith('https:') ? https : http;

        const request = client.request(url, { method: 'HEAD' }, (response) => {
          const contentType = response.headers['content-type'];
          const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
          ];

          resolve(
            response.statusCode === 200 &&
              contentType !== undefined &&
              allowedTypes.some((type) => contentType.includes(type)),
          );
        });

        request.on('error', () => resolve(false));
        request.setTimeout(10000, () => {
          request.destroy();
          resolve(false);
        });
        request.end();
      });
    } catch {
      return false;
    }
  }

  /**
   * Obter informações da imagem remota sem fazer download
   */
  async getRemoteImageInfo(url: string): Promise<{
    isValid: boolean;
    contentType?: string;
    contentLength?: number;
  }> {
    try {
      this.validateUrl(url);

      return new Promise((resolve) => {
        const client = url.startsWith('https:') ? https : http;

        const request = client.request(url, { method: 'HEAD' }, (response) => {
          const contentType = response.headers['content-type'];
          const contentLength = response.headers['content-length'];

          resolve({
            isValid: response.statusCode === 200,
            contentType,
            contentLength: contentLength
              ? parseInt(contentLength, 10)
              : undefined,
          });
        });

        request.on('error', () => resolve({ isValid: false }));
        request.setTimeout(10000, () => {
          request.destroy();
          resolve({ isValid: false });
        });

        request.end();
      });
    } catch {
      return { isValid: false };
    }
  }

  async deleteImages(urls: string[]): Promise<void> {
    const filePaths = urls.map((url) => {
      const parsedUrl = new URL(url);

      // Remover '/uploads' do início do pathname se existir para evitar duplicação
      let pathname = parsedUrl.pathname;
      if (pathname.startsWith('/uploads/')) {
        pathname = pathname.substring('/uploads'.length);
      }

      return path.join(this.uploadPath, pathname);
    });

    await Promise.allSettled(
      filePaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error: unknown) {
          const fsError = error as NodeJS.ErrnoException;
          // ENOENT = file not found — skip gracefully, it's already gone
          if (fsError.code === 'ENOENT') {
            console.warn(
              `Image file not found (already deleted or never existed): ${filePath}`,
            );
            return;
          }
          // Re-throw unexpected errors (permissions, etc.)
          throw error;
        }
      }),
    );
  }
}
