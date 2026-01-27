import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { DriveService } from './drive.service';
import { ListFilesQueryDto, ListFilesResponseDto } from './dto';

@ApiTags('drive')
@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get('files')
  @ApiOperation({
    summary: 'Listar archivos de Google Drive',
    description:
      'Obtiene la lista de archivos del Google Drive del usuario usando un refresh token de OAuth',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos obtenida exitosamente',
    type: ListFilesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Solicitud inválida - refresh_token faltante o inválido',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
  })
  async files(@Query() query: ListFilesQueryDto) {
    const files = await this.driveService.listFiles(query.refresh_token);
    return { files };
  }
}
