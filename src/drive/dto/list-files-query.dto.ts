import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListFilesQueryDto {
  @ApiProperty({
    description: 'Clave de categoría para filtrar los archivos (key)',
    example: 'growth_afternoon_talk',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;
}
