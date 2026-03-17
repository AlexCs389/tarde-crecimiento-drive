import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { DriveService } from './drive.service';
import { ListFilesResponseDto, ListFilesQueryDto } from './dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { UserDto } from '../authentication/dto';

@ApiTags('drive')
@Controller('drive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get('files')
  @ApiOperation({
    summary: 'Listar archivos de Google Drive',
    description:
      'Obtiene la lista de archivos del Google Drive del usuario autenticado. Opcionalmente se puede filtrar por categoría.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos y categorías obtenida exitosamente',
    type: ListFilesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
  })
  async files(@CurrentUser() user: UserDto, @Query() query: ListFilesQueryDto) {
    return this.driveService.listFiles(
      user.id,
      query.category,
      query.date,
      query.search,
    );
  }
}
