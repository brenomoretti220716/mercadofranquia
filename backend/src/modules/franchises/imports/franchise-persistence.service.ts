import { Injectable, Logger } from '@nestjs/common';
import { Franchise } from '@prisma/client';
import { DownloadService } from 'src/modules/download/download.service';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateFranchiseType,
  ImportResultType,
} from '../schemas/create-franchise.schema';
import { UpdateFranchiseType } from '../schemas/update-franchise.schema';

@Injectable()
export class FranchisePersistenceService {
  private readonly logger = new Logger(FranchisePersistenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly downloadService: DownloadService,
  ) {}

  // Salvar múltiplas franquias (ADAPTADO PARA ACEITAR AMBOS OS TIPOS)
  async saveRecords(validRecords: CreateFranchiseType[]): Promise<{
    success: number;
    errors: ImportResultType['errors'];
  }> {
    let success = 0;
    const errors: ImportResultType['errors'] = [];

    for (const [index, record] of validRecords.entries()) {
      try {
        await this.createFranchise(record);
        success++;
        this.logger.debug(`Saved franchise: ${record.name}`);
      } catch (error) {
        errors.push({
          row: index + 1,
          data: record,
          error: `Database error: ${(error as Error).message}`,
        });
        this.logger.warn(`Failed to save franchise: ${record.name}`, error);
      }
    }

    return { success, errors };
  }

  async updateSingleRecord(franchiseId: string, record: UpdateFranchiseType) {
    try {
      const updatedFranchise = await this.updateFranchise(franchiseId, record);
      this.logger.debug(`Updated franchise: ${franchiseId}`);
      return { success: true, franchise: updatedFranchise };
    } catch (error) {
      this.logger.warn(`Failed to update franchise: ${franchiseId}`, error);
      throw error;
    }
  }

  // ATUALIZAR FRANQUIA PELO scrapedWebsite
  async updateRecordByScrapedWebsite(
    scrapedWebsite: string,
    record: UpdateFranchiseType,
  ) {
    try {
      const existingFranchise = await this.prisma.franchise.findFirst({
        where: { scrapedWebsite },
        include: { contact: true },
      });

      if (!existingFranchise) {
        throw new Error(
          `Franchise with scrapedWebsite '${scrapedWebsite}' not found`,
        );
      }

      const { imageUrls } = this.getImagePaths(existingFranchise);

      await this.downloadService.deleteImages(imageUrls);

      const updatedFranchise = await this.updateFranchise(
        existingFranchise.id,
        record,
      );

      this.logger.debug(
        `Updated franchise by scrapedWebsite: ${scrapedWebsite} (ID: ${existingFranchise.id})`,
      );

      return { success: true, franchise: updatedFranchise };
    } catch (error) {
      this.logger.warn(
        `Failed to update franchise by scrapedWebsite: ${scrapedWebsite}`,
        error,
      );
      throw error;
    }
  }

  // - Criar franquia
  private async createFranchise(record: CreateFranchiseType) {
    // ✅ VERIFICAÇÃO DE DUPLICATAS: Prevenir criação de franquias com scrapedWebsite já existente
    if (record.scrapedWebsite) {
      const existingFranchise = await this.prisma.franchise.findFirst({
        where: {
          scrapedWebsite: record.scrapedWebsite,
        },
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      });

      if (existingFranchise) {
        // Se a franquia existente tem ownerId, não podemos criar duplicata
        if (existingFranchise.ownerId) {
          this.logger.warn(
            `Cannot create duplicate franchise: ${record.name} (scrapedWebsite: ${record.scrapedWebsite}) - Already exists with ownerId: ${existingFranchise.ownerId} (ID: ${existingFranchise.id})`,
          );
          throw new Error(
            `Franchise with scrapedWebsite '${record.scrapedWebsite}' already exists with owner (ID: ${existingFranchise.id}). Cannot create duplicate.`,
          );
        }

        // Se não tem ownerId, ainda não devemos criar duplicata - o scraping deveria fazer update
        this.logger.warn(
          `Duplicate scrapedWebsite detected: ${record.scrapedWebsite} (Existing: ${existingFranchise.id}, New: ${record.name}). This should be an update, not a create.`,
        );
        throw new Error(
          `Franchise with scrapedWebsite '${record.scrapedWebsite}' already exists (ID: ${existingFranchise.id}). Use update instead of create.`,
        );
      }
    }

    // Preparar dados para o Prisma
    const baseSlug = this.toSlug(record.name);
    const slug = await this.generateUniqueSlug(baseSlug);

    const franchiseData = {
      name: record.name,
      slug,
      description: record.description,

      // Investment Range (numeric only)
      minimumInvestment: record.minimumInvestment ?? null,
      maximumInvestment: record.maximumInvestment ?? null,

      // Capital (numeric only)
      setupCapital: record.setupCapital ?? null,
      workingCapital: record.workingCapital ?? null,

      // Store area (numeric only)
      storeArea: record.storeArea ?? null,
      totalUnits: record.totalUnits || null,
      totalUnitsInBrazil: record.totalUnitsInBrazil || null,

      // Fundação e datas
      brandFoundationYear: record.brandFoundationYear || null,
      franchiseStartYear: record.franchiseStartYear || null,
      abfSince: record.abfSince || null,

      // Outros campos
      isAbfAssociated: record.isAbfAssociated || null,

      // Localização
      headquarterState: record.headquarterState || null,
      headquarter: record.headquarter || null,

      // ROI Range (numeric only, in months)
      minimumReturnOnInvestment: record.minimumReturnOnInvestment ?? null,
      maximumReturnOnInvestment: record.maximumReturnOnInvestment ?? null,

      // Revenue and fees (numeric only)
      averageMonthlyRevenue: record.averageMonthlyRevenue ?? null,
      franchiseFee: record.franchiseFee ?? null,

      // Percentages (numeric only)
      royalties: record.royalties ?? null,
      advertisingFee: record.advertisingFee ?? null,

      // Calculation bases (keep as strings)
      calculationBaseRoyaltie: record.calculationBaseRoyaltie || null,
      calculationBaseAdFee: record.calculationBaseAdFee || null,

      // Mídia (URLs já processadas pelo download)
      logoUrl: record.logoUrl || null,
      thumbnailUrl: record.thumbnailUrl || null,
      galleryUrls: record.galleryUrls || null,
      videoUrl: record.videoUrl || null,

      // Outros
      businessType: record.businessType || '',
      segment: record.segment || '',
      subsegment: record.subsegment || '',

      // Data de último scraping
      lastScrapedAt: record.lastScrapedAt || null,
      scrapedWebsite: record.scrapedWebsite || null,
    };

    // Preparar dados de contato se existirem
    const hasContactInfo = record.phone || record.email || record.website;
    const contactData = hasContactInfo
      ? {
          phone: record.phone || '',
          email: record.email || '',
          website: record.website || '',
        }
      : undefined;

    // Criar no banco com transação para garantir consistência
    return this.prisma.franchise.create({
      data: {
        ...franchiseData,
        contact: contactData ? { create: contactData } : undefined,
      },
      include: {
        contact: true,
      },
    });
  }

