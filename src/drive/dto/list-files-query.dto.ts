import { ApiProperty } from '@nestjs/swagger';

export class ListFilesQueryDto {
  @ApiProperty({
    description:
      'Token de actualización de Google OAuth para acceder a Google Drive',
    example: 'your-refresh-token-here',
    required: true,
  })
  refresh_token: string;
}
