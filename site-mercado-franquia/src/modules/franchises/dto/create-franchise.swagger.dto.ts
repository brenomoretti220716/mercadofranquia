import { ApiProperty } from '@nestjs/swagger';

export class CreateFranchiseSwaggerDto {
  @ApiProperty({ example: 'Franquia X', description: 'Nome da franquia' })
  name: string;

  @ApiProperty({
    example: 'Uma franquia de alimentação saudável',
    description: 'Descrição da franquia',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: '10000',
    description: 'Investimento mínimo',
    required: false,
  })
  minimumInvestment?: string;

  @ApiProperty({
    example: '50000',
    description: 'Investimento total',
    required: false,
  })
  totalInvestment?: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Estado da matriz',
    required: false,
  })
  headquarterState?: string;

  @ApiProperty({
    example: 'https://site.com/logo.png',
    description: 'URL do logo',
    required: false,
  })
  logoUrl?: string;

  @ApiProperty({
    example: '1',
    description: 'Posição no ranking',
    required: false,
  })
  rankingPosition?: number;

  @ApiProperty({
    example: 'https://site.com',
    description: 'Site de onde a franquia foi extraída',
    required: false,
  })
  scrapedWebsite?: string;
  // Adicione outros campos relevantes conforme necessário
}
