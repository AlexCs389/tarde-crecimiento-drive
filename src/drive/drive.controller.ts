import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { DriveService } from './drive.service';
import { ListFilesResponseDto } from './dto';
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
      'Obtiene la lista de archivos del Google Drive del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos obtenida exitosamente',
    type: ListFilesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
  })
  async files(@CurrentUser() user: UserDto) {
    const files = await this.driveService.listFiles(user.id);
    return { files };
  }
}
