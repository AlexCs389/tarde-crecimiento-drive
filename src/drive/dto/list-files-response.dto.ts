import { ApiProperty } from '@nestjs/swagger';

class DriveFile {
  @ApiProperty({
    description: 'ID del archivo en Google Drive',
    example: '1a2b3c4d5e6f',
    required: false,
  })
  id?: string | null;

  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'Plática de Tarde de crecimiento.mp4',
    required: false,
  })
  name?: string | null;

  @ApiProperty({
    description: 'Tipo MIME del archivo',
    example: 'video/mp4',
    required: false,
  })
  mimeType?: string | null;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: '1048576',
    required: false,
  })
  size?: string | null;

  @ApiProperty({
    description: 'Fecha de creación del archivo',
    example: '2024-01-27T10:00:00.000Z',
    required: false,
  })
  createdTime?: string | null;

  @ApiProperty({
    description: 'Enlace para ver el archivo en el navegador',
    example: 'https://drive.google.com/file/d/1a2b3c4d5e6f/view',
    required: false,
  })
  webViewLink?: string | null;

  @ApiProperty({
    description: 'Enlace para descargar el archivo',
    example: 'https://drive.google.com/uc?id=1a2b3c4d5e6f&export=download',
    required: false,
  })
  webContentLink?: string | null;
}

export class ListFilesResponseDto {
  @ApiProperty({
    description: 'Lista de archivos del Google Drive',
    type: [DriveFile],
  })
  files: DriveFile[];
}
