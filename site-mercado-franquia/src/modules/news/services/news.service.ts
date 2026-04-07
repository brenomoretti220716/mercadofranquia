import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/database/prisma.service';
import { CreateNewsType } from '../schemas/create-news.schema';
import { UpdateNewsType } from '../schemas/update-news.schema';

interface CreateNewsData extends CreateNewsType {
  photoUrl: string;
}

interface UpdateNewsData extends UpdateNewsType {
  photoUrl?: string;
}

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNewsData) {
    return await this.prisma.news.create({
      data: {
        title: data.title,
        category: data.category,
        summary: data.summary,
        content: data.content,
        photoUrl: data.photoUrl,
        isActive: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.news.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllPaginated({
    page = 1,
    limit = 10,
    search = '',
    category,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: Prisma.NewsWhereInput = { isActive: true };

    if (category && category.trim()) {
      where.category = category.trim();
    }

    if (search && search.trim()) {
      const lowerSearch = search.toLowerCase();
      where.OR = [
        { title: { contains: lowerSearch } },
        { category: { contains: lowerSearch } },
        { summary: { contains: lowerSearch } },
        { content: { contains: lowerSearch } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.news.count({ where }),
    ]);
    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    return news;
  }

  async update(id: string, data: UpdateNewsData) {
    // Verificar se a notícia existe
    await this.findById(id);

    return await this.prisma.news.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.category && { category: data.category }),
        ...(data.summary && { summary: data.summary }),
        ...(data.content && { content: data.content }),
        ...(data.photoUrl && { photoUrl: data.photoUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });
  }
}
