import { ApiProperty } from '@nestjs/swagger'

export class CreateAbfSegmentSwaggerDto {
  @ApiProperty({ description: 'Year (ex: 2023)' })
  year: number

  @ApiProperty({ description: 'Quarter (ex: Q4)', example: 'Q4' })
  quarter: string

  @ApiProperty({ description: 'Segment full name' })
  segment: string

  @ApiProperty({ description: 'Segment acronym (ex: SBBE)' })
  acronym: string

  @ApiProperty({ description: 'Faturamento (R$ MM)' })
  value: number
}

