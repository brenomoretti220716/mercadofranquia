import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewResponseType } from './schemas/create-review-response.schema';
import { UpdateReviewResponseType } from './schemas/update-review-response.schema';

@Injectable()
export class ReviewResponseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    reviewId: number,
    createDto: CreateReviewResponseType,
    authorId: string,
    authorRole: Role,
  ) {
    // Verificar se a review existe
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { franchise: { include: { owner: true } } },
    });

    if (!review) {
      throw new NotFoundException('Review não encontrada');
    }

    // Verificar permissões: apenas o dono da franquia ou admin podem responder
    const canRespond =
      authorRole === Role.ADMIN ||
      (authorRole === Role.FRANCHISOR && review.franchise.ownerId === authorId);

    if (!canRespond) {
      throw new ForbiddenException(
        'Apenas o proprietário da franquia ou administradores podem responder às avaliações',
      );
    }

    // Verificar se já existe uma resposta (opcional: permitir apenas uma resposta por review)
    const existingResponse = await this.prisma.reviewResponse.findFirst({
      where: { reviewId },
    });

    if (existingResponse) {
      throw new ForbiddenException('Esta avaliação já possui uma resposta');
    }

    return this.prisma.reviewResponse.create({
      data: {
        content: createDto.content,
        reviewId,
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

  async update(
    responseId: number,
    updateDto: UpdateReviewResponseType,
    userId: string,
    userRole: Role,
  ) {
    const response = await this.prisma.reviewResponse.findUnique({
      where: { id: responseId },
      include: { author: true },
    });

    if (!response) {
      throw new NotFoundException('Resposta não encontrada');
    }

    // Verificar permissões: apenas o autor da resposta ou admin podem editar
    const canUpdate = userRole === Role.ADMIN || response.authorId === userId;

    if (!canUpdate) {
      throw new ForbiddenException(
        'Você só pode editar suas próprias respostas',
      );
    }

    return this.prisma.reviewResponse.update({
      where: { id: responseId },
      data: updateDto,
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

  async delete(responseId: number, userId: string, userRole: Role) {
    const response = await this.prisma.reviewResponse.findUnique({
      where: { id: responseId },
      include: { author: true },
    });

    if (!response) {
      throw new NotFoundException('Resposta não encontrada');
    }

    // Verificar permissões: apenas o autor da resposta ou admin podem deletar
    const canDelete = userRole === Role.ADMIN || response.authorId === userId;

    if (!canDelete) {
      throw new ForbiddenException(
        'Você só pode deletar suas próprias respostas',
      );
    }

    await this.prisma.reviewResponse.delete({
      where: { id: responseId },
    });

    return { message: 'Resposta deletada com sucesso' };
  }

  async findByReviewId(reviewId: number) {
    return this.prisma.reviewResponse.findMany({
      where: { reviewId },
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
}
