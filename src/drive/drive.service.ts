import { Injectable, UnauthorizedException } from '@nestjs/common';

import { GoogleDriveService } from '../common/services/google-drive.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriveService {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly prisma: PrismaService,
  ) {}

  async listFiles(userId: string) {
    // Obtener el usuario y su accessToken de Google
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.accessToken) {
      throw new UnauthorizedException(
        'No se encontró el token de acceso de Google para el usuario',
      );
    }

    return this.googleDriveService.listFiles(user.accessToken, {
      query:
        "name contains 'Plática de Tarde de crecimiento' and mimeType = 'video/mp4'",
      fields:
        'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
    });
  }
}
