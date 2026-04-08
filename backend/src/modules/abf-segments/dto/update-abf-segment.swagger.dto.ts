import { ApiProperty } from '@nestjs/swagger'

export class UpdateAbfSegmentSwaggerDto {
  @ApiProperty({ required: false, description: 'Year (ex: 2023)' })
  year?: number

  @ApiProperty({ required: false, description: 'Quarter (ex: Q4)', example: 'Q4' })
  quarter?: string

  @ApiProperty({ required: false, description: 'Segment full name' })
  segment?: string

  @ApiProperty({ required: false, description: 'Segment acronym (ex: SBBE)' })
  acronym?: string

  @ApiProperty({ required: false, description: 'Faturamento (R$ MM)' })
  value?: number
}

