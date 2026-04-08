import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { CreateNewsCommentType } from './schemas/create-news-comment.schema';

@Injectable()
export class NewsCommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    newsId: string,
    createDto: CreateNewsCommentType,
    authorId: string,
  ) {
    // Verificar se a notícia existe
    const news = await this.prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    // Verificar se o perfil do usuário está completo
    const isProfileComplete =
      await this.usersService.isProfileComplete(authorId);
    if (!isProfileComplete) {
      throw new ForbiddenException(
        'Complete seu perfil para usar esta funcionalidade',
      );
    }

    // Criar comentário
    return this.prisma.newsComment.create({
      data: {
        content: createDto.content,
        newsId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async findByNewsId(newsId: string) {
    return this.prisma.newsComment.findMany({
      where: { newsId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(commentId: string, userId: string, userRole: Role) {
    const comment = await this.prisma.newsComment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    // Apenas admin pode deletar
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem deletar comentários',
      );
    }

    await this.prisma.newsComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comentário deletado com sucesso' };
  }
}


