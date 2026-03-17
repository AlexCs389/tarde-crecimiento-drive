import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ListFilesQueryDto {
  @ApiProperty({
    description: 'Clave de categoría para filtrar los archivos (key)',
    example: 'growth_afternoon_talk',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Fecha para filtrar archivos (formato ISO 8601: YYYY-MM-DD)',
    example: '2026-03-13',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
