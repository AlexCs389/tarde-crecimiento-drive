import { Injectable } from '@nestjs/common';

import { GoogleDriveService } from '../common/services/google-drive.service';

@Injectable()
export class DriveService {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  async listFiles(refreshToken: string) {
    return this.googleDriveService.listFiles(refreshToken, {
      query:
        "name contains 'Plática de Tarde de crecimiento' and mimeType = 'video/mp4'",
      fields:
        'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
    });
  }
}
