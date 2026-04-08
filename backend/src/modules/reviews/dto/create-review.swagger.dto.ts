import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewSwaggerDto {
  @ApiProperty({
    description: 'Se a avaliação deve ser anônima',
    example: false,
    default: false,
  })
  anonymous: boolean;

  @ApiProperty({
    description: 'Nota da avaliação (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @ApiProperty({
    description: 'Comentário da avaliação',
    example: 'Excelente franquia, muito satisfeito com o suporte.',
    minLength: 1,
    maxLength: 2000,
  })
  comment: string;
}