  private toSlug(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(base: string): Promise<string> {
    let slug = base || 'franchise';
    let suffix = 2;

    // Try base slug, then slug-2, slug-3, ... until it is unique

    while (true) {
      const existing = await this.prisma.franchise.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  // Atualizar franquia
  private async updateFranchise(
    franchiseId: string,
    record: UpdateFranchiseType,
  ) {
    // 1. Verificar se a franquia existe
    const existingFranchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: { contact: true },
    });

    if (!existingFranchise) {
      throw new Error(`Franchise with ID ${franchiseId} not found`);
    }

    // 2. Preparar dados para atualização (apenas campos fornecidos)
    const franchiseUpdateData: Record<string, unknown> = {};

    // ✅ ADICIONAR LOG PARA DEBUG
    this.logger.debug(
      `Update record for franchise ${franchiseId}:`,
      JSON.stringify(record),
    );

    // Campos básicos
    if (record.name !== undefined) franchiseUpdateData.name = record.name;
    if (record.description !== undefined)
      franchiseUpdateData.description = record.description;

    // Investment Range (numeric only)
    if (record.minimumInvestment !== undefined)
      franchiseUpdateData.minimumInvestment = record.minimumInvestment ?? null;
    if (record.maximumInvestment !== undefined)
      franchiseUpdateData.maximumInvestment = record.maximumInvestment ?? null;

    // Capital (numeric only)
    if (record.setupCapital !== undefined)
      franchiseUpdateData.setupCapital = record.setupCapital ?? null;
    if (record.workingCapital !== undefined)
      franchiseUpdateData.workingCapital = record.workingCapital ?? null;

    // Store area (numeric only)
    if (record.storeArea !== undefined)
      franchiseUpdateData.storeArea = record.storeArea ?? null;
    if (record.totalUnits !== undefined)
      franchiseUpdateData.totalUnits = record.totalUnits || null;
    if (record.totalUnitsInBrazil !== undefined)
      franchiseUpdateData.totalUnitsInBrazil =
        record.totalUnitsInBrazil || null;

    // Fundação e datas
    if (record.brandFoundationYear !== undefined)
      franchiseUpdateData.brandFoundationYear =
        record.brandFoundationYear || null;
    if (record.franchiseStartYear !== undefined)
      franchiseUpdateData.franchiseStartYear =
        record.franchiseStartYear || null;
    if (record.abfSince !== undefined)
      franchiseUpdateData.abfSince = record.abfSince || null;

    // Outros campos
    if (record.isAbfAssociated !== undefined)
      franchiseUpdateData.isAbfAssociated = record.isAbfAssociated || null;

    // Localização
    if (record.headquarterState !== undefined)
      franchiseUpdateData.headquarterState = record.headquarterState || null;
    if (record.headquarter !== undefined)
      franchiseUpdateData.headquarter = record.headquarter || null;

    // ROI Range (numeric only, in months)
    if (record.minimumReturnOnInvestment !== undefined)
      franchiseUpdateData.minimumReturnOnInvestment =
        record.minimumReturnOnInvestment ?? null;
    if (record.maximumReturnOnInvestment !== undefined)
      franchiseUpdateData.maximumReturnOnInvestment =
        record.maximumReturnOnInvestment ?? null;

    // Revenue and fees (numeric only)
    if (record.averageMonthlyRevenue !== undefined)
      franchiseUpdateData.averageMonthlyRevenue =
        record.averageMonthlyRevenue ?? null;
    if (record.franchiseFee !== undefined)
      franchiseUpdateData.franchiseFee = record.franchiseFee ?? null;

    // Percentages (numeric only)
    if (record.royalties !== undefined)
      franchiseUpdateData.royalties = record.royalties ?? null;
    if (record.advertisingFee !== undefined)
      franchiseUpdateData.advertisingFee = record.advertisingFee ?? null;

    // Calculation bases (strings)
    if (record.calculationBaseRoyaltie !== undefined)
      franchiseUpdateData.calculationBaseRoyaltie =
        record.calculationBaseRoyaltie || null;
    if (record.calculationBaseAdFee !== undefined)
      franchiseUpdateData.calculationBaseAdFee =
        record.calculationBaseAdFee || null;

    // Mídia (URLs já processadas pelo download)
    if (record.logoUrl !== undefined)
      franchiseUpdateData.logoUrl = record.logoUrl || null;
    if (record.thumbnailUrl !== undefined)
      franchiseUpdateData.thumbnailUrl = record.thumbnailUrl || null;
    if (record.galleryUrls !== undefined)
      franchiseUpdateData.galleryUrls = record.galleryUrls || null;
    if (record.videoUrl !== undefined)
      franchiseUpdateData.videoUrl = record.videoUrl || null;

    // Outros
    if (record.businessType !== undefined)
      franchiseUpdateData.businessType = record.businessType || '';
    if (record.segment !== undefined)
      franchiseUpdateData.segment = record.segment || '';
    if (record.subsegment !== undefined)
      franchiseUpdateData.subsegment = record.subsegment || '';

    // Status
    if (record.isActive !== undefined)
      franchiseUpdateData.isActive = record.isActive;

    // Data de último scraping
    if (record.lastScrapedAt !== undefined)
      franchiseUpdateData.lastScrapedAt = record.lastScrapedAt || null;

    if (record.scrapedWebsite !== undefined) {
      franchiseUpdateData.scrapedWebsite = record.scrapedWebsite || null;
    }

    // ✅ LOG DOS DADOS QUE SERÃO ATUALIZADOS
    this.logger.debug(
      `Franchise update data:`,
      JSON.stringify(franchiseUpdateData),
    );

    // 3. Preparar dados de contato se existirem
    const hasContactUpdate =
      record.phone !== undefined ||
      record.email !== undefined ||
      record.website !== undefined;

    const contactUpdateData: Record<string, unknown> = {};
    if (record.phone !== undefined)
      contactUpdateData.phone = record.phone || '';
    if (record.email !== undefined)
      contactUpdateData.email = record.email || '';
    if (record.website !== undefined)
      contactUpdateData.website = record.website || '';

    // 4. Atualizar no banco com transação
    return this.prisma.$transaction(async (tx) => {
      // Atualizar franquia
      const updatedFranchise = await tx.franchise.update({
        where: { id: franchiseId },
        data: franchiseUpdateData,
        include: { contact: true },
      });

      // Atualizar contato se houver dados de contato
      if (hasContactUpdate) {
        if (existingFranchise.contact) {
          // Atualizar contato existente
          await tx.contactInfo.update({
            where: { id: existingFranchise.contact.id },
            data: contactUpdateData,
          });
        } else {
          // Criar novo contato se não existir
          const hasValidContactData =
            contactUpdateData.phone ||
            contactUpdateData.email ||
            contactUpdateData.website;

          if (hasValidContactData) {
            const newContact = await tx.contactInfo.create({
              data: {
                phone: (contactUpdateData.phone as string) || '',
                email: (contactUpdateData.email as string) || '',
                website: (contactUpdateData.website as string) || '',
              },
            });

            // Associar o novo contato à franquia
            await tx.franchise.update({
              where: { id: franchiseId },
              data: { contactId: newContact.id },
            });
          }
        }
      }

      return updatedFranchise;
    });
  }

  private getImagePaths(franchise: Franchise) {
    const imageUrls: string[] = [];

    if (franchise.logoUrl) {
      imageUrls.push(franchise.logoUrl);
    }

    if (franchise.thumbnailUrl) {
      imageUrls.push(franchise.thumbnailUrl);
    }

    if (franchise.galleryUrls) {
      try {
        const galleryArray = JSON.parse(franchise.galleryUrls) as unknown[];

        if (Array.isArray(galleryArray)) {
          galleryArray.forEach((url: string) => {
            imageUrls.push(url);
          });
        }
      } catch (parseError) {
        console.warn('Erro ao fazer parse de galleryUrls:', parseError);
      }
    }

    return { imageUrls };
  }
}
