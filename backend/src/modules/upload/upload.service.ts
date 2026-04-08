import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from './dto/multer';
import { MulterFileType } from './schemas/upload.schema';

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Configuração para ambiente local
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
    this.baseUrl =
      this.configService.get('BASE_URL') ||
      process.env.API_URL ||
      'https://apifranchise.mindconsulting.com.br';

    // Criar diretório de upload se não existir
    void this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'news'), { recursive: true });
    }
  }

  /**
   * Valida se o arquivo é uma imagem válida
   */
  private validateImageFile(file: MulterFileType): void {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Apenas arquivos JPEG, PNG, GIF e WebP são permitidos',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException('O arquivo deve ter no máximo 5MB');
    }
  }

  /**
   * Gera um nome único para o arquivo
   */
  private generateFileName(originalName: string): string {
    const extension = path.extname(originalName);
    const uniqueName = `${uuidv4()}${extension}`;
    return uniqueName;
  }

  /**
   * Upload de arquivo para armazenamento local
   */
  async uploadFile(file: MulterFile, folder: string = 'news'): Promise<string> {
    try {
      // Validar arquivo
      this.validateImageFile(file);

      // Gerar nome único
      const fileName = this.generateFileName(file.originalname);
      const folderPath = path.join(this.uploadPath, folder);
      const filePath = path.join(folderPath, fileName);

      // Garantir que a pasta existe
      await fs.mkdir(folderPath, { recursive: true });

      // Salvar arquivo
      await fs.writeFile(filePath, file.buffer);

      // Retornar URL pública
      const publicUrl = `${this.baseUrl}/uploads/${folder}/${fileName}`;
      return publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Tipar o erro corretamente
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no upload:', errorMessage);
      throw new BadRequestException('Erro ao fazer upload do arquivo');
    }
  }

  /**
   * Deletar arquivo do armazenamento local
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extrair caminho do arquivo da URL
      const urlPath = new URL(fileUrl).pathname;
      const filePath = path.join(process.cwd(), urlPath);

      // Verificar se arquivo existe
      await fs.access(filePath);

      // Deletar arquivo
      await fs.unlink(filePath);
    } catch (error) {
      // Não lançar erro se arquivo não existir - apenas log
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      console.warn(
        `Arquivo não encontrado para deletar: ${fileUrl}. Erro: ${errorMessage}`,
      );
    }
  }
}
